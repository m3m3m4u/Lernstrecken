import { Kurs } from './types';

// Kurse (später aus Datenbank)
export const kurse: Kurs[] = [
  {
    id: "podcasts-interviews",
    titel: "Podcasts und Interviews",
    beschreibung: "Lerne wie du professionelle Podcasts und Interviews aufnimmst und bearbeitest",
    farbe: "from-violet-500 to-purple-600",
    icon: "POD",
    lektionen: [],
  },
  {
    id: "3d-druck",
    titel: "3D-Druck",
    beschreibung: "Erstelle eigene 3D-Modelle und drucke sie aus",
    farbe: "from-sky-500 to-blue-600",
    icon: "3D",
    lektionen: [],
  },
  {
    id: "lasercutter",
    titel: "Schneiden und Gravieren mit dem LaserCutter",
    beschreibung: "Präzises Schneiden und Gravieren von verschiedenen Materialien",
    farbe: "from-rose-500 to-red-600",
    icon: "LAS",
    lektionen: [],
  },
  {
    id: "lego-spike",
    titel: "Programmieren mit Lego Spike",
    beschreibung: "Baue und programmiere Roboter mit Lego Spike",
    farbe: "from-amber-500 to-orange-600",
    icon: "LEG",
    lektionen: [],
  },
  {
    id: "greenscreen",
    titel: "Filmen mit dem Greenscreen",
    beschreibung: "Erstelle Videos mit professionellen Greenscreen-Effekten",
    farbe: "from-emerald-500 to-green-600",
    icon: "GS",
    lektionen: [],
  },
];
