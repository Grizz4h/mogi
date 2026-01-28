"use client";

import { useEffect, useState } from "react";

interface Idea {
  id: string;
  text: string;
  status: string;
  createdAt: string;
}

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

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "release">("all");

  async function fetchIdeas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ideas");
      const data = await res.json();
      setIdeas(data.ideas || []);
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

  async function startEdit(idea: Idea) {
    setEditId(idea.id);
    setEditText(idea.text);
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    try {
      await fetch(`/api/admin/ideas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      setEditId(null);
      fetchIdeas();
    } catch (e) {
      alert("Fehler beim Speichern");
    }
  }

  function cancelEdit() {
    setEditId(null);
    setEditText("");
  }

  async function deleteIdea(id: string) {
    if (!confirm("Idee wirklich löschen?")) return;
    try {
      await fetch(`/api/admin/ideas/${id}`, {
        method: "DELETE",
      });
      fetchIdeas();
    } catch (e) {
      alert("Fehler beim Löschen");
    }
  }

  const filteredIdeas = ideas.filter(idea => {
    if (filter === "all") return true;
    return idea.status === filter;
  });

  useEffect(() => {
    fetchIdeas();
  }, []);

  return (
    <main style={{ maxWidth: 600, margin: "40px auto", padding: "0 14px" }}>
      <h1>Ideen Moderation</h1>
      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        <button
          onClick={() => setFilter("all")}
          style={{
            padding: "8px 16px",
            background: filter === "all" ? "#4a9eff" : "#666",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Alle ({ideas.length})
        </button>
        <button
          onClick={() => setFilter("pending")}
          style={{
            padding: "8px 16px",
            background: filter === "pending" ? "#4a9eff" : "#666",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Pending ({ideas.filter(i => i.status === "pending").length})
        </button>
        <button
          onClick={() => setFilter("release")}
          style={{
            padding: "8px 16px",
            background: filter === "release" ? "#4a9eff" : "#666",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Freigegeben ({ideas.filter(i => i.status === "release").length})
        </button>
      </div>
      {loading && <div>Lade...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredIdeas.map((idea) => (
          <li
            key={idea.id}
            style={{
              margin: "16px 0",
              padding: 12,
              border: "1px solid #ccc",
              borderRadius: 8,
              background: idea.status === "release" ? "rgba(100,200,100,0.1)" : "rgba(200,100,100,0.1)",
            }}
          >
            {editId === idea.id ? (
              <div style={{ marginBottom: 12 }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 4,
                    border: "1px solid #999",
                    fontFamily: "inherit",
                    fontSize: 14,
                    minHeight: 80,
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => saveEdit(idea.id)}
                    style={{
                      padding: "8px 12px",
                      background: "#4a9eff",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Speichern
                  </button>
                  <button
                    onClick={cancelEdit}
                    style={{
                      padding: "8px 12px",
                      background: "#666",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 8, fontSize: 14 }}>{idea.text}</div>
                <div style={{ marginBottom: 8, fontSize: 12, color: "#999" }}>
                  Status: {idea.status}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => startEdit(idea)}
                    style={{
                      padding: "6px 12px",
                      background: "#4a9eff",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Editieren
                  </button>
                  <button
                    onClick={() => releaseIdea(idea.id)}
                    disabled={idea.status === "release"}
                    style={{
                      padding: "6px 12px",
                      background: idea.status === "release" ? "#666" : "#52c41a",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: idea.status === "release" ? "not-allowed" : "pointer",
                      opacity: idea.status === "release" ? 0.6 : 1,
                    }}
                  >
                    {idea.status === "release" ? "Freigegeben" : "Freigeben"}
                  </button>
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    style={{
                      padding: "6px 12px",
                      background: "#ff4d4f",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Löschen
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
