"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Kurs, BenutzerFortschritt } from "@/data/types";

export default function AdminDashboard() {
  const router = useRouter();
  const [kurse, setKurse] = useState<Kurs[]>([]);
  const [fortschritte, setFortschritte] = useState<BenutzerFortschritt[]>([]);
  const [neuerKursTitel, setNeuerKursTitel] = useState("");
  const [neuerKursBeschreibung, setNeuerKursBeschreibung] = useState("");
  const [neuerKursFarbe, setNeuerKursFarbe] = useState("from-blue-500 to-indigo-600");
  const [zeigeStatistik, setZeigeStatistik] = useState<string | null>(null);

  const farben = [
    { name: "Blau", value: "from-blue-500 to-indigo-600" },
    { name: "Grün", value: "from-emerald-500 to-green-600" },
    { name: "Rot", value: "from-rose-500 to-red-600" },
    { name: "Orange", value: "from-amber-500 to-orange-600" },
    { name: "Lila", value: "from-violet-500 to-purple-600" },
    { name: "Cyan", value: "from-sky-500 to-blue-600" },
    { name: "Pink", value: "from-pink-500 to-rose-600" },
    { name: "Gelb", value: "from-yellow-400 to-amber-500" },
    { name: "Türkis", value: "from-teal-500 to-cyan-600" },
    { name: "Indigo", value: "from-indigo-500 to-violet-600" },
    { name: "Lime", value: "from-lime-500 to-green-500" },
    { name: "Fuchsia", value: "from-fuchsia-500 to-pink-600" },
    { name: "Schwarz", value: "from-gray-700 to-gray-900" },
    { name: "Braun", value: "from-amber-700 to-orange-800" },
  ];

  useEffect(() => {
    // Prüfe Auth
    if (sessionStorage.getItem("admin-auth") !== "true") {
      router.push("/admin");
      return;
    }
    
    // Lade Kurse aus der Datenbank
    fetch("/api/kurse")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setKurse(data);
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Kurse:", err);
      });

    // Lade alle Fortschritte
    fetch("/api/fortschritt")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFortschritte(data);
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden der Fortschritte:", err);
      });
  }, [router]);

  const speichereKurse = async (neueKurse: Kurs[]) => {
    setKurse(neueKurse);
    try {
      await fetch("/api/kurse", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(neueKurse),
      });
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
    }
  };

  const kursHinzufuegen = () => {
    if (!neuerKursTitel.trim()) return;
    
    const neuerKurs: Kurs = {
      id: Date.now().toString(),
      titel: neuerKursTitel,
      beschreibung: neuerKursBeschreibung,
      icon: "",
      farbe: neuerKursFarbe,
      lektionen: [],
      aktiv: true,
    };
    
    speichereKurse([...kurse, neuerKurs]);
    setNeuerKursTitel("");
    setNeuerKursBeschreibung("");
  };

  const kursLoeschen = (id: string) => {
    if (confirm("Kurs wirklich löschen?")) {
      speichereKurse(kurse.filter((k) => k.id !== id));
    }
  };

  const kursAktivierenToggle = (id: string) => {
    const aktualisierteKurse = kurse.map((k) =>
      k.id === id ? { ...k, aktiv: !k.aktiv } : k
    );
    speichereKurse(aktualisierteKurse);
  };

  const getKursStatistik = (kursId: string) => {
    const kursFortschritte = fortschritte.filter((f) => f.kursId === kursId);
    const abgeschlossen = kursFortschritte.filter((f) => f.abgeschlossenAm);
    const inBearbeitung = kursFortschritte.filter((f) => !f.abgeschlossenAm);
    const gesamtFehler = kursFortschritte.reduce((sum, f) => sum + (f.fehlerGesamt || 0), 0);
    
    return {
      gesamt: kursFortschritte.length,
      abgeschlossen: abgeschlossen.length,
      inBearbeitung: inBearbeitung.length,
      gesamtFehler,
      teilnehmer: kursFortschritte,
    };
  };

  const logout = () => {
    sessionStorage.removeItem("admin-auth");
    router.push("/admin");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Admin-Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Kurse verwalten und Statistiken einsehen</p>
          </div>
          <button
            onClick={logout}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            Abmelden
          </button>
        </div>

        {/* Neuen Kurs anlegen */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-lg">+</span>
            Neuen Kurs anlegen
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Titel
              </label>
              <input
                type="text"
                value={neuerKursTitel}
                onChange={(e) => setNeuerKursTitel(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="z.B. Python Grundlagen"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Beschreibung
              </label>
              <input
                type="text"
                value={neuerKursBeschreibung}
                onChange={(e) => setNeuerKursBeschreibung(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Kurze Beschreibung des Kurses"
              />
            </div>
          </div>
          
          <div className="mb-5">
            <label className="block mb-1.5 text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Farbe
            </label>
            <div className="flex gap-2 flex-wrap">
              {farben.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setNeuerKursFarbe(f.value)}
                  className={`w-9 h-9 rounded-full bg-gradient-to-r ${f.value} transition-all duration-150 ${
                    neuerKursFarbe === f.value
                      ? "ring-3 ring-offset-2 ring-slate-800 scale-110"
                      : "hover:scale-110"
                  }`}
                  title={f.name}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={kursHinzufuegen}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-8 rounded-xl transition-colors shadow-sm"
          >
            Kurs anlegen
          </button>
        </div>

        {/* Kursliste */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">{kurse.length}</span>
            Vorhandene Kurse
          </h2>
          
          {kurse.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-slate-400 text-lg">Noch keine Kurse vorhanden.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {kurse.map((kurs) => {
                const stats = getKursStatistik(kurs.id);
                
                return (
                  <div
                    key={kurs.id}
                    className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-shadow hover:shadow-md ${
                      kurs.aktiv === false ? "opacity-75" : ""
                    }`}
                  >
                    <div className="p-5">
                      {/* Kurs-Info Zeile */}
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${kurs.farbe} flex-shrink-0 shadow-sm ${
                            kurs.aktiv === false ? "grayscale" : ""
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg text-slate-800 truncate">
                              {kurs.titel}
                            </h3>
                            {kurs.aktiv === false && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                unsichtbar
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                              {kurs.lektionen.length} Lektionen
                            </span>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {stats.gesamt} Teilnehmer
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setZeigeStatistik(zeigeStatistik === kurs.id ? null : kurs.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            zeigeStatistik === kurs.id
                              ? "bg-purple-600 text-white"
                              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                          Statistik
                        </button>
                        <button
                          onClick={() => kursAktivierenToggle(kurs.id)}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            kurs.aktiv === false
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          {kurs.aktiv === false ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          )}
                          {kurs.aktiv === false ? "Aktivieren" : "Verstecken"}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/kurs/${kurs.id}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Bearbeiten
                        </button>
                        {kurs.lektionen.length > 0 && (
                          <button
                            onClick={() => router.push(`/lernen/kurs/${kurs.id}?vorschau=admin`)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Vorschau
                          </button>
                        )}

                        <div className="flex-1" />

                        <button
                          onClick={() => kursLoeschen(kurs.id)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Löschen
                        </button>
                      </div>
                    </div>

                    {/* Statistik-Panel */}
                    {zeigeStatistik === kurs.id && (
                      <div className="border-t border-slate-200 p-5 bg-slate-50">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-slate-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Teilnehmer</p>
                            <p className="text-3xl font-bold text-slate-800">{stats.gesamt}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-green-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Abgeschlossen</p>
                            <p className="text-3xl font-bold text-green-600">{stats.abgeschlossen}</p>
                          </div>
                          <div className="bg-white p-4 rounded-xl text-center shadow-sm border border-amber-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">In Bearbeitung</p>
                            <p className="text-3xl font-bold text-amber-600">{stats.inBearbeitung}</p>
                          </div>
                        </div>

                        {stats.teilnehmer.length > 0 && (
                          <div>
                            <h4 className="font-bold text-slate-700 mb-2">Teilnehmer:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {stats.teilnehmer.map((t, index) => (
                                <div
                                  key={`${t.benutzername}-${t.kursId}-${index}`}
                                  className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm border border-slate-100"
                                >
                                  <div>
                                    <p className="font-medium text-slate-800">
                                      {t.vorname} {t.familienname}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                      @{t.benutzername}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-medium ${t.abgeschlossenAm ? "text-green-600" : "text-amber-600"}`}>
                                      {t.abgeschlossenAm ? "Fertig" : `${t.lektionenAbgeschlossen.length}/${kurs.lektionen.length} Lektionen`}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                      {t.fehlerGesamt || 0} Fehler
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {stats.teilnehmer.length === 0 && (
                          <p className="text-slate-400 text-center py-2">
                            Noch keine Teilnehmer
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
