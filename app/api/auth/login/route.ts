import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb-users";

// WICHTIG: Diese Datenbank ist NUR zum Lesen!
// Niemals Schreiboperationen durchführen!

const DB_NAME = "gesamtliste";
const COLLECTION_NAME = "students";

// POST: Benutzer-Login prüfen
export async function POST(request: Request) {
  try {
    const { benutzername, passwort } = await request.json();
    
    if (!benutzername || !passwort) {
      return NextResponse.json(
        { error: "Benutzername und Passwort erforderlich" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // NUR LESEN - Benutzer suchen (Felder mit Großbuchstaben!)
    const benutzer = await collection.findOne({
      Benutzername: benutzername,
      Passwort: passwort,
    });
    
    if (!benutzer) {
      return NextResponse.json(
        { error: "Ungültige Anmeldedaten" },
        { status: 401 }
      );
    }
    
    // Erfolgreicher Login - Benutzerdaten zurückgeben (ohne Passwort)
    return NextResponse.json({
      success: true,
      benutzer: {
        vorname: benutzer.Vorname,
        familienname: benutzer.Familienname,
        benutzername: benutzer.Benutzername,
      },
    });
  } catch (error) {
    console.error("Fehler beim Login:", error);
    return NextResponse.json(
      { error: "Datenbankfehler" },
      { status: 500 }
    );
  }
}
