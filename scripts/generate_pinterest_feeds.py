"""Generate Pinterest RSS 2.0 XML feeds and Bulk Create CSV from rooms.json (0 LLM tokens)."""

from __future__ import annotations

import csv
import json
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path
from xml.sax.saxutils import escape

STOREFRONT_ROOT = Path(__file__).resolve().parent.parent
ROOMS_PATH = STOREFRONT_ROOT / "src" / "data" / "rooms.json"
AUDIT_PATH = STOREFRONT_ROOT / "reports" / "audit-latest.json"
PUBLIC_DIR = STOREFRONT_ROOT / "public"
FEEDS_DIR = PUBLIC_DIR / "feeds"
DOMAIN = "https://dailydecorinspo.vercel.app"
DISCLOSURE = "#ad As an Amazon Associate, I earn from qualifying purchases."
ETSY_NOTE = "Includes a handmade piece from our own Etsy shop."


def has_etsy(room: dict) -> bool:
    return any(p.get("store") == "etsy" for p in room.get("products", []))


def room_disclosure(room: dict) -> str:
    """Amazon #ad line, plus own-shop material-connection note when an Etsy item is in the room."""
    if has_etsy(room):
        return f"{ETSY_NOTE} {DISCLOSURE}"
    return DISCLOSURE

# Single source of truth: src/data/categories.json (shared with the site and publish-pin.mjs)
CATEGORY_META: dict[str, dict[str, str]] = {
    cid: {"board": c["board"], "title": c["feedTitle"], "tags": c["tags"], "keywords": c["keywords"]}
    for cid, c in json.loads((STOREFRONT_ROOT / "src" / "data" / "categories.json").read_text(encoding="utf-8")).items()
}


def load_broken_link_rooms() -> set[str]:
    """Return room IDs flagged with HTTP 404 links in the latest audit report, if present."""
    if not AUDIT_PATH.exists():
        return set()
    try:
        audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()

    flagged: set[str] = set()
    for room in audit.get("rooms", []):
        for prod in room.get("products", []):
            if prod.get("httpStatus") == 404 or prod.get("onlineStatus") == "HTTP_404":
                flagged.add(room.get("id", ""))
    return flagged


def build_pin_records(rooms: list[dict], broken_rooms: set[str]) -> list[dict]:
    """Build Pin A and Pin B metadata dictionaries for every room with ready pin images."""
    records: list[dict] = []
    tomorrow_utc = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
        hour=18, minute=0, second=0, microsecond=0
    )
    schedule_idx = 0

    for idx, room in enumerate(rooms):
        room_num = f"{idx + 1:02d}"
        category = room.get("category", "bedroom")
        meta = CATEGORY_META.get(category, CATEGORY_META["bedroom"])
        room_url = f"{DOMAIN}/room/{room['slug']}/"

        if room["id"] in broken_rooms:
            print(f"  [warn] Room #{room_num} ({room['id']}) has 404 links in audit-latest.json")

        base_dt = datetime.strptime(room.get("createdAt", "2026-11-04"), "%Y-%m-%d").replace(
            hour=16, minute=idx % 60, tzinfo=timezone.utc
        )

        # Pin A (Aesthetic) & Pin B (Catalog)
        variants = [
            ("a", "aesthetic"),
            ("b", "catalog"),
        ]
        for short_key, file_suffix in variants:
            pin_rel = f"images/pins/room-{room_num}-{file_suffix}.jpg"
            pin_path = PUBLIC_DIR / pin_rel
            if not pin_path.exists():
                continue

            pin_url = f"{DOMAIN}/{pin_rel}"
            file_bytes = pin_path.stat().st_size

            if short_key == "a":
                # Rooms with an own-shop Etsy anchor are not "budget Amazon finds"
                finds = "finds" if has_etsy(room) else "Amazon finds"
                title = (
                    f"{room['title']} Ideas (Shop the Look)"
                    if has_etsy(room)
                    else f"{room['title']} Ideas on a Budget (Amazon Finds)"
                )
                desc = (
                    f"Curated Room #{room_num}: {room['title']} — {room['subtitle']}. "
                    f"Tap to shop all {len(room['products'])} {finds} ({room['totalPrice']}).\n\n"
                    f"{meta['tags']}\n\n{room_disclosure(room)}"
                )
                pub_dt = base_dt
            else:
                amazon_word = "" if has_etsy(room) else "Amazon "
                title = f"Shop the Look: {len(room['products'])} {amazon_word}Finds for {room['title']} ({room['totalPrice']})"
                # Pinterest truncates descriptions over 500 chars, which would cut the
                # #ad disclosure at the end — drop list items until it fits.
                item_lines = [
                    f"{p['number']}. {p['name']} ({p['priceRange']})"
                    for p in room["products"][:6]
                ]
                total = len(room["products"])
                while True:
                    shown = item_lines[:]
                    if len(shown) < total:
                        shown.append(f"+ {total - len(shown)} more on the site")
                    desc = (
                        f"Shop the Look Room #{room_num}! Curated {amazon_word}pieces:\n\n"
                        + "\n".join(shown)
                        + "\n\nTap to visit Daily Decor Inspo for direct links!\n\n"
                        f"{meta['tags']}\n\n{room_disclosure(room)}"
                    )
                    if len(desc) <= 500 or len(item_lines) <= 2:
                        break
                    item_lines.pop()
                pub_dt = base_dt + timedelta(minutes=10)

            publish_date = (tomorrow_utc + timedelta(days=schedule_idx)).strftime("%Y-%m-%dT%H:%M:%S")
            schedule_idx += 1

            records.append(
                {
                    "room_num": room_num,
                    "category": category,
                    "board": meta["board"],
                    "keywords": meta["keywords"],
                    "title": title,
                    "description": desc,
                    # Unique link per pin: Pinterest bulk create skips rows whose destination URL
                    # repeats (only Pin A survived when A and B shared the room URL). UTM params
                    # also let us see which pin drives clicks.
                    "link": (
                        f"{room_url}?utm_source=pinterest&utm_medium=social"
                        f"&utm_campaign=room-{room_num}&utm_content={file_suffix}"
                    ),
                    "media_url": pin_url,
                    "media_bytes": file_bytes,
                    "guid": f"dailydecorinspo-{room['id']}-pin-{short_key}",
                    "pub_date_rfc": format_datetime(pub_dt, usegmt=True),
                    "publish_date_csv": publish_date,
                }
            )
    return records


