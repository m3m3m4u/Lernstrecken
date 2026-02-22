"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Kurs, BenutzerFortschritt } from "@/data/types";

interface Benutzer {
  vorname: string;
  familienname: string;
  benutzername: string;
}

export default function LernenPage() {
  const router = useRouter();
  const [benutzer, setBenutzer] = useState<Benutzer | null>(null);
  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [fortschritte, setFortschritte] = useState<BenutzerFortschritt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prüfe ob eingeloggt
    const gespeicherterBenutzer = sessionStorage.getItem("benutzer");
    if (!gespeicherterBenutzer) {
      router.push("/login");
      return;
    }

    const benutzerData = JSON.parse(gespeicherterBenutzer);
    setBenutzer(benutzerData);

    // Lade Kurse und Fortschritt
    Promise.all([
      fetch("/api/kurse").then((res) => res.json()),
      fetch(`/api/fortschritt?benutzername=${benutzerData.benutzername}`).then((res) =>
        res.json()
      ),
    ])
      .then(([kurseData, fortschrittData]) => {
        // Nur aktive Kurse anzeigen
        const aktiveKurse = Array.isArray(kurseData)
          ? kurseData.filter((k: Kurs) => k.aktiv !== false)
          : [];
        setKurse(aktiveKurse);
        setFortschritte(Array.isArray(fortschrittData) ? fortschrittData : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fehler:", err);
        setLoading(false);
      });
  }, [router]);

  const logout = () => {
    sessionStorage.removeItem("benutzer");
    router.push("/login");
  };

  const getFortschritt = (kursId: string) => {
    return fortschritte.find((f) => f.kursId === kursId);
  };

  const getStatusText = (kurs: Kurs) => {
    const fortschritt = getFortschritt(kurs.id);
    if (!fortschritt) return "Noch nicht gestartet";
    if (fortschritt.abgeschlossenAm) return "Abgeschlossen";
    const abgeschlossen = fortschritt.lektionenAbgeschlossen.length;
    const gesamt = kurs.lektionen.length;
    return `${abgeschlossen} von ${gesamt} Lektionen`;
  };

  const getStatusColor = (kurs: Kurs) => {
    const fortschritt = getFortschritt(kurs.id);
    if (!fortschritt) return "bg-gray-200";
    if (fortschritt.abgeschlossenAm) return "bg-green-500";
    return "bg-yellow-400";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 flex items-center justify-center">
        <p style={{ color: "black" }}>Laden...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8 md:p-16">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 style={{ color: "black" }} className="text-3xl font-bold">
            Hallo, {benutzer?.vorname}!
          </h1>
          <p style={{ color: "gray" }}>Wähle einen Kurs zum Lernen</p>
        </div>
        <button
          onClick={logout}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
        >
          Abmelden
        </button>
      </header>

      {/* Kurse */}
      {kurse.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: "black" }}>Noch keine Kurse verfügbar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kurse.map((kurs) => {
            const fortschritt = getFortschritt(kurs.id);
            const prozent = fortschritt
              ? Math.round(
                  (fortschritt.lektionenAbgeschlossen.length / Math.max(kurs.lektionen.length, 1)) *
                    100
                )
              : 0;

            return (
              <Link
                key={kurs.id}
                href={`/lernen/kurs/${kurs.id}`}
                className="block bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className={`h-24 bg-gradient-to-r ${kurs.farbe}`} />
                <div className="p-4">
                  <h2 style={{ color: "black" }} className="text-xl font-bold mb-2">
                    {kurs.titel}
                  </h2>
                  <p style={{ color: "gray" }} className="text-sm mb-3">
                    {kurs.beschreibung}
                  </p>

                  {/* Fortschrittsbalken */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${getStatusColor(kurs)}`}
                      style={{ width: `${prozent}%` }}
                    />
                  </div>
                  <p style={{ color: "gray" }} className="text-xs">
                    {getStatusText(kurs)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer className="text-center mt-16">
        <p style={{ color: "gray" }} className="text-sm">
          &copy; Schule am See, Hard
        </p>
      </footer>
    </main>
  );
}
