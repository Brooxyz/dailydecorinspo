"""Zero-token storefront, image-quality, disclosure & optional live link auditor."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from PIL import Image

STOREFRONT_ROOT = Path(__file__).resolve().parent.parent
ROOMS_PATH = STOREFRONT_ROOT / "src" / "data" / "rooms.json"
PUBLIC_DIR = STOREFRONT_ROOT / "public"
LAYOUT_PATH = STOREFRONT_ROOT / "src" / "app" / "layout.tsx"
ROOM_PAGE_PATH = STOREFRONT_ROOT / "src" / "app" / "room" / "[slug]" / "page.tsx"
REPORTS_DIR = STOREFRONT_ROOT / "reports"
AFFILIATE_TAG = "dailydecorins-20"
DISCLOSURE_PHRASE = "As an Amazon Associate, I earn from qualifying purchases."

HTTP_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def sha256_file(path: Path) -> str:
    """Compute SHA-256 hex digest for duplicate-image detection."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def border_white_ratio(path: Path) -> float:
    """Return fraction of outer 6% border pixels with R,G,B >= 235."""
    with Image.open(path) as img:
        rgb = img.convert("RGB")
        arr = np.asarray(rgb)
    h, w, _ = arr.shape
    pad_y = max(2, int(h * 0.06))
    pad_x = max(2, int(w * 0.06))

    top = arr[:pad_y, :, :].reshape(-1, 3)
    bottom = arr[h - pad_y :, :, :].reshape(-1, 3)
    left = arr[pad_y : h - pad_y, :pad_x, :].reshape(-1, 3)
    right = arr[pad_y : h - pad_y, w - pad_x :, :].reshape(-1, 3)
    border = np.concatenate([top, bottom, left, right], axis=0)
    near_white = (border[:, 0] >= 235) & (border[:, 1] >= 235) & (border[:, 2] >= 235)
    return float(np.mean(near_white))


def parse_price_range(price_range: str) -> tuple[float, float] | None:
    """Parse '$25-35' into (25.0, 35.0)."""
    nums = re.findall(r"\d+(?:\.\d+)?", price_range or "")
    if not nums:
        return None
    vals = [float(n) for n in nums]
    return min(vals), max(vals)


def check_disclosure(path: Path) -> dict:
    """Verify a TSX file contains both `#ad` and mandatory Amazon Associates sentence."""
    if not path.exists():
        return {"ok": False, "hasAd": False, "hasDisclosure": False}
    normalized = " ".join(path.read_text(encoding="utf-8").split())
    has_ad = "#ad" in normalized
    has_phrase = DISCLOSURE_PHRASE in normalized
    return {"ok": has_ad and has_phrase, "hasAd": has_ad, "hasDisclosure": has_phrase}


def check_xml_feeds() -> list[dict]:
    """Validate XML well-formedness for public/feed.xml and public/feeds/*.xml."""
    results: list[dict] = []
    xml_paths: list[Path] = []
    if (PUBLIC_DIR / "feed.xml").exists():
        xml_paths.append(PUBLIC_DIR / "feed.xml")
    if (PUBLIC_DIR / "feeds").exists():
        xml_paths.extend(sorted((PUBLIC_DIR / "feeds").glob("*.xml")))

    for xp in xml_paths:
        rel = xp.relative_to(STOREFRONT_ROOT).as_posix()
        try:
            tree = ET.parse(xp)
            items = len(tree.findall("./channel/item"))
            results.append({"file": rel, "valid": True, "items": items})
        except ET.ParseError as exc:
            results.append({"file": rel, "valid": False, "error": str(exc)})
    return results


def check_single_link(room_id: str, prod_num: int, url: str, price_range: str) -> dict:
    """Fetch a single Amazon or amzn.to URL politely without attempting any CAPTCHA bypass."""
    req = urllib.request.Request(url, headers=HTTP_HEADERS)
    result: dict = {
        "roomId": room_id,
        "number": prod_num,
        "url": url,
        "httpStatus": None,
        "finalUrl": url,
        "tagPresentInFinalUrl": AFFILIATE_TAG in url,
        "onlineStatus": "UNKNOWN",
        "observedPrice": None,
        "priceDrift": False,
    }
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            final_url = resp.geturl()
            html = resp.read().decode("utf-8", errors="ignore")
            result["httpStatus"] = resp.status
            result["finalUrl"] = final_url
            result["tagPresentInFinalUrl"] = AFFILIATE_TAG in final_url or "amzn.to" in final_url

            lower = html.lower()
            if "validatecaptcha" in lower or ("captcha" in lower and len(html) < 20000):
                result["onlineStatus"] = "CAPTCHA_SKIPPED"
                return result
            oos_block = re.search(
                r'id="(?:outOfStock|availabilityInsideBuyBox_feature_div|availability_feature_div)"[^>]*>(.*?)</div>',
                html,
                re.S | re.I,
            )
            oos_text = re.sub(r"<[^>]+>", " ", oos_block.group(1)).lower() if oos_block else ""
            if (
                "we don't know when or if this item will be back in stock" in lower
                or "currently unavailable" in oos_text
            ):
                result["onlineStatus"] = "OUT_OF_STOCK"
                return result

            result["onlineStatus"] = "LIVE"
            # Attempt best-effort USD buybox price extraction
            pm = re.search(r'"priceToPay"[^}]*?"value"\s*:\s*(\d+(?:\.\d+)?)', html)
            if not pm:
                pm = re.search(r'class="a-offscreen">\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*<', html)
            if pm:
                price_val = float(pm.group(1).replace(",", ""))
                result["observedPrice"] = price_val
                bounds = parse_price_range(price_range)
                if bounds:
                    low, high = bounds
                    if price_val > high * 1.4 or price_val < low * 0.6:
                        result["priceDrift"] = True
            return result
    except urllib.error.HTTPError as exc:
        result["httpStatus"] = exc.code
        result["onlineStatus"] = f"HTTP_{exc.code}"
        return result
    except Exception as exc:  # noqa: BLE001
        result["onlineStatus"] = f"ERR_{type(exc).__name__}"
        return result


