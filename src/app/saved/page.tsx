import type { Metadata } from "next";
import { SavedList } from "@/components/SavedList";

export const metadata: Metadata = {
  title: "Saved — Daily Decor Inspo",
  description: "The rooms and pieces you saved on Daily Decor Inspo.",
  robots: { index: false },
};

export default function SavedPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-10 pb-8">
      <h1 className="font-display text-4xl sm:text-5xl font-medium text-ink tracking-tight">Saved</h1>
      <p className="mt-3 mb-10 text-ink-2">Your shortlist of rooms and pieces.</p>
      <SavedList />
    </div>
  );
}