def render_rss_xml(
    channel_title: str,
    channel_desc: str,
    feed_self_url: str,
    items: list[dict],
) -> str:
    """Render an RSS 2.0 XML document with Media RSS and Atom self-link."""
    now_rfc = format_datetime(datetime.now(timezone.utc), usegmt=True)
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        f"    <title>{escape(channel_title)}</title>",
        f"    <link>{escape(DOMAIN + '/')}</link>",
        f"    <description>{escape(channel_desc)}</description>",
        "    <language>en-us</language>",
        f"    <lastBuildDate>{escape(now_rfc)}</lastBuildDate>",
        f'    <atom:link href="{escape(feed_self_url)}" rel="self" type="application/rss+xml" />',
    ]

    for item in items:
        lines.extend(
            [
                "    <item>",
                f"      <title>{escape(item['title'])}</title>",
                f"      <link>{escape(item['link'])}</link>",
                f"      <guid isPermaLink=\"false\">{escape(item['guid'])}</guid>",
                f"      <pubDate>{escape(item['pub_date_rfc'])}</pubDate>",
                f"      <category>{escape(item['board'])}</category>",
                f"      <description>{escape(item['description'])}</description>",
                (
                    f'      <enclosure url="{escape(item["media_url"])}" '
                    f'length="{item["media_bytes"]}" type="image/jpeg" />'
                ),
                (
                    f'      <media:content url="{escape(item["media_url"])}" '
                    f'medium="image" type="image/jpeg" width="1000" height="1500" />'
                ),
                "    </item>",
            ]
        )

    lines.extend(["  </channel>", "</rss>", ""])
    return "\n".join(lines)


def write_bulk_csv(path: Path, items: list[dict]) -> None:
    """Write a Pinterest Business Bulk Create CSV with staggered daily UTC schedule."""
    headers = [
        "Title",
        "Media URL",
        "Pinterest board",
        "Thumbnail",
        "Description",
        "Link",
        "Publish date",
        "Keywords",
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for item in items:
            # Collapse newlines slightly inside CSV description while keeping readability
            clean_desc = item["description"].replace("\r\n", "\n")
            writer.writerow(
                [
                    item["title"][:100],
                    item["media_url"],
                    item["board"],
                    "",
                    clean_desc[:800],
                    item["link"],
                    item["publish_date_csv"],
                    item["keywords"],
                ]
            )


def main() -> int:
    """Generate master RSS, per-category RSS channels, and Pinterest Bulk Upload CSV."""
    rooms_data = json.loads(ROOMS_PATH.read_text(encoding="utf-8"))
    rooms = rooms_data.get("rooms", [])
    broken_rooms = load_broken_link_rooms()

    FEEDS_DIR.mkdir(parents=True, exist_ok=True)
    records = build_pin_records(rooms, broken_rooms)

    # Master RSS feed
    master_xml = render_rss_xml(
        channel_title="Daily Decor Inspo — Curated Amazon Room Finds",
        channel_desc=f"Curated budget-friendly Amazon home decor rooms. {DISCLOSURE}",
        feed_self_url=f"{DOMAIN}/feed.xml",
        items=records,
    )
    (PUBLIC_DIR / "feed.xml").write_text(master_xml, encoding="utf-8")

    # Per-category RSS feeds (write every category in CATEGORY_META so board feeds exist)
    for cat, meta in CATEGORY_META.items():
        cat_items = [r for r in records if r["category"] == cat]
        cat_xml = render_rss_xml(
            channel_title=f"Daily Decor Inspo — {meta['title']}",
            channel_desc=f"{meta['title']} curated from Amazon. {DISCLOSURE}",
            feed_self_url=f"{DOMAIN}/feeds/{cat}.xml",
            items=cat_items,
        )
        (FEEDS_DIR / f"{cat}.xml").write_text(cat_xml, encoding="utf-8")

    # Pinterest Business Bulk Create CSV
    csv_path = FEEDS_DIR / "pinterest-bulk-upload.csv"
    write_bulk_csv(csv_path, records)

    print(
        f"[generate_pinterest_feeds] pins={len(records)}, "
        f"feeds={len(CATEGORY_META) + 1} XML + 1 CSV -> {FEEDS_DIR.relative_to(STOREFRONT_ROOT).as_posix()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
