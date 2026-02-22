"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Kurs, Lektion, LektionInhalt, QuizInhalt, BenutzerFortschritt, QuizFrage, QuizAntwort } from "@/data/types";

interface Benutzer {
  vorname: string;
  familienname: string;
  benutzername: string;
}

interface QuizState {
  fragenIndex: number;
  ausgewaehlteAntworten: number[];
  falscheFragenIndizes: number[]; // Indizes der falsch beantworteten Fragen
  beantwortet: boolean;
  richtig: boolean;
  wiederholungsModus: boolean; // Ob wir falsche Fragen wiederholen
  wiederholungsFragenIndex: number; // Index innerhalb der Wiederholungsfragen
}

export default function LernenLektionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const kursId = params.id as string;
  const lektionId = params.lektionId as string;
  const vorschauParam = searchParams.get("vorschau");
  const istVorschau = vorschauParam === "true" || vorschauParam === "admin";
  const istAdminVorschau = vorschauParam === "admin";

  const [benutzer, setBenutzer] = useState<Benutzer | null>(null);
  const [kurs, setKurs] = useState<Kurs | null>(null);
  const [lektion, setLektion] = useState<Lektion | null>(null);
  const [fortschritt, setFortschritt] = useState<BenutzerFortschritt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fehlerInLektion, setFehlerInLektion] = useState(0);

  // Quiz State
  const [quizState, setQuizState] = useState<QuizState>({
    fragenIndex: 0,
    ausgewaehlteAntworten: [],
    falscheFragenIndizes: [],
    beantwortet: false,
    richtig: false,
    wiederholungsModus: false,
    wiederholungsFragenIndex: 0,
  });
  const [lektionAbgeschlossen, setLektionAbgeschlossen] = useState(false);

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
          const gefundeneLektion = kursData.lektionen.find(
            (l: Lektion) => l.id === lektionId
          );
          if (gefundeneLektion) {
            setLektion(gefundeneLektion);
          }
        })
        .catch((err) => {
          console.error("Fehler:", err);
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
      .then(([kursData, fortschrittData]) => {
        if (kursData.error) {
          router.push("/lernen");
          return;
        }
        setKurs(kursData);
        setFortschritt(fortschrittData);

        const gefundeneLektion = kursData.lektionen.find(
          (l: Lektion) => l.id === lektionId
        );
        if (gefundeneLektion) {
          setLektion(gefundeneLektion);
        }
      })
      .catch((err) => {
        console.error("Fehler:", err);
      });
  }, [router, kursId, lektionId, istVorschau]);

  // Hole alle Fragen aus dem aktuellen Quiz-Inhalt
  const getCurrentQuizFragen = (): QuizFrage[] => {
    const inhalt = lektion?.inhalt[currentIndex];
    if (!inhalt || inhalt.typ !== "quiz") return [];
    
    const quiz = inhalt as QuizInhalt;
    // Unterstütze altes und neues Format
    if (quiz.fragen && quiz.fragen.length > 0) {
      return quiz.fragen;
    }
    // Altes Format: einzelne Frage/Antworten
    if (quiz.frage && quiz.antworten) {
      return [{ frage: quiz.frage, antworten: quiz.antworten }];
    }
    return [];
  };

  const alleQuizFragen = getCurrentQuizFragen();

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

    const aktuelleFrage = getAktuelleFrage();
    if (!aktuelleFrage) return;

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

    if (!istRichtig) {
      setFehlerInLektion((prev) => prev + 1);
    }

    setQuizState((prev) => {
      const aktuellerFragenIndex = prev.wiederholungsModus 
        ? prev.falscheFragenIndizes[prev.wiederholungsFragenIndex]
        : prev.fragenIndex;
      
      return {
        ...prev,
        beantwortet: true,
        richtig: istRichtig,
        falscheFragenIndizes: istRichtig
          ? prev.falscheFragenIndizes
          : prev.wiederholungsModus
            ? prev.falscheFragenIndizes // Im Wiederholungsmodus bleibt die Frage drin
            : [...prev.falscheFragenIndizes, aktuellerFragenIndex],
      };
    });
  };

  // Aktuelle Frage holen (normal oder Wiederholung)
  const getAktuelleFrage = (): QuizFrage | null => {
    const fragen = getCurrentQuizFragen();
    if (quizState.wiederholungsModus) {
      const originalIndex = quizState.falscheFragenIndizes[quizState.wiederholungsFragenIndex];
      return fragen[originalIndex] || null;
    }
    return fragen[quizState.fragenIndex] || null;
  };

  const handleWeiter = () => {
    const fragen = getCurrentQuizFragen();

    if (quizState.wiederholungsModus) {
      // Im Wiederholungsmodus
      if (quizState.richtig) {
        // Frage richtig beantwortet - aus der Liste entfernen
        const neueFalsche = quizState.falscheFragenIndizes.filter(
          (_, i) => i !== quizState.wiederholungsFragenIndex
        );
        
        if (neueFalsche.length === 0) {
          // Alle Wiederholungsfragen richtig - Quiz fertig
          handleNaechsterInhalt();
        } else {
          // Nächste Wiederholungsfrage (oder von vorne)
          const neuerIndex = quizState.wiederholungsFragenIndex >= neueFalsche.length 
            ? 0 
            : quizState.wiederholungsFragenIndex;
          setQuizState({
            ...quizState,
            falscheFragenIndizes: neueFalsche,
            wiederholungsFragenIndex: neuerIndex,
            ausgewaehlteAntworten: [],
            beantwortet: false,
            richtig: false,
          });
        }
      } else {
        // Frage wieder falsch - nächste Frage in der Wiederholung
        const neuerIndex = (quizState.wiederholungsFragenIndex + 1) % quizState.falscheFragenIndizes.length;
        setQuizState({
          ...quizState,
          wiederholungsFragenIndex: neuerIndex,
          ausgewaehlteAntworten: [],
          beantwortet: false,
          richtig: false,
        });
      }
    } else {
      // Normaler Modus
      if (quizState.fragenIndex < fragen.length - 1) {
        // Nächste Frage
        setQuizState((prev) => ({
          ...prev,
          fragenIndex: prev.fragenIndex + 1,
          ausgewaehlteAntworten: [],
          beantwortet: false,
          richtig: false,
        }));
      } else {
        // Alle Fragen durch
        if (quizState.falscheFragenIndizes.length > 0 || !quizState.richtig) {
          // Es gibt falsche Fragen - Wiederholungsmodus starten
          const falsche = !quizState.richtig && !quizState.falscheFragenIndizes.includes(quizState.fragenIndex)
            ? [...quizState.falscheFragenIndizes, quizState.fragenIndex]
            : quizState.falscheFragenIndizes;
          
          setQuizState({
            fragenIndex: quizState.fragenIndex,
            ausgewaehlteAntworten: [],
            falscheFragenIndizes: falsche,
            beantwortet: false,
            richtig: false,
            wiederholungsModus: true,
            wiederholungsFragenIndex: 0,
          });
        } else {
          // Alle richtig - weiter
          handleNaechsterInhalt();
        }
      }
    }
  };

  const handleNaechsterInhalt = () => {
    if (lektion && currentIndex < lektion.inhalt.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuizState({
        fragenIndex: 0,
        ausgewaehlteAntworten: [],
        falscheFragenIndizes: [],
        beantwortet: false,
        richtig: false,
        wiederholungsModus: false,
        wiederholungsFragenIndex: 0,
      });
    } else {
      // Lektion abschließen
      if (istVorschau) {
        // Im Vorschau-Modus: Einfach als abgeschlossen markieren ohne Speichern
        setLektionAbgeschlossen(true);
      } else {
        speichereFortschritt();
      }
    }
  };

  const speichereFortschritt = async () => {
    if (!benutzer || !kurs) return;

    try {
      // Lektion als abgeschlossen markieren
      const updatedFortschritt = await fetch("/api/fortschritt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          benutzername: benutzer.benutzername,
          kursId,
          lektionId,
          fehlerHinzu: fehlerInLektion,
          abgeschlossen:
            (fortschritt?.lektionenAbgeschlossen.length || 0) + 1 >=
            kurs.lektionen.length,
        }),
      }).then((res) => res.json());

      setFortschritt(updatedFortschritt);
      setLektionAbgeschlossen(true);
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      setLektionAbgeschlossen(true);
    }
  };

  const springeZuInhalt = (index: number) => {
    setCurrentIndex(index);
    setQuizState({
      fragenIndex: 0,
      ausgewaehlteAntworten: [],
      falscheFragenIndizes: [],
      beantwortet: false,
      richtig: false,
      wiederholungsModus: false,
      wiederholungsFragenIndex: 0,
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
    const alleAbgeschlossen = !istVorschau &&
      (fortschritt?.lektionenAbgeschlossen.length || 0) >= kurs.lektionen.length;

    return (
      <main className="min-h-screen bg-slate-100 p-8 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl border-2 border-gray-300 text-center max-w-md">
          {istVorschau && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mb-4">
              <span className="text-amber-800 font-medium text-sm">{istAdminVorschau ? "Admin-Vorschau" : "Gast-Modus"}</span>
            </div>
          )}
          <h1 style={{ color: "black" }} className="text-2xl font-bold mb-4">
            {alleAbgeschlossen ? "Kurs abgeschlossen!" : "Lektion abgeschlossen!"}
          </h1>
          <p style={{ color: "black" }} className="mb-2">
            Du hast {fehlerInLektion === 0 ? "keine" : fehlerInLektion} Fehler gemacht.
          </p>
          {alleAbgeschlossen && (
            <p style={{ color: "green" }} className="mb-4 font-bold">
              Herzlichen Glückwunsch! Du hast den gesamten Kurs abgeschlossen!
            </p>
          )}
          {istVorschau && (
            <p className="text-sm text-amber-600 mb-4">
              {istAdminVorschau ? "Vorschau-Modus — Fortschritt wird nicht gespeichert." : "Melde dich an, um deinen Fortschritt zu speichern."}
            </p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={`/lernen/kurs/${kursId}${istVorschau ? `?vorschau=${vorschauParam}` : ""}`}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg inline-block"
            >
              Zurück zum Kurs
            </Link>
            {istVorschau && (
              <>
                {istAdminVorschau ? (
                  <Link
                    href="/admin/dashboard"
                    className="bg-slate-500 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg inline-block"
                  >
                    Zum Admin
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg inline-block"
                    >
                      Jetzt anmelden
                    </Link>
                    <Link
                      href="/"
                      className="bg-slate-400 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg inline-block"
                    >
                      Zur Übersicht
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
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
        const quizFragen = getCurrentQuizFragen();
        const aktuelleFrage = getAktuelleFrage();

        if (!aktuelleFrage || quizFragen.length === 0) {
          handleNaechsterInhalt();
          return null;
        }

        const anzeigeIndex = quizState.wiederholungsModus 
          ? quizState.wiederholungsFragenIndex + 1
          : quizState.fragenIndex + 1;
        const anzeigeTotal = quizState.wiederholungsModus 
          ? quizState.falscheFragenIndizes.length
          : quizFragen.length;

        return (
          <div>
            <p style={{ color: "gray" }} className="text-sm mb-2">
              Frage {anzeigeIndex} von {anzeigeTotal}
              {quizState.wiederholungsModus && " (Wiederholung - falsche Fragen)"}
            </p>
            <h3 style={{ color: "black" }} className="text-xl font-bold mb-4">
              {aktuelleFrage.frage}
            </h3>

            <div className="space-y-3">
              {(aktuelleFrage.antworten ?? []).map((antwort, index) => {
                let bgColor = "bg-white border-gray-300 hover:bg-gray-50";
                let textColor = "black";

                if (quizState.beantwortet) {
                  if (antwort.richtig) {
                    bgColor = "bg-green-100 border-green-500";
                    textColor = "green";
                  } else if (quizState.ausgewaehlteAntworten.includes(index)) {
                    bgColor = "bg-red-100 border-red-500";
                    textColor = "red";
                  }
                } else if (quizState.ausgewaehlteAntworten.includes(index)) {
                  bgColor = "bg-blue-100 border-blue-500";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleAntwortWaehlen(index)}
                    disabled={quizState.beantwortet}
                    className={`w-full p-4 border-2 rounded-lg text-left flex items-center gap-3 ${bgColor}`}
                  >
                    <div
                      className={`w-6 h-6 border-2 rounded flex items-center justify-center ${
                        quizState.ausgewaehlteAntworten.includes(index)
                          ? "bg-blue-500 border-blue-500"
                          : "border-gray-400"
                      }`}
                    >
                      {quizState.ausgewaehlteAntworten.includes(index) && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                    <span style={{ color: textColor }}>{antwort.text}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {!quizState.beantwortet ? (
                <button
                  onClick={handleAntwortPruefen}
                  disabled={quizState.ausgewaehlteAntworten.length === 0}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Antwort prüfen
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <p
                    style={{ color: quizState.richtig ? "green" : "red" }}
                    className="font-bold"
                  >
                    {quizState.richtig ? "Richtig!" : "Leider falsch"}
                  </p>
                  <button
                    onClick={handleWeiter}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
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
            <button
              onClick={() => router.push(istAdminVorschau ? "/admin/dashboard" : "/login")}
              className={`${istAdminVorschau ? "text-amber-700 hover:text-amber-900" : "text-blue-600 hover:text-blue-800"} font-medium text-sm hover:underline`}
            >
              {istAdminVorschau ? "Zurück zum Admin" : "Jetzt anmelden"}
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link
            href={`/lernen/kurs/${kursId}${istVorschau ? `?vorschau=${vorschauParam}` : ""}`}
            style={{ color: "black" }}
            className="hover:underline"
          >
            ← Zurück zum Kurs
          </Link>
          <span style={{ color: "gray" }}>
            Inhalt {currentIndex + 1} von {lektion.inhalt.length}
          </span>
        </div>

        {/* Lektion Titel */}
        <h1 style={{ color: "black" }} className="text-2xl font-bold mb-6">
          {lektion.titel}
        </h1>

        {/* Inhalts-Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {lektion.inhalt.map((_, index) => (
            <button
              key={index}
              onClick={() => springeZuInhalt(index)}
              className={`w-8 h-8 rounded-full text-sm font-bold ${
                index === currentIndex
                  ? "bg-blue-500 text-white"
                  : index < currentIndex
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {/* Inhalt */}
        <div className="bg-white p-6 rounded-xl border-2 border-gray-300 mb-6">
          {renderInhalt(aktuellerInhalt)}
        </div>

        {/* Navigation (für nicht-Quiz Inhalte) */}
        {aktuellerInhalt.typ !== "quiz" && (
          <div className="flex justify-between">
            <button
              onClick={() => currentIndex > 0 && springeZuInhalt(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="bg-gray-300 hover:bg-gray-400 disabled:opacity-50 text-gray-700 font-bold py-3 px-6 rounded-lg"
            >
              Zurück
            </button>
            <button
              onClick={handleNaechsterInhalt}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              {currentIndex === lektion.inhalt.length - 1 ? "Abschließen" : "Weiter"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
