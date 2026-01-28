"use client";

import SwipeDeck from "../components/SwipeDeck";

export default function Home() {
  return (
    <main className="container">

      <header className="header">
        <img className="logo" src="/logo.png" alt="Ministry of Good Idea Logo" />
        <p className="subtitle">Swipe. Schmunzeln. Kopfschütteln. Swipe.</p>
      </header>

      <section className="deckWrap">
        <SwipeDeck />
      </section>

      <div className="footer">
        MVP · Mobile-first · Login später · Ideen werden aus DB geladen
      </div>
    </main>
  );
}