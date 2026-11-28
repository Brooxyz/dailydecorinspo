"use client";

import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Keep it handy": installs the site to the home screen where the browser allows it (Chrome, Edge,
 *  Android), otherwise shows the right one-line instruction (iPhone share sheet, or Ctrl/Cmd+D). */
export function KeepHandy({ className = "" }: { className?: string }) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent); };
    const onInstalled = () => setDone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setDone(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (done) return null;

  const onClick = async () => {
    if (install) {
      await install.prompt();
      const { outcome } = await install.userChoice;
      if (outcome === "accepted") setDone(true);
      setInstall(null);
      return;
    }
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
    const mac = /Mac/.test(ua);
    const mobile = /Android|Mobi/.test(ua);
    setHint(
      ios ? "Tap the Share button, then Add to Home Screen."
      : mobile ? "Open the browser menu, then Add to Home screen."
      : `Press ${mac ? "⌘" : "Ctrl"}+D to bookmark this site.`
    );
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHint(null), 7000);
  };

  return (
    <div className={`relative inline-flex flex-col items-start gap-2 ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-line bg-surface text-ink text-sm font-semibold hover:border-muted transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
        {install ? "Add to your home screen" : "Keep it handy"}
      </button>
      {hint && (
        <span role="status" className="hero-tag text-xs text-ink-2 bg-surface-2 border border-line rounded-lg px-3 py-2">
          {hint}
        </span>
      )}
    </div>
  );
}
