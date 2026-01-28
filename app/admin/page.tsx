"use client";

import { useEffect, useState } from "react";

export default function AdminIdeas() {
  // Clientseitiger Admin-Check
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isAdmin = document.cookie.split(";").some((c) => c.trim() === "admin=1");
      if (!isAdmin) {
        window.location.href = "/admin/login";
      }
    }
  }, []);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchIdeas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ideas");
      const data = await res.json();
      setIdeas(data.ideas);
    } catch (e: any) {
      setError(e?.message || "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  async function releaseIdea(id: string) {
    await fetch(`/api/admin/ideas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "release" }),
    });
    fetchIdeas();
  }

  useEffect(() => {
    fetchIdeas();
  }, []);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Ideen Moderation</h1>
      {loading && <div>Lade...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {ideas.map((idea) => (
          <li key={idea.id} style={{ margin: "16px 0", padding: 12, border: "1px solid #ccc", borderRadius: 8 }}>
            <div style={{ marginBottom: 8 }}>{idea.text}</div>
            <button onClick={() => releaseIdea(idea.id)} disabled={idea.status === "release"}>
              {idea.status === "release" ? "Freigegeben" : "Freigeben"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
