"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Kurs } from "@/data/types";

export default function KursPage() {
  const params = useParams();
  const kursId = params.id as string;
  const [kurs, setKurs] = useState<Kurs | null>(null);

  useEffect(() => {
    fetch(`/api/kurse/${kursId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setKurs(data);
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden des Kurses:", err);
      });
  }, [kursId]);

  if (!kurs) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p style={{ color: "black" }}>Lade...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 md:p-16">
      {/* Zurück-Button */}
      <Link
        href="/"
        style={{ color: "black" }}
        className="inline-flex items-center hover:underline mb-8"
      >
        ← Zurück zur Übersicht
      </Link>

      {/* Kurs Header */}
      <div className={`rounded-xl p-8 mb-8 bg-gradient-to-r ${kurs.farbe}`}>
        <h1 className="text-3xl font-bold text-white">{kurs.titel}</h1>
        <p className="text-white mt-2">{kurs.beschreibung}</p>
      </div>

      {/* Lektionen */}
      <section className="max-w-4xl">
        <h2 style={{ color: "black" }} className="text-2xl font-bold mb-6">
          Lektionen
        </h2>

        {kurs.lektionen.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border-2 border-gray-300">
            <p style={{ color: "black" }}>
              Dieser Kurs hat noch keine Lektionen.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {kurs.lektionen.map((lektion, index) => (
              <Link
                key={lektion.id}
                href={`/kurs/${kurs.id}/lektion/${lektion.id}`}
              >
                <div className="bg-white rounded-xl p-6 border-2 border-gray-300 hover:border-gray-400 cursor-pointer">
                  <div className="flex items-center">
                    <span
                      className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold mr-4"
                      style={{ color: "black" }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 style={{ color: "black" }} className="font-bold">
                        {lektion.titel}
                      </h3>
                      <p style={{ color: "gray" }} className="text-sm">
                        {lektion.inhalt.length} Inhalte
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
