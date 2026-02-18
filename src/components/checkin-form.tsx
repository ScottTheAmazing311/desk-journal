"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_USER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_USER_ID ||
  "00000000-0000-0000-0000-000000000000";

const FALLBACK_QUESTION = "What's on your mind right now?";

interface PromptData {
  question_id?: string;
  question_text: string;
  category?: string;
}

export function CheckinForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState<PromptData | null>(null);
  const [transcript, setTranscript] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPrompt() {
    try {
      const res = await fetch(
        `/api/next-prompt?user_id=${encodeURIComponent(DEFAULT_USER_ID)}`
      );
      if (!res.ok) throw new Error("Failed to fetch prompt");
      const data: PromptData = await res.json();
      setPrompt(data);
    } catch {
      setPrompt({ question_text: FALLBACK_QUESTION });
    }
  }

  useEffect(() => {
    fetchPrompt();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transcript.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript.trim(),
          recorded_at: new Date().toISOString(),
          user_id: DEFAULT_USER_ID,
          question_id: prompt?.question_id || null,
          question_text: prompt?.question_text || FALLBACK_QUESTION,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save check-in");
      }

      setTranscript("");
      await fetchPrompt();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const questionText = prompt?.question_text || FALLBACK_QUESTION;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-5"
    >
      <label
        htmlFor="checkin-input"
        className="block text-sm font-medium text-foreground/80"
      >
        {questionText}
      </label>

      <textarea
        id="checkin-input"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        disabled={saving}
        placeholder="Type your response…"
        rows={3}
        className="mt-2 w-full resize-none rounded-md border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
      />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={saving || !transcript.trim()}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Check in"}
        </button>
      </div>
    </form>
  );
}
