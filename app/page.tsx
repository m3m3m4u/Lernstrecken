"use client";

import { useEffect, useState } from "react";
import KursButton from "@/components/KursButton";
import { Kurs } from "@/data/types";

export default function Home() {
  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kurse")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setKurse(data);
        } else {
          setKurse([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Kurse:", err);
        setKurse([]);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen p-8 md:p-16">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 style={{ color: 'black' }} className="text-4xl md:text-5xl font-bold mb-4">
          FutureLab
        </h1>
        <p style={{ color: 'black' }} className="text-xl max-w-2xl mx-auto">
          Wähle einen Kurs und starte deine Lernreise. 
          Interaktive Lektionen warten auf dich!
        </p>
      </header>

      {/* Kurs-Grid */}
      <section className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center">
            <p style={{ color: 'black' }}>Kurse werden geladen...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kurse.filter((k) => k.aktiv !== false).map((kurs) => (
              <KursButton key={kurs.id} kurs={kurs} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="text-center mt-16">
        <p style={{ color: 'black' }}>&copy; Schule am See, Hard</p>
        <a 
          href="/admin" 
          style={{ color: 'gray' }} 
          className="text-sm hover:underline mt-2 inline-block"
        >
          Admin
        </a>
      </footer>
    </main>
  );
}
