"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Idea = {
  id: string;
  text: string;
  yesCount: number;
  noCount: number;
};

type VoteDir = "yes" | "no";

const SWIPE_THRESHOLD_PX = 170;
const ROTATE_MAX_DEG = 10;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export default function SwipeDeck() {
  const [newIdea, setNewIdea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Drag state
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [motion, setMotion] = useState<"none" | "snap" | "throw">("none");
  const [snapMs, setSnapMs] = useState(220);
  // Exit/Entry Animation State
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const pointerId = useRef<number | null>(null);
  const intentLocked = useRef<null | "swipe" | "scroll">(null);
  const swipeStartTime = useRef<number | null>(null);

  const current = ideas[idx];

  const stamp = useMemo(() => {
    if (!dragging) return "none";
    if (dx > 30) return "yes";
    if (dx < -30) return "no";
    return "none";
  }, [dx, dragging]);

  const progress = useMemo(() => dragging ? clamp(Math.abs(dx) / SWIPE_THRESHOLD_PX, 0, 1) : 0, [dx, dragging]);
  const dir = dx > 0 ? "yes" : "no";

  const rotate = useMemo(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 390;
    const ratio = Math.max(-1, Math.min(1, dx / (w * 0.5)));
    return ratio * ROTATE_MAX_DEG;
  }, [dx]);

  async function loadIdeas() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/ideas", { cache: "no-store" });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      setIdeas(json.ideas ?? []);
      setIdx(0);
      setDx(0);
    } catch (e: any) {
      setErr(e?.message ?? "Fehler beim Laden");
    } finally {
      setLoading(false);
    }
  }

  async function submitIdea(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = newIdea.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        setNewIdea("");
        await loadIdeas();
        setTimeout(() => {
          if (inputRef.current) inputRef.current.blur();
        }, 100);
      }
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    loadIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendVote(id: string, dir: VoteDir) {
    // optimistic UI: update counts sofort
    setIdeas((prev: Idea[]) =>
      prev.map((it: Idea) => {
      if (it.id !== id) return it;
      return {
        ...it,
        yesCount: dir === "yes" ? it.yesCount + 1 : it.yesCount,
        noCount: dir === "no" ? it.noCount + 1 : it.noCount,
      };
      })
    );

    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dir }),
      });
    } catch {
      // wenn vote call failt: egal fürs MVP — wird später sauber gemacht
    }
  }

  function nextCard() {
    setDx(0);
    setDragging(false);
    setIsExiting(false);
    setIsEntering(true);
    setIdx((n: number) => Math.min(n + 1, ideas.length)); // ideas.length = "done"
    interface DragState {
      dx: number;
      dragging: boolean;
      motion: "none" | "snap" | "throw";
      snapMs: number;
    }

    interface AnimationState {
      isExiting: boolean;
      isEntering: boolean;
    }

    interface PointerState {
      startX: number | null;
      startY: number | null;
      pointerId: number | null;
      intentLocked: "swipe" | "scroll" | null;
      swipeStartTime: number | null;
    }

    interface StampState {
      stamp: "none" | "yes" | "no";
      progress: number;
      dir: "yes" | "no";
      rotate: number;
    }
    setTimeout(() => setIsEntering(false), 200); // 200ms = Enter-Animation
  }

  async function vote(dir: VoteDir) {
    if (!current) return;
    
    // Send vote im Hintergrund
    await sendVote(current.id, dir);
    
    // Trigger throw-animation
    setMotion("throw");
    const throwTo = dir === "yes" ? 900 : -900;
    setDx(throwTo);
    setDragging(false);
    
    // Exit-Phase: Kartenwechsel nach Animation
    setTimeout(() => {
      setMotion("none");
      setIsExiting(true);
      setTimeout(() => {
        nextCard();
      }, 400);
    }, 320); // 320ms = Throw-Animation
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!current) return;
    pointerId.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startY.current = e.clientY;
    intentLocked.current = null;
    swipeStartTime.current = Date.now();
    setDragging(true);
    setMotion("none");
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || startX.current == null || startY.current == null) return;

    // Intent-Lock: Entscheide beim ersten Move, ob Swipe oder Scroll
    if (intentLocked.current == null) {
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (Math.abs(dx) > Math.abs(dy)) {
          intentLocked.current = "swipe";
        } else {
          intentLocked.current = "scroll";
        }
      } else {
        // Noch nicht genug Bewegung, warte weiter
        return;
      }
    }
    if (intentLocked.current === "scroll") {
      // Scroll-Modus: Drag abbrechen, Seite darf scrollen
      setDragging(false);
      startX.current = null;
      startY.current = null;
      pointerId.current = null;
      intentLocked.current = null;
      return;
    }
    // Swipe-Modus: horizontale Bewegung tracken
    const nextDx = e.clientX - startX.current;
    setDx(nextDx);
    // Scroll blocken, damit kein versehentliches Scrollen passiert
    e.preventDefault();
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragging) return;
    if (pointerId.current != null) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(pointerId.current);
      } catch {}
    }

    const abs = Math.abs(dx);
    let dir: VoteDir | null = null;
    const now = Date.now();
    const swipeTime = swipeStartTime.current ? now - swipeStartTime.current : null;

    // Schneller Swipe: Wenn <120ms und mind. 60px, akzeptiere als Vote
    if (swipeTime !== null && swipeTime < 120 && abs > 60) {
      dir = dx > 0 ? "yes" : "no";
    } else if (abs >= SWIPE_THRESHOLD_PX) {
      dir = dx > 0 ? "yes" : "no";
    }

    if (!dir) {
      // snap back
      const absDx = Math.abs(dx);
      const ratio = typeof window !== "undefined" ? clamp(absDx / (window.innerWidth * 0.6), 0, 1) : 0;
      const ms = Math.round(220 + ratio * 180); // 220–400ms
      setSnapMs(ms);
      setMotion("snap");
      setDx(0);
      setDragging(false);
      startX.current = null;
      startY.current = null;
      pointerId.current = null;
      intentLocked.current = null;
      swipeStartTime.current = null;
      setTimeout(() => setMotion("none"), ms + 40);
      return;
    }

    // Throw-out
    setMotion("throw");
    const throwTo = dx > 0 ? 900 : -900;
    setDx(throwTo);
    setDragging(false);

    // Exit-Phase: vote() triggert erst nach Animation den Kartenwechsel
    setTimeout(() => {
      setMotion("none");
      vote(dir!);
    }, 320); // 320ms = Throw-Animation

    startX.current = null;
    startY.current = null;
    pointerId.current = null;
    intentLocked.current = null;
    swipeStartTime.current = null;
  }

  // UI states

  // Eingabefeld immer anzeigen
  const ideaInput = (
    <form
      onSubmit={submitIdea}
      style={{
        width: "100%",
        maxWidth: 520,
        margin: "0 auto 12px auto",
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
      }}
      autoComplete="off"
    >
      <input
        ref={inputRef}
        type="text"
        className="input"
        placeholder="Neue Idee eingeben…"
        value={newIdea}
        onChange={e => setNewIdea(e.target.value)}
        maxLength={120}
        disabled={submitting}
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 16,
          padding: "12px 14px",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.08)",
          color: "var(--text)",
          outline: "none",
          boxShadow: "none",
        }}
      />
      <button
        type="submit"
        className="btn"
        style={{ minWidth: 44, fontSize: 18, padding: "12px 16px" }}
        disabled={submitting || !newIdea.trim()}
      >
        ➕
      </button>
    </form>
  );

  if (loading) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {ideaInput}
        <div className="card" style={{ display: "grid", placeItems: "center", marginTop: 12 }}>
          <div style={{ color: "var(--muted)", position: "relative", zIndex: 1 }}>
            Lade Ideen…
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {ideaInput}
        <div className="card" style={{ display: "grid", gap: 12, placeItems: "center", marginTop: 12 }}>
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: 800 }}>Fehler</div>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>{err}</div>
          </div>
          <button className="btn" onClick={loadIdeas}>
            ↻ Neu laden
          </button>
        </div>
      </div>
    );
  }

  // Done state
  if (!current) {
    return (
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 360 }}>
        {ideaInput}
        <div className="card" style={{ display: "grid", placeItems: "center", marginTop: 12 }}>
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>Durchgeswiped.</div>
            <div style={{ color: "var(--muted)", marginTop: 8 }}>
              Du hast alle Ideen für jetzt gesehen.
            </div>
          </div>
        </div>
        <div className="actions" style={{ marginTop: 16, marginBottom: 0 }}>
          <button className="btn" onClick={loadIdeas}>
            ↻ Neu laden
          </button>
          <button className="btn" onClick={() => (window.location.href = "/")}>
            ↩ Start
          </button>
        </div>
      </div>
    );
  }

  // Card-Lift + Motion-Polish
  let transition = "none";
  let appearStyle: React.CSSProperties = {};
  if (!dragging) {
    if (motion === "snap") {
      // Snap-back: weich und länger
      transition = `transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms cubic-bezier(0.22, 1, 0.36, 1)`;
    } else if (motion === "throw") {
      // Throw-out: punchy, schnell raus
      transition = "transform 260ms cubic-bezier(.6,-0.28,.74,.05), box-shadow 220ms cubic-bezier(.6,-0.28,.74,.05)";
    } else {
      // Normal zurück
      transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
  }
  if (isEntering) {
    appearStyle = {
      transform: "scale(0.93)", // Deutlicherer Zoom
      opacity: 0.25, // Deutlicherer Fade
      transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms cubic-bezier(0.22, 1, 0.36, 1)",
      willChange: "transform, opacity",
    };
    setTimeout(() => {
      const el = document.querySelector('.card:not([style*="pointer-events: none"])');
      if (el) {
        (el as HTMLElement).style.transform = "scale(1)";
        (el as HTMLElement).style.opacity = "1";
      }
    }, 10); // trigger transition after mount
  }
  const cardStyle: React.CSSProperties = {
    transform: `translateX(${dx}px) rotate(${rotate * (motion === "throw" ? 1.18 : 1) }deg) scale(${dragging ? 1.012 : 1})`,
    transition,
    boxShadow: dragging
      ? `0 24px 64px 0 rgba(0,0,0,0.60), 0 2px 8px 0 rgba(0,0,0,0.10)`
      : "var(--shadow)",
    ...(!isExiting && isEntering ? appearStyle : {}),
  };

  const stampYesStyle: React.CSSProperties = {
    opacity: dir === "yes" ? progress : 0,
    transform: `scale(${0.9 + progress * 0.1})`,
    transition: dragging ? "none" : "opacity 200ms ease, transform 200ms ease",
  };

  const stampNoStyle: React.CSSProperties = {
    opacity: dir === "no" ? progress : 0,
    transform: `scale(${0.9 + progress * 0.1})`,
    transition: dragging ? "none" : "opacity 200ms ease, transform 200ms ease",
  };

  // Aura-Style
  const auraColor = dx > 0
    ? "rgba(64,255,150,0.7)" // YES
    : dx < 0
      ? "rgba(255,90,120,0.7)" // NO
      : "rgba(120,120,255,0.5)"; // neutral
  const auraProgress = clamp(Math.abs(dx) / SWIPE_THRESHOLD_PX, 0, 1);
  const auraOpacity = 0.07 + auraProgress * 0.13;
  const auraOffset = dx * 0.08;
  const auraStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "180%",
    height: "180%",
    transform: `translate(-50%, -50%) scale(${1 + auraProgress * 0.08}) translateX(${auraOffset}px)`,
    pointerEvents: "none",
    zIndex: 0,
    opacity: dragging ? auraOpacity : 0,
    background: `radial-gradient(ellipse at ${dx > 0 ? "60%" : dx < 0 ? "40%" : "50%"} 50%, ${auraColor}, transparent 70%)`,
    transition: dragging ? "none" : "opacity 180ms cubic-bezier(.4,1.2,.4,1)",
    willChange: "opacity, transform",
  };

  return (
    <div style={{ width: "100%", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", minHeight: 360 }}>
      {ideaInput}
      {/* Ambient Aura */}
      <div style={auraStyle} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", width: "100%" }}>
        {!isExiting && current && (
          <div
            className="card"
            style={cardStyle}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {dragging && (
              <div className="stampOverlay">
                <div className="stampFancy stampYes" style={stampYesStyle}>
                  ✓ YES
                </div>
                <div className="stampFancy stampNo" style={stampNoStyle}>
                  ✕ NOPE
                </div>
              </div>
            )}
            <div className="cardTop">
              <div className="badge">Antrag</div>
              <div className="pills">
                <div className="pill">👍 {current.yesCount}</div>
                <div className="pill">👎 {current.noCount}</div>
              </div>
            </div>
            <div className="ideaText">{current.text}</div>
            <div className="hint">
              <span>←
              </span>
              <span>→</span>
            </div>
          </div>
        )}
        {/* Exit-Karte bleibt sichtbar, bis Animation fertig */}
        {isExiting && current && (
          <div
            className="card"
            style={{
              ...cardStyle,
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            <div className="cardTop">
              <div className="badge">Antrag</div>
              <div className="pills">
                <div className="pill">👍 {current.yesCount}</div>
                <div className="pill">👎 {current.noCount}</div>
              </div>
            </div>
            <div className="ideaText">{current.text}</div>
            <div className="hint">
              <span>← nope</span>
              <span>yes →</span>
            </div>
          </div>
        )}
        <div className="actions">
          <button className="btn btnNo" onClick={() => vote("no")} disabled={isExiting}>👎 Nope</button>
          <button className="btn btnYes" onClick={() => vote("yes")} disabled={isExiting}>👍 Yes</button>
        </div>
      </div>
    </div>
  );
}


