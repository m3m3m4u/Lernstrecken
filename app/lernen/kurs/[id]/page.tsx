"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Kurs, BenutzerFortschritt } from "@/data/types";

interface Benutzer {
  vorname: string;
  familienname: string;
  benutzername: string;
}

export default function LernenKursPage() {
  const params = useParams();
  const router = useRouter();
  const kursId = params.id as string;

  const [benutzer, setBenutzer] = useState<Benutzer | null>(null);
  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [fortschritt, setFortschritt] = useState<BenutzerFortschritt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gespeicherterBenutzer = sessionStorage.getItem("benutzer");
    if (!gespeicherterBenutzer) {
      router.push("/login");
      return;
    }

    const benutzerData = JSON.parse(gespeicherterBenutzer);
    setBenutzer(benutzerData);

    // Lade Kurs und Fortschritt
    Promise.all([
      fetch(`/api/kurse/${kursId}`).then((res) => res.json()),
      fetch(
        `/api/fortschritt?benutzername=${benutzerData.benutzername}&kursId=${kursId}`
      ).then((res) => res.json()),
    ])
      .then(async ([kursData, fortschrittData]) => {
        if (kursData.error) {
          router.push("/lernen");
          return;
        }
        setKurs(kursData);

        // Fortschritt starten falls noch nicht vorhanden
        if (!fortschrittData) {
          const neuerFortschritt = await fetch("/api/fortschritt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              benutzername: benutzerData.benutzername,
              vorname: benutzerData.vorname,
              familienname: benutzerData.familienname,
              kursId,
            }),
          }).then((res) => res.json());
          setFortschritt(neuerFortschritt);
        } else {
          setFortschritt(fortschrittData);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler:", err);
        setLoading(false);
      });
  }, [router, kursId]);

  const istLektionAbgeschlossen = (lektionId: string) => {
    return fortschritt?.lektionenAbgeschlossen.includes(lektionId) || false;
  };

  const naechsteLektion = () => {
    if (!kurs || !fortschritt) return null;
    return kurs.lektionen.find(
      (l) => !fortschritt.lektionenAbgeschlossen.includes(l.id)
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 flex items-center justify-center">
        <p style={{ color: "black" }}>Laden...</p>
      </main>
    );
  }

  if (!kurs) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p style={{ color: "black" }}>Kurs nicht gefunden.</p>
      </main>
    );
  }

  const prozent = fortschritt
    ? Math.round(
        (fortschritt.lektionenAbgeschlossen.length / Math.max(kurs.lektionen.length, 1)) *
          100
      )
    : 0;

  return (
    <main className="min-h-screen bg-slate-100 p-8 md:p-16">
      <div className="max-w-3xl mx-auto">
        {/* Zurück */}
        <Link
          href="/lernen"
          style={{ color: "black" }}
          className="inline-flex items-center hover:underline mb-8"
        >
          ← Zurück zur Übersicht
        </Link>

        {/* Kurs-Header */}
        <div
          className={`rounded-xl p-8 mb-8 bg-gradient-to-r ${kurs.farbe}`}
        >
          <h1 className="text-3xl font-bold text-white mb-2">{kurs.titel}</h1>
          <p className="text-white/80 mb-4">{kurs.beschreibung}</p>

          {/* Fortschrittsbalken */}
          <div className="bg-white/30 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${prozent}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mt-2">
            {fortschritt?.lektionenAbgeschlossen.length || 0} von {kurs.lektionen.length}{" "}
            Lektionen abgeschlossen
            {fortschritt?.abgeschlossenAm && " - Kurs abgeschlossen!"}
          </p>
        </div>

        {/* Lektionen */}
        <div className="space-y-3">
          {kurs.lektionen.map((lektion, index) => {
            const abgeschlossen = istLektionAbgeschlossen(lektion.id);
            const istNaechste = naechsteLektion()?.id === lektion.id;

            return (
              <Link
                key={lektion.id}
                href={`/lernen/kurs/${kursId}/lektion/${lektion.id}`}
                className={`block p-4 rounded-lg border-2 ${
                  abgeschlossen
                    ? "bg-green-50 border-green-300"
                    : istNaechste
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-200"
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      abgeschlossen
                        ? "bg-green-500 text-white"
                        : istNaechste
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {abgeschlossen ? "✓" : index + 1}
                  </div>
                  <div>
                    <h3 style={{ color: "black" }} className="font-bold">
                      {lektion.titel}
                    </h3>
                    <p style={{ color: "gray" }} className="text-sm">
                      {lektion.inhalt.length} Inhalte
                      {abgeschlossen && " - Abgeschlossen"}
                      {istNaechste && " - Als nächstes"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {kurs.lektionen.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <p style={{ color: "gray" }}>Dieser Kurs hat noch keine Lektionen.</p>
          </div>
        )}
      </div>
    </main>
  );
}
