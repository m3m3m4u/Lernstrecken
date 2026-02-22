// Typen für die Lernstrecken-App

export interface Kurs {
  id: string;
  titel: string;
  beschreibung: string;
  farbe: string;
  icon: string;
  lektionen: Lektion[];
  aktiv: boolean; // Kurs sichtbar für Benutzer
}

export interface Lektion {
  id: string;
  titel: string;
  inhalt: LektionInhalt[];
}

// Benutzer-Fortschritt
export interface BenutzerFortschritt {
  odernummer: string;
  benutzername: string;
  vorname: string;
  familienname: string;
  kursId: string;
  lektionenAbgeschlossen: string[]; // IDs der abgeschlossenen Lektionen
  fehlerGesamt: number;
  gestartetAm: string;
  abgeschlossenAm?: string; // Wenn Kurs fertig
}

export type LektionInhalt = 
  | VideoInhalt 
  | YouTubeInhalt 
  | MarkdownInhalt 
  | QuizInhalt;

export interface VideoInhalt {
  typ: 'video';
  url: string;
  titel?: string;
}

export interface YouTubeInhalt {
  typ: 'youtube';
  videoId: string;
  titel?: string;
}

export interface MarkdownInhalt {
  typ: 'markdown';
  text: string;
}

export interface QuizFrage {
  frage: string;
  antworten: QuizAntwort[];
}

export interface QuizInhalt {
  typ: 'quiz';
  fragen: QuizFrage[]; // Mehrere Fragen pro Quiz
  // Alte Felder für Abwärtskompatibilität
  frage?: string;
  antworten?: QuizAntwort[];
}

export interface QuizAntwort {
  text: string;
  richtig: boolean;
}
