"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Kurs, Lektion, LektionInhalt, QuizAntwort, QuizFrage, QuizInhalt } from "@/data/types";

export default function KursEditor() {
  const router = useRouter();
  const params = useParams();
  const kursId = params.id as string;
  
  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [kursTitelEdit, setKursTitelEdit] = useState("");
  const [kursBeschreibungEdit, setKursBeschreibungEdit] = useState("");
  const [kursFarbeEdit, setKursFarbeEdit] = useState("");
  const [neueLektionTitel, setNeueLektionTitel] = useState("");
  const [editLektion, setEditLektion] = useState<Lektion | null>(null);

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
  
  // Inhalt-Editor State
  const [inhaltTyp, setInhaltTyp] = useState<"video" | "youtube" | "markdown" | "quiz">("markdown");
  const [markdownText, setMarkdownText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [quizText, setQuizText] = useState(""); // Format: Frage\nAntwort\n*Richtig\n\nFrage2\n...

  const [editInhaltIndex, setEditInhaltIndex] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("admin-auth") !== "true") {
      router.push("/admin");
      return;
    }
    
    // Lade Kurs aus der Datenbank
    fetch(`/api/kurse/${kursId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setKurs(data);
          setKursTitelEdit(data.titel);
          setKursBeschreibungEdit(data.beschreibung);
          setKursFarbeEdit(data.farbe || "");
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden des Kurses:", err);
      });
  }, [router, kursId]);

  const speichereKurs = async (aktualisierterKurs: Kurs) => {
    setKurs(aktualisierterKurs);
    try {
      await fetch(`/api/kurse/${kursId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aktualisierterKurs),
      });
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
    }
  };

  const lektionHinzufuegen = () => {
    if (!neueLektionTitel.trim() || !kurs) return;
    
    const neueLektion: Lektion = {
      id: Date.now().toString(),
      titel: neueLektionTitel,
      inhalt: [],
    };
    
    const aktualisierterKurs = {
      ...kurs,
      lektionen: [...kurs.lektionen, neueLektion],
    };
    
    speichereKurs(aktualisierterKurs);
    setNeueLektionTitel("");
  };

  const lektionLoeschen = (lektionId: string) => {
    if (!kurs || !confirm("Lektion wirklich löschen?")) return;
    
    const aktualisierterKurs = {
      ...kurs,
      lektionen: kurs.lektionen.filter((l) => l.id !== lektionId),
    };
    
    speichereKurs(aktualisierterKurs);
  };

  const inhaltHinzufuegen = () => {
    if (!editLektion || !kurs) return;
    
    let neuerInhalt: LektionInhalt | null = null;
    
    if (inhaltTyp === "markdown" && markdownText.trim()) {
      neuerInhalt = { typ: "markdown", text: markdownText };
      setMarkdownText("");
    } else if (inhaltTyp === "youtube" && youtubeUrl.trim()) {
      // Extrahiere Video-ID aus URL
      const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      const videoId = match ? match[1] : youtubeUrl;
      neuerInhalt = { typ: "youtube", videoId };
      setYoutubeUrl("");
    } else if (inhaltTyp === "quiz" && quizText.trim()) {
      // Parse Quiz: Leerzeilen trennen Fragen
      // Erste Zeile = Frage, dann Antworten (* = richtig)
      const bloecke = quizText.split(/\n\s*\n/).filter(b => b.trim());
      const fragen: QuizFrage[] = bloecke.map(block => {
        const zeilen = block.split("\n").filter(z => z.trim());
        const frage = zeilen[0] || "";
        const antworten: QuizAntwort[] = zeilen.slice(1).map(a => ({
          text: a.replace(/^\*\s*/, "").trim(),
          richtig: a.trim().startsWith("*"),
        }));
        return { frage, antworten };
      });
      
      neuerInhalt = { typ: "quiz", fragen };
      setQuizText("");
    }
    
    if (neuerInhalt) {
      const aktualisierteLektion = {
        ...editLektion,
        inhalt: [...editLektion.inhalt, neuerInhalt],
      };
      
      const aktualisierterKurs = {
        ...kurs,
        lektionen: kurs.lektionen.map((l) =>
          l.id === editLektion.id ? aktualisierteLektion : l
        ),
      };
      
      speichereKurs(aktualisierterKurs);
      setEditLektion(aktualisierteLektion);
    }
  };

  const inhaltLoeschen = (index: number) => {
    if (!editLektion || !kurs) return;
    
    const aktualisierteLektion = {
      ...editLektion,
      inhalt: editLektion.inhalt.filter((_, i) => i !== index),
    };
    
    const aktualisierterKurs = {
      ...kurs,
      lektionen: kurs.lektionen.map((l) =>
        l.id === editLektion.id ? aktualisierteLektion : l
      ),
    };
    
    speichereKurs(aktualisierterKurs);
    setEditLektion(aktualisierteLektion);
  };

  const inhaltVerschieben = (index: number, richtung: "hoch" | "runter") => {
    if (!editLektion || !kurs) return;
    
    const neueInhalte = [...editLektion.inhalt];
    const neuerIndex = richtung === "hoch" ? index - 1 : index + 1;
    
    if (neuerIndex < 0 || neuerIndex >= neueInhalte.length) return;
    
    [neueInhalte[index], neueInhalte[neuerIndex]] = [neueInhalte[neuerIndex], neueInhalte[index]];
    
    const aktualisierteLektion = { ...editLektion, inhalt: neueInhalte };
    const aktualisierterKurs = {
      ...kurs,
      lektionen: kurs.lektionen.map((l) =>
        l.id === editLektion.id ? aktualisierteLektion : l
      ),
    };
    
    speichereKurs(aktualisierterKurs);
    setEditLektion(aktualisierteLektion);
  };

  const inhaltBearbeiten = (index: number) => {
    if (!editLektion) return;
    const inhalt = editLektion.inhalt[index];
    
    setEditInhaltIndex(index);
    setInhaltTyp(inhalt.typ as "markdown" | "youtube" | "quiz");
    
    if (inhalt.typ === "markdown") {
      setMarkdownText(inhalt.text);
    } else if (inhalt.typ === "youtube") {
      setYoutubeUrl(inhalt.videoId);
    } else if (inhalt.typ === "quiz") {
      const quiz = inhalt as QuizInhalt;
      // Unterstütze altes und neues Format
      const fragen = quiz.fragen || (quiz.frage && quiz.antworten ? [{ frage: quiz.frage, antworten: quiz.antworten }] : []);
      const text = fragen.map(f => {
        const zeilen = [f.frage, ...f.antworten.map(a => (a.richtig ? "* " : "") + a.text)];
        return zeilen.join("\n");
      }).join("\n\n");
      setQuizText(text);
    }
  };

  const inhaltSpeichern = () => {
    if (!editLektion || !kurs || editInhaltIndex === null) return;
    
    let aktualisierterInhalt: LektionInhalt | null = null;
    
    if (inhaltTyp === "markdown" && markdownText.trim()) {
      aktualisierterInhalt = { typ: "markdown", text: markdownText };
    } else if (inhaltTyp === "youtube" && youtubeUrl.trim()) {
      const match = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      const videoId = match ? match[1] : youtubeUrl;
      aktualisierterInhalt = { typ: "youtube", videoId };
    } else if (inhaltTyp === "quiz" && quizText.trim()) {
      const bloecke = quizText.split(/\n\s*\n/).filter(b => b.trim());
      const fragen: QuizFrage[] = bloecke.map(block => {
        const zeilen = block.split("\n").filter(z => z.trim());
        const frage = zeilen[0] || "";
        const antworten: QuizAntwort[] = zeilen.slice(1).map(a => ({
          text: a.replace(/^\*\s*/, "").trim(),
          richtig: a.trim().startsWith("*"),
        }));
        return { frage, antworten };
      });
      aktualisierterInhalt = { typ: "quiz", fragen };
    }
    
    if (aktualisierterInhalt) {
      const neueInhalte = [...editLektion.inhalt];
      neueInhalte[editInhaltIndex] = aktualisierterInhalt;
      
      const aktualisierteLektion = { ...editLektion, inhalt: neueInhalte };
      const aktualisierterKurs = {
        ...kurs,
        lektionen: kurs.lektionen.map((l) =>
          l.id === editLektion.id ? aktualisierteLektion : l
        ),
      };
      
      speichereKurs(aktualisierterKurs);
      setEditLektion(aktualisierteLektion);
      
      // Reset
      setEditInhaltIndex(null);
      setMarkdownText("");
      setYoutubeUrl("");
      setQuizText("");
    }
  };

  const bearbeitungAbbrechen = () => {
    setEditInhaltIndex(null);
    setMarkdownText("");
    setYoutubeUrl("");
    setQuizText("");
  };

  const lektionVerschieben = (index: number, richtung: "hoch" | "runter") => {
    if (!kurs) return;
    
    const neueLektionen = [...kurs.lektionen];
    const neuerIndex = richtung === "hoch" ? index - 1 : index + 1;
    
    if (neuerIndex < 0 || neuerIndex >= neueLektionen.length) return;
    
    [neueLektionen[index], neueLektionen[neuerIndex]] = [neueLektionen[neuerIndex], neueLektionen[index]];
    
    const aktualisierterKurs = { ...kurs, lektionen: neueLektionen };
    speichereKurs(aktualisierterKurs);
  };

  if (!kurs) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p style={{ color: "black" }}>Lade...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Zurück
          </button>
        </div>

        {/* Kurstitel und Beschreibung bearbeiten */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-300 mb-6">
          <h2 style={{ color: "black" }} className="text-xl font-bold mb-4">
            Kurs-Einstellungen
          </h2>
          <div className="space-y-4">
            <div>
              <label style={{ color: "black" }} className="block text-sm font-medium mb-1">
                Kurstitel
              </label>
              <input
                type="text"
                value={kursTitelEdit}
                onChange={(e) => setKursTitelEdit(e.target.value)}
                onBlur={() => {
                  if (kursTitelEdit.trim() && kursTitelEdit !== kurs.titel) {
                    speichereKurs({ ...kurs, titel: kursTitelEdit.trim() });
                  }
                }}
                style={{ color: "black" }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-xl font-bold"
              />
            </div>
            <div>
              <label style={{ color: "black" }} className="block text-sm font-medium mb-1">
                Beschreibung
              </label>
              <textarea
                value={kursBeschreibungEdit}
                onChange={(e) => setKursBeschreibungEdit(e.target.value)}
                onBlur={() => {
                  if (kursBeschreibungEdit !== kurs.beschreibung) {
                    speichereKurs({ ...kurs, beschreibung: kursBeschreibungEdit });
                  }
                }}
                style={{ color: "black" }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                rows={2}
              />
            </div>
            <div>
              <label style={{ color: "black" }} className="block text-sm font-medium mb-1">
                Farbe
              </label>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${kursFarbeEdit} flex-shrink-0 shadow-sm`} />
                <div className="flex gap-2 flex-wrap">
                  {farben.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => {
                        setKursFarbeEdit(f.value);
                        speichereKurs({ ...kurs, farbe: f.value });
                      }}
                      className={`w-9 h-9 rounded-full bg-gradient-to-r ${f.value} transition-all duration-150 ${
                        kursFarbeEdit === f.value
                          ? "ring-3 ring-offset-2 ring-black scale-110"
                          : "hover:scale-110"
                      }`}
                      title={f.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {editLektion ? (
          /* Lektion bearbeiten */
          <div className="bg-white p-6 rounded-xl border-2 border-gray-300">
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ color: "black" }} className="text-xl font-bold">
                Lektion: {editLektion.titel}
              </h2>
              <button
                onClick={() => setEditLektion(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Zurück zur Übersicht
              </button>
            </div>

            {/* Vorhandene Inhalte */}
            <div className="mb-6">
              <h3 style={{ color: "black" }} className="font-bold mb-3">
                Inhalte ({editLektion.inhalt.length})
              </h3>
              {editLektion.inhalt.length === 0 ? (
                <p style={{ color: "gray" }}>Noch keine Inhalte.</p>
              ) : (
                <div className="space-y-2">
                  {editLektion.inhalt.map((inhalt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <button
                            onClick={() => inhaltVerschieben(index, "hoch")}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-black disabled:opacity-30 text-sm"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => inhaltVerschieben(index, "runter")}
                            disabled={index === editLektion.inhalt.length - 1}
                            className="text-gray-500 hover:text-black disabled:opacity-30 text-sm"
                          >
                            ▼
                          </button>
                        </div>
                        <span style={{ color: "gray" }} className="text-sm mr-2">
                          {index + 1}.
                        </span>
                        <span
                          style={{ color: "black" }}
                          className="font-medium"
                        >
                          {inhalt.typ === "markdown" && "Text"}
                          {inhalt.typ === "youtube" && "YouTube Video"}
                          {inhalt.typ === "video" && "Video"}
                          {inhalt.typ === "quiz" && (() => {
                            const quiz = inhalt as QuizInhalt;
                            const fragen = quiz.fragen || (quiz.frage ? [{ frage: quiz.frage, antworten: quiz.antworten || [] }] : []);
                            return `Quiz (${fragen.length} Frage${fragen.length !== 1 ? 'n' : ''})`;
                          })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => inhaltBearbeiten(index)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => inhaltLoeschen(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Neuen Inhalt hinzufügen / bearbeiten */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 style={{ color: "black" }} className="font-bold mb-3">
                {editInhaltIndex !== null ? "Inhalt bearbeiten" : "Neuen Inhalt hinzufügen"}
              </h3>
              
              <div className="flex gap-2 mb-4">
                {(["markdown", "youtube", "quiz"] as const).map((typ) => (
                  <button
                    key={typ}
                    onClick={() => setInhaltTyp(typ)}
                    disabled={editInhaltIndex !== null}
                    className={`px-4 py-2 rounded-lg ${
                      inhaltTyp === typ
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    } ${editInhaltIndex !== null ? "opacity-50" : ""}`}
                    style={{ color: inhaltTyp === typ ? "white" : "black" }}
                  >
                    {typ === "markdown" && "Text"}
                    {typ === "youtube" && "YouTube"}
                    {typ === "quiz" && "Quiz"}
                  </button>
                ))}
              </div>

              {inhaltTyp === "markdown" && (
                <div>
                  <textarea
                    value={markdownText}
                    onChange={(e) => setMarkdownText(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg mb-2"
                    style={{ color: "black" }}
                    rows={6}
                    placeholder="Markdown Text eingeben..."
                  />
                </div>
              )}

              {inhaltTyp === "youtube" && (
                <div>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg mb-2"
                    style={{ color: "black" }}
                    placeholder="YouTube URL (z.B. https://youtube.com/watch?v=...)"
                  />
                </div>
              )}

              {inhaltTyp === "quiz" && (
                <div>
                  <textarea
                    value={quizText}
                    onChange={(e) => setQuizText(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg mb-2 font-mono"
                    style={{ color: "black" }}
                    rows={10}
                    placeholder={"Wie heißt die Hauptstadt von Frankreich?\nBerlin\n* Paris\nMadrid\n\nWelche Farben hat die deutsche Flagge?\n* Schwarz\nBlau\n* Rot\n* Gold\n\n(Leerzeile = neue Frage, * = richtige Antwort)"}
                  />
                  <p style={{ color: "#666" }} className="text-sm">
                    Format: Erste Zeile = Frage, dann Antworten. * vor richtigen Antworten. Leerzeile = neue Frage.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                {editInhaltIndex !== null ? (
                  <>
                    <button
                      onClick={inhaltSpeichern}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={bearbeitungAbbrechen}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
                    >
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <button
                    onClick={inhaltHinzufuegen}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
                  >
                    Hinzufügen
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Lektionen-Übersicht */
          <>
            {/* Neue Lektion */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-300 mb-8">
              <h2 style={{ color: "black" }} className="text-xl font-bold mb-4">
                Neue Lektion anlegen
              </h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={neueLektionTitel}
                  onChange={(e) => setNeueLektionTitel(e.target.value)}
                  className="flex-1 p-2 border-2 border-gray-300 rounded-lg"
                  style={{ color: "black" }}
                  placeholder="Titel der Lektion"
                />
                <button
                  onClick={lektionHinzufuegen}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
                >
                  Anlegen
                </button>
              </div>
            </div>

            {/* Lektionsliste */}
            <div className="bg-white p-6 rounded-xl border-2 border-gray-300">
              <h2 style={{ color: "black" }} className="text-xl font-bold mb-4">
                Lektionen ({kurs.lektionen.length})
              </h2>
              
              {kurs.lektionen.length === 0 ? (
                <p style={{ color: "black" }}>Noch keine Lektionen vorhanden.</p>
              ) : (
                <div className="space-y-3">
                  {kurs.lektionen.map((lektion, index) => (
                    <div
                      key={lektion.id}
                      className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <button
                            onClick={() => lektionVerschieben(index, "hoch")}
                            disabled={index === 0}
                            className="text-gray-500 hover:text-black disabled:opacity-30 text-sm"
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => lektionVerschieben(index, "runter")}
                            disabled={index === kurs.lektionen.length - 1}
                            className="text-gray-500 hover:text-black disabled:opacity-30 text-sm"
                          >
                            ▼
                          </button>
                        </div>
                        <div>
                          <span style={{ color: "gray" }} className="mr-2">
                            {index + 1}.
                          </span>
                          <span style={{ color: "black" }} className="font-bold">
                            {lektion.titel}
                          </span>
                          <span style={{ color: "gray" }} className="ml-2 text-sm">
                            ({lektion.inhalt.length} Inhalte)
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditLektion(lektion)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => lektionLoeschen(lektion.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
