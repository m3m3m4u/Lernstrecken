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
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 style={{ color: "black" }} className="text-3xl font-bold">
            Admin-Dashboard
          </h1>
          <button
            onClick={logout}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Abmelden
          </button>
        </div>

        {/* Neuen Kurs anlegen */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-300 mb-8">
          <h2 style={{ color: "black" }} className="text-xl font-bold mb-4">
            Neuen Kurs anlegen
          </h2>
          
          <div className="mb-4">
            <label style={{ color: "black" }} className="block mb-1 font-medium">
              Titel
            </label>
            <input
              type="text"
              value={neuerKursTitel}
              onChange={(e) => setNeuerKursTitel(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded-lg"
              style={{ color: "black" }}
              placeholder="z.B. Python Grundlagen"
            />
          </div>
          
          <div className="mb-4">
            <label style={{ color: "black" }} className="block mb-1 font-medium">
              Beschreibung
            </label>
            <textarea
              value={neuerKursBeschreibung}
              onChange={(e) => setNeuerKursBeschreibung(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded-lg"
              style={{ color: "black" }}
              placeholder="Kurze Beschreibung des Kurses"
              rows={2}
            />
          </div>
          
          <div className="mb-4">
            <label style={{ color: "black" }} className="block mb-1 font-medium">
              Farbe
            </label>
            <div className="flex gap-2 flex-wrap">
              {farben.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setNeuerKursFarbe(f.value)}
                  className={`w-10 h-10 rounded-lg bg-gradient-to-r ${f.value} ${
                    neuerKursFarbe === f.value ? "ring-4 ring-black" : ""
                  }`}
                  title={f.name}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={kursHinzufuegen}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
          >
            Kurs anlegen
          </button>
        </div>

        {/* Kursliste */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-300">
          <h2 style={{ color: "black" }} className="text-xl font-bold mb-4">
            Vorhandene Kurse ({kurse.length})
          </h2>
          
          {kurse.length === 0 ? (
            <p style={{ color: "black" }}>Noch keine Kurse vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {kurse.map((kurs) => {
                const stats = getKursStatistik(kurs.id);
                
                return (
                  <div key={kurs.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg bg-gradient-to-r ${kurs.farbe} ${
                            kurs.aktiv === false ? "opacity-50" : ""
                          }`}
                        />
                        <div>
                          <h3 style={{ color: "black" }} className="font-bold">
                            {kurs.titel}
                            {kurs.aktiv === false && (
                              <span style={{ color: "gray" }} className="ml-2 text-sm font-normal">
                                (unsichtbar)
                              </span>
                            )}
                          </h3>
                          <p style={{ color: "gray" }} className="text-sm">
                            {kurs.lektionen.length} Lektionen | {stats.gesamt} Teilnehmer
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => setZeigeStatistik(zeigeStatistik === kurs.id ? null : kurs.id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm"
                        >
                          Statistik
                        </button>
                        <button
                          onClick={() => kursAktivierenToggle(kurs.id)}
                          className={`${
                            kurs.aktiv === false
                              ? "bg-green-500 hover:bg-green-600"
                              : "bg-yellow-500 hover:bg-yellow-600"
                          } text-white px-3 py-2 rounded-lg text-sm`}
                        >
                          {kurs.aktiv === false ? "Aktivieren" : "Unsichtbar"}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/kurs/${kurs.id}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => kursLoeschen(kurs.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>

                    {/* Statistik-Panel */}
                    {zeigeStatistik === kurs.id && (
                      <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-lg text-center">
                            <p style={{ color: "gray" }} className="text-sm">Teilnehmer</p>
                            <p style={{ color: "black" }} className="text-2xl font-bold">{stats.gesamt}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <p style={{ color: "gray" }} className="text-sm">Abgeschlossen</p>
                            <p style={{ color: "green" }} className="text-2xl font-bold">{stats.abgeschlossen}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg text-center">
                            <p style={{ color: "gray" }} className="text-sm">In Bearbeitung</p>
                            <p style={{ color: "orange" }} className="text-2xl font-bold">{stats.inBearbeitung}</p>
                          </div>
                        </div>

                        {stats.teilnehmer.length > 0 && (
                          <div>
                            <h4 style={{ color: "black" }} className="font-bold mb-2">Teilnehmer:</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {stats.teilnehmer.map((t, index) => (
                                <div
                                  key={`${t.benutzername}-${t.kursId}-${index}`}
                                  className="bg-white p-3 rounded-lg flex justify-between items-center"
                                >
                                  <div>
                                    <p style={{ color: "black" }} className="font-medium">
                                      {t.vorname} {t.familienname}
                                    </p>
                                    <p style={{ color: "gray" }} className="text-sm">
                                      @{t.benutzername}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      style={{ color: t.abgeschlossenAm ? "green" : "orange" }}
                                      className="font-medium"
                                    >
                                      {t.abgeschlossenAm ? "Fertig" : `${t.lektionenAbgeschlossen.length}/${kurs.lektionen.length} Lektionen`}
                                    </p>
                                    <p style={{ color: "gray" }} className="text-sm">
                                      {t.fehlerGesamt || 0} Fehler
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {stats.teilnehmer.length === 0 && (
                          <p style={{ color: "gray" }} className="text-center">
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
