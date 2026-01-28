"use client";
import { useState } from "react";

export default function AdminLogin() {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        window.location.href = "/admin";
      } else {
        setError(data.error || "Falsches Passwort");
      }
    } catch (err: any) {
      setError(err?.message || "Fehler beim Login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: "40px auto" }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleLogin}>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          placeholder="Passwort"
          disabled={loading}
          style={{ width: "100%", padding: 12, marginBottom: 12 }}
        />
        <button type="submit" className="btn" style={{ width: "100%" }} disabled={loading}>
          {loading ? "Laden..." : "Login"}
        </button>
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </form>
    </main>
  );
}
