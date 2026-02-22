"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const kursId = params.id as string;
  const vorschauParam = searchParams.get("vorschau");
  const istVorschau = vorschauParam === "true" || vorschauParam === "admin";
  const istAdminVorschau = vorschauParam === "admin";

  const [benutzer, setBenutzer] = useState<Benutzer | null>(null);
  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [fortschritt, setFortschritt] = useState<BenutzerFortschritt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (istVorschau) {
      // Vorschau-Modus: Nur Kurs laden, kein Login nötig
      fetch(`/api/kurse/${kursId}`)
        .then((res) => res.json())
        .then((kursData) => {
          if (kursData.error) {
            router.push("/admin/dashboard");
            return;
          }
          setKurs(kursData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Fehler:", err);
          setLoading(false);
        });
      return;
    }

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
      <div className="max-w-7xl mx-auto">
        {/* Vorschau-Banner */}
        {istVorschau && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <span className="text-amber-800 font-medium">{istAdminVorschau ? "Admin-Vorschau" : "Gast-Modus"}</span>
              <span className="text-amber-600 text-sm">— Ergebnisse werden nicht gespeichert</span>
            </div>
            <div className="flex items-center gap-3">
              {!istAdminVorschau && (
                <button
                  onClick={() => router.push("/login")}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                >
                  Jetzt anmelden
                </button>
              )}
              <button
                onClick={() => router.push(istAdminVorschau ? "/admin/dashboard" : "/")}
                className="text-amber-700 hover:text-amber-900 font-medium text-sm hover:underline"
              >
                {istAdminVorschau ? "Zurück zum Admin" : "Zurück zur Übersicht"}
              </button>
            </div>
          </div>
        )}

        {/* Zurück */}
        {!istVorschau && (
          <Link
            href="/lernen"
            style={{ color: "black" }}
            className="inline-flex items-center hover:underline mb-8"
          >
            ← Zurück zur Übersicht
          </Link>
        )}

        {/* Kurs-Header */}
        <div
          className={`rounded-xl p-8 mb-8 bg-gradient-to-r ${kurs.farbe}`}
        >
          <h1 className="text-3xl font-bold text-white mb-2">{kurs.titel}</h1>
          <p className="text-white/80 mb-4">{kurs.beschreibung}</p>

          {/* Fortschrittsbalken - nur im Lernmodus */}
          {!istVorschau && (
            <>
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
            </>
          )}
          {istVorschau && (
            <p className="text-white/80 text-sm">
              {kurs.lektionen.length} Lektionen
            </p>
          )}
        </div>

        {/* Lektionen */}
        <div className="space-y-3">
          {kurs.lektionen.map((lektion, index) => {
            const abgeschlossen = !istVorschau && istLektionAbgeschlossen(lektion.id);
            const istNaechste = !istVorschau && naechsteLektion()?.id === lektion.id;

            return (
              <Link
                key={lektion.id}
                href={`/lernen/kurs/${kursId}/lektion/${lektion.id}${istVorschau ? `?vorschau=${vorschauParam}` : ""}`}
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
