"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Kurs, Lektion, LektionInhalt, QuizInhalt } from "@/data/types";

interface QuizState {
  fragenIndex: number;
  ausgewaehlteAntworten: number[];
  falscheAntworten: number[];
  beantwortet: boolean;
  richtig: boolean;
}

export default function LektionPage() {
  const params = useParams();
  const router = useRouter();
  const kursId = params.id as string;
  const lektionId = params.lektionId as string;

  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [lektion, setLektion] = useState<Lektion | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Quiz State
  const [quizState, setQuizState] = useState<QuizState>({
    fragenIndex: 0,
    ausgewaehlteAntworten: [],
    falscheAntworten: [],
    beantwortet: false,
    richtig: false,
  });
  const [lektionAbgeschlossen, setLektionAbgeschlossen] = useState(false);

  useEffect(() => {
    fetch(`/api/kurse/${kursId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setKurs(data);
          const gefundeneLektion = data.lektionen.find(
            (l: Lektion) => l.id === lektionId
          );
          if (gefundeneLektion) {
            setLektion(gefundeneLektion);
          }
        }
      })
      .catch((err) => {
        console.error("Fehler beim Laden des Kurses:", err);
      });
  }, [kursId, lektionId]);

  const alleQuizFragen = lektion?.inhalt.filter(
    (i): i is QuizInhalt => i.typ === "quiz"
  ) || [];

  const handleAntwortWaehlen = (index: number) => {
    if (quizState.beantwortet) return;
    setQuizState((prev) => {
      const bereits = prev.ausgewaehlteAntworten.includes(index);
      return {
        ...prev,
        ausgewaehlteAntworten: bereits
          ? prev.ausgewaehlteAntworten.filter((i) => i !== index)
          : [...prev.ausgewaehlteAntworten, index],
      };
    });
  };

  const handleAntwortPruefen = () => {
    if (quizState.ausgewaehlteAntworten.length === 0) return;
    
    const aktuelleQuizFragen = getCurrentQuizFragen();
    const aktuelleFrage = aktuelleQuizFragen[quizState.fragenIndex];
    
    // Prüfe ob alle richtigen ausgewählt und keine falschen
    const antworten = aktuelleFrage.antworten ?? [];
    const richtigeIndizes = antworten
      .map((a, i) => (a.richtig ? i : -1))
      .filter((i) => i !== -1);
    
    const alleRichtigenGewaehlt = richtigeIndizes.every((i) =>
      quizState.ausgewaehlteAntworten.includes(i)
    );
    const keineFalschenGewaehlt = quizState.ausgewaehlteAntworten.every(
      (i) => antworten[i].richtig
    );
    
    const istRichtig = alleRichtigenGewaehlt && keineFalschenGewaehlt;
    
    setQuizState((prev) => ({
      ...prev,
      beantwortet: true,
      richtig: istRichtig,
      falscheAntworten: istRichtig
        ? prev.falscheAntworten
        : [...prev.falscheAntworten, quizState.fragenIndex],
    }));
  };

  const getCurrentQuizFragen = (): QuizInhalt[] => {
    // Wenn es falsche Antworten gibt, zeige diese nochmal
    if (quizState.falscheAntworten.length > 0 && quizState.fragenIndex >= alleQuizFragen.length) {
      return quizState.falscheAntworten.map((i) => alleQuizFragen[i]);
    }
    return alleQuizFragen;
  };

  const handleWeiter = () => {
    const aktuelleQuizFragen = getCurrentQuizFragen();
    
    if (quizState.fragenIndex < aktuelleQuizFragen.length - 1) {
      // Nächste Frage
      setQuizState((prev) => ({
        ...prev,
        fragenIndex: prev.fragenIndex + 1,
        ausgewaehlteAntworten: [],
        beantwortet: false,
        richtig: false,
      }));
    } else if (quizState.falscheAntworten.length > 0 && quizState.fragenIndex < alleQuizFragen.length) {
      // Wiederhole falsche Fragen
      setQuizState({
        fragenIndex: alleQuizFragen.length,
        ausgewaehlteAntworten: [],
        falscheAntworten: [],
        beantwortet: false,
        richtig: false,
      });
    } else {
      // Lektion abgeschlossen
      setLektionAbgeschlossen(true);
    }
  };

  const handleNaechsterInhalt = () => {
    if (lektion && currentIndex < lektion.inhalt.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Reset Quiz State für neuen Inhalt
      setQuizState({
        fragenIndex: 0,
        ausgewaehlteAntworten: [],
        falscheAntworten: [],
        beantwortet: false,
        richtig: false,
      });
    } else {
      setLektionAbgeschlossen(true);
    }
  };

  const springeZuInhalt = (index: number) => {
    setCurrentIndex(index);
    setQuizState({
      fragenIndex: 0,
      ausgewaehlteAntworten: [],
      falscheAntworten: [],
      beantwortet: false,
      richtig: false,
    });
  };

  if (!kurs || !lektion) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p style={{ color: "black" }}>Lade...</p>
      </main>
    );
  }

  if (lektionAbgeschlossen) {
    return (
      <main className="min-h-screen bg-slate-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-2 border-gray-300 text-center max-w-md">
          <h1 style={{ color: "black" }} className="text-2xl font-bold mb-4">
            Lektion abgeschlossen!
          </h1>
          <p style={{ color: "black" }} className="mb-6">
            Du hast alle Inhalte dieser Lektion erfolgreich bearbeitet.
          </p>
          <Link
            href={`/kurs/${kursId}`}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg inline-block"
          >
            Zurück zum Kurs
          </Link>
        </div>
      </main>
    );
  }

  const aktuellerInhalt = lektion.inhalt[currentIndex];

  const renderInhalt = (inhalt: LektionInhalt) => {
    switch (inhalt.typ) {
      case "markdown":
        return (
          <div className="prose max-w-none">
            <div
              style={{ color: "black", whiteSpace: "pre-wrap" }}
              className="text-lg leading-relaxed"
            >
              {inhalt.text}
            </div>
          </div>
        );

      case "youtube":
        return (
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${inhalt.videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        );

      case "video":
        return (
          <video controls className="w-full rounded-lg">
            <source src={inhalt.url} />
          </video>
        );

      case "quiz":
        const aktuelleQuizFragen = getCurrentQuizFragen();
        const aktuelleFrage = aktuelleQuizFragen[quizState.fragenIndex];
        
        if (!aktuelleFrage) {
          handleNaechsterInhalt();
          return null;
        }

        return (
          <div>
            <p style={{ color: "gray" }} className="text-sm mb-2">
              Frage {quizState.fragenIndex + 1} von {aktuelleQuizFragen.length}
              {quizState.fragenIndex >= alleQuizFragen.length && " (Wiederholung)"}
            </p>
            <h3 style={{ color: "black" }} className="text-xl font-bold mb-4">
              {aktuelleFrage.frage}
            </h3>
            
            <div className="space-y-3">
              {(aktuelleFrage.antworten ?? []).map((antwort, index) => {
                const istAusgewaehlt = quizState.ausgewaehlteAntworten.includes(index);
                let bgColor = "bg-gray-100 hover:bg-gray-200";
                let borderColor = "border-gray-300";
                
                if (quizState.beantwortet) {
                  if (antwort.richtig) {
                    bgColor = "bg-green-100";
                    borderColor = "border-green-500";
                  } else if (istAusgewaehlt && !antwort.richtig) {
                    bgColor = "bg-red-100";
                    borderColor = "border-red-500";
                  }
                } else if (istAusgewaehlt) {
                  bgColor = "bg-blue-100";
                  borderColor = "border-blue-500";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAntwortWaehlen(index)}
                    disabled={quizState.beantwortet}
                    className={`w-full p-4 rounded-lg text-left ${bgColor} border-2 ${borderColor} flex items-center gap-3`}
                    style={{ color: "black" }}
                  >
                    <span className={`w-6 h-6 rounded border-2 flex items-center justify-center ${istAusgewaehlt ? "bg-blue-500 border-blue-500" : "border-gray-400"}`}>
                      {istAusgewaehlt && <span className="text-white text-sm">✓</span>}
                    </span>
                    {antwort.text}
                    {quizState.beantwortet && antwort.richtig && (
                      <span style={{ color: "green" }} className="ml-auto font-bold">✓ Richtig</span>
                    )}
                    {quizState.beantwortet && istAusgewaehlt && !antwort.richtig && (
                      <span style={{ color: "red" }} className="ml-auto font-bold">✗ Falsch</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {!quizState.beantwortet ? (
                <button
                  onClick={handleAntwortPruefen}
                  disabled={quizState.ausgewaehlteAntworten.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Antwort prüfen
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <p style={{ color: quizState.richtig ? "green" : "red" }} className="font-bold">
                    {quizState.richtig ? "Richtig!" : "Leider falsch."}
                  </p>
                  <button
                    onClick={handleWeiter}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
                  >
                    Weiter
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Link
          href={`/kurs/${kursId}`}
          style={{ color: "black" }}
          className="inline-flex items-center hover:underline mb-4"
        >
          ← Zurück zum Kurs
        </Link>
        
        <div className={`rounded-xl p-4 mb-6 bg-gradient-to-r ${kurs.farbe}`}>
          <p className="text-white text-sm">{kurs.titel}</p>
          <h1 className="text-2xl font-bold text-white">{lektion.titel}</h1>
        </div>

        {/* Fortschritt */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: "black" }}>
              Inhalt {currentIndex + 1} von {lektion.inhalt.length}
            </span>
            <span style={{ color: "gray" }}>
              {Math.round(((currentIndex + 1) / lektion.inhalt.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${((currentIndex + 1) / lektion.inhalt.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Inhaltsübersicht - Springen zu Aufgaben */}
        <div className="mb-6 flex flex-wrap gap-2">
          {lektion.inhalt.map((inhalt, index) => (
            <button
              key={index}
              onClick={() => springeZuInhalt(index)}
              className={`px-3 py-2 rounded-lg text-sm border-2 ${
                index === currentIndex
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-white border-gray-300 hover:border-gray-400"
              }`}
              style={{ color: index === currentIndex ? "white" : "black" }}
            >
              {index + 1}. {inhalt.typ === "quiz" ? "Quiz" : inhalt.typ === "youtube" ? "Video" : "Text"}
            </button>
          ))}
        </div>

        {/* Inhalt */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-300 mb-6">
          {renderInhalt(aktuellerInhalt)}
        </div>

        {/* Navigation (nur für nicht-Quiz Inhalte) */}
        {aktuellerInhalt.typ !== "quiz" && (
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-bold py-3 px-6 rounded-lg"
            >
              Zurück
            </button>
            <button
              onClick={handleNaechsterInhalt}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              {currentIndex < lektion.inhalt.length - 1 ? "Weiter" : "Abschließen"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