def main() -> int:
    """Run offline/online audit, save JSON report, and print compact summary."""
    parser = argparse.ArgumentParser(description="Zero-token Daily Decor Inspo auditor.")
    parser.add_argument("--online", action="store_true", help="Check live Amazon / amzn.to URLs.")
    parser.add_argument("--strict", action="store_true", help="Exit 1 on critical errors.")
    args = parser.parse_args()

    rooms_data = json.loads(ROOMS_PATH.read_text(encoding="utf-8"))
    rooms = rooms_data.get("rooms", [])

    disclosures = {
        "layout": check_disclosure(LAYOUT_PATH),
        "roomPage": check_disclosure(ROOM_PAGE_PATH),
    }
    xml_checks = check_xml_feeds()

    room_reports: list[dict] = []
    online_tasks: list[tuple[str, int, str, str]] = []
    critical_issues: list[str] = []
    warnings: list[str] = []

    if not disclosures["layout"]["ok"]:
        critical_issues.append("Homepage layout.tsx missing #ad or disclosure text")
    if not disclosures["roomPage"]["ok"]:
        critical_issues.append("Room page.tsx missing #ad or disclosure text")
    for x in xml_checks:
        if not x["valid"]:
            critical_issues.append(f"Invalid XML feed {x['file']}: {x.get('error')}")

    for idx, room in enumerate(rooms):
        room_num = f"{idx + 1:02d}"
        hero_rel = room["roomImage"].lstrip("/")
        hero_path = PUBLIC_DIR / hero_rel
        hero_ok = hero_path.exists()
        hero_dims = None
        if hero_ok:
            with Image.open(hero_path) as im:
                hero_dims = f"{im.width}x{im.height}"
                if (im.width, im.height) != (1000, 1500):
                    warnings.append(f"Room #{room_num} hero {hero_dims} != 1000x1500")
        else:
            critical_issues.append(f"Room #{room_num} missing hero image {hero_rel}")

        pin_a = PUBLIC_DIR / f"images/pins/room-{room_num}-aesthetic.jpg"
        pin_b = PUBLIC_DIR / f"images/pins/room-{room_num}-catalog.jpg"
        for label, ppath in [("Pin A", pin_a), ("Pin B", pin_b)]:
            if not ppath.exists():
                warnings.append(f"Room #{room_num} missing {label}")
            else:
                with Image.open(ppath) as im:
                    if (im.width, im.height) != (1000, 1500):
                        warnings.append(f"Room #{room_num} {label} is {im.width}x{im.height}")

        seen_hashes: dict[str, int] = {}
        prod_reports: list[dict] = []
        for p in room.get("products", []):
            is_etsy = p.get("store") == "etsy"
            if is_etsy:
                # Own-shop handmade item: clean etsy.com listing link, no Amazon tag needed
                url = p.get("shopUrl", "")
                tag_ok = url.startswith("https://www.etsy.com/listing/") and "?" not in url
                if not tag_ok:
                    critical_issues.append(f"Room #{room_num} #{p['number']} bad Etsy shopUrl (use clean https://www.etsy.com/listing/ID)")
            else:
                url = p.get("amazonUrl", "")
                tag_ok = (AFFILIATE_TAG in url) or url.startswith("https://amzn.to/")
                if not tag_ok:
                    critical_issues.append(f"Room #{room_num} #{p['number']} missing tag {AFFILIATE_TAG}")

            img_rel = p["image"].lstrip("/")
            img_path = PUBLIC_DIR / img_rel
            img_ok = img_path.exists()
            white_ratio = None
            duplicate_of = None
            dims = None

            if not img_ok:
                critical_issues.append(f"Room #{room_num} #{p['number']} missing image {img_rel}")
            else:
                with Image.open(img_path) as im:
                    dims = f"{im.width}x{im.height}"
                digest = sha256_file(img_path)
                if digest in seen_hashes:
                    duplicate_of = seen_hashes[digest]
                    critical_issues.append(
                        f"Room #{room_num} #{p['number']} duplicate image of #{duplicate_of}"
                    )
                else:
                    seen_hashes[digest] = p["number"]

                white_ratio = round(border_white_ratio(img_path), 3)
                if white_ratio < 0.70:
                    warnings.append(
                        f"Room #{room_num} #{p['number']} NON_WHITE_BG (white={white_ratio:.0%})"
                    )

            prod_reports.append(
                {
                    "number": p["number"],
                    "name": p["name"],
                    "priceRange": p.get("priceRange", ""),
                    "url": url,
                    "tagOk": tag_ok,
                    "imageOk": img_ok,
                    "dims": dims,
                    "whiteBorderRatio": white_ratio,
                    "duplicateOf": duplicate_of,
                }
            )
            # Etsy blocks automated checks; own-shop listings are verified manually
            if args.online and not is_etsy:
                online_tasks.append((room["id"], p["number"], url, p.get("priceRange", "")))

        room_reports.append(
            {
                "roomNumber": room_num,
                "id": room["id"],
                "title": room["title"],
                "heroOk": hero_ok,
                "heroDims": hero_dims,
                "pinAOk": pin_a.exists(),
                "pinBOk": pin_b.exists(),
                "products": prod_reports,
            }
        )

    if args.online and online_tasks:
        online_map: dict[tuple[str, int], dict] = {}
        with ThreadPoolExecutor(max_workers=3) as pool:
            futs = [pool.submit(check_single_link, *task) for task in online_tasks]
            for fut in as_completed(futs):
                res = fut.result()
                online_map[(res["roomId"], res["number"])] = res

        for rr in room_reports:
            for pr in rr["products"]:
                info = online_map.get((rr["id"], pr["number"]), {})
                pr["httpStatus"] = info.get("httpStatus")
                pr["finalUrl"] = info.get("finalUrl")
                pr["tagPresentInFinalUrl"] = info.get("tagPresentInFinalUrl")
                pr["onlineStatus"] = info.get("onlineStatus")
                pr["observedPrice"] = info.get("observedPrice")
                pr["priceDrift"] = info.get("priceDrift")
                st = pr["onlineStatus"]
                if st == "HTTP_404":
                    critical_issues.append(f"Room #{rr['roomNumber']} #{pr['number']} 404 ({pr['name']})")
                elif st == "OUT_OF_STOCK":
                    warnings.append(f"Room #{rr['roomNumber']} #{pr['number']} OUT_OF_STOCK ({pr['name']})")
                elif pr.get("priceDrift"):
                    warnings.append(
                        f"Room #{rr['roomNumber']} #{pr['number']} price drift: ${pr['observedPrice']} vs {pr['priceRange']}"
                    )

    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "mode": "online" if args.online else "offline",
        "disclosures": disclosures,
        "xmlFeeds": xml_checks,
        "criticalCount": len(critical_issues),
        "warningCount": len(warnings),
        "criticalIssues": critical_issues,
        "warnings": warnings,
        "rooms": room_reports,
    }
    report_path = REPORTS_DIR / "audit-latest.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    # Compact summary table (< 35 lines)
    print(f"\n=== Daily Decor Inspo Audit ({report['mode']}) ===")
    print(
        f"Disclosure: layout={disclosures['layout']['ok']} roomPage={disclosures['roomPage']['ok']} | "
        f"XML feeds: {sum(1 for x in xml_checks if x['valid'])}/{len(xml_checks)} valid"
    )
    for rr in room_reports:
        non_white = [
            f"#{p['number']}"
            for p in rr["products"]
            if p["whiteBorderRatio"] is not None and p["whiteBorderRatio"] < 0.70
        ]
        dups = [f"#{p['number']}==#{p['duplicateOf']}" for p in rr["products"] if p["duplicateOf"]]
        extra = ""
        if args.online:
            dead = [f"#{p['number']}:{p.get('onlineStatus')}" for p in rr["products"] if p.get("onlineStatus") in ("HTTP_404", "OUT_OF_STOCK")]
            if dead:
                extra += f" | link=[{','.join(dead)}]"
        print(
            f"Room {rr['roomNumber']}: {len(rr['products'])} items | hero={rr['heroDims']} "
            f"pins={rr['pinAOk'] and rr['pinBOk']} | nonWhite={non_white or 'none'} "
            f"dups={dups or 'none'}{extra}"
        )
    print(f"Summary: critical={len(critical_issues)}, warnings={len(warnings)} -> {report_path.relative_to(STOREFRONT_ROOT).as_posix()}")

    if args.strict and critical_issues:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
