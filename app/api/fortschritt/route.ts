import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { BenutzerFortschritt } from "@/data/types";

const DB_NAME = "lernstrecken";
const COLLECTION_NAME = "fortschritt";

// GET: Fortschritt eines Benutzers für einen Kurs abrufen
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const benutzername = searchParams.get("benutzername");
    const kursId = searchParams.get("kursId");

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<BenutzerFortschritt>(COLLECTION_NAME);

    if (benutzername && kursId) {
      // Einzelner Fortschritt
      const fortschritt = await collection.findOne({ benutzername, kursId });
      return NextResponse.json(fortschritt || null);
    } else if (benutzername) {
      // Alle Fortschritte eines Benutzers
      const fortschritte = await collection.find({ benutzername }).toArray();
      return NextResponse.json(fortschritte);
    } else if (kursId) {
      // Alle Fortschritte für einen Kurs (für Admin)
      const fortschritte = await collection.find({ kursId }).toArray();
      return NextResponse.json(fortschritte);
    } else {
      // Alle Fortschritte (für Admin)
      const fortschritte = await collection.find({}).toArray();
      return NextResponse.json(fortschritte);
    }
  } catch (error) {
    console.error("Fehler beim Laden des Fortschritts:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// POST: Fortschritt starten (Kurs beginnen)
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { benutzername, vorname, familienname, kursId } = data;

    if (!benutzername || !kursId) {
      return NextResponse.json(
        { error: "Benutzername und KursId erforderlich" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<BenutzerFortschritt>(COLLECTION_NAME);

    // Prüfen ob bereits vorhanden - mit upsert um Race Conditions zu vermeiden
    const existing = await collection.findOne({ benutzername, kursId });
    if (existing) {
      return NextResponse.json(existing);
    }

    // Neuen Fortschritt anlegen mit findOneAndUpdate + upsert
    const neuerFortschritt: BenutzerFortschritt = {
      odernummer: Date.now().toString(),
      benutzername,
      vorname: vorname || "",
      familienname: familienname || "",
      kursId,
      lektionenAbgeschlossen: [],
      fehlerGesamt: 0,
      gestartetAm: new Date().toISOString(),
    };

    const result = await collection.findOneAndUpdate(
      { benutzername, kursId },
      { $setOnInsert: neuerFortschritt },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Anlegen des Fortschritts:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// PUT: Fortschritt aktualisieren (Lektion abschließen, Fehler zählen)
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { benutzername, kursId, lektionId, fehlerHinzu, abgeschlossen } = data;

    if (!benutzername || !kursId) {
      return NextResponse.json(
        { error: "Benutzername und KursId erforderlich" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<BenutzerFortschritt>(COLLECTION_NAME);

    const fortschritt = await collection.findOne({ benutzername, kursId });
    if (!fortschritt) {
      return NextResponse.json({ error: "Fortschritt nicht gefunden" }, { status: 404 });
    }

    const updates: any = {};

    // Lektion als abgeschlossen markieren
    if (lektionId && !fortschritt.lektionenAbgeschlossen.includes(lektionId)) {
      updates.lektionenAbgeschlossen = [...fortschritt.lektionenAbgeschlossen, lektionId];
    }

    // Fehler hinzufügen
    if (typeof fehlerHinzu === "number") {
      updates.fehlerGesamt = (fortschritt.fehlerGesamt || 0) + fehlerHinzu;
    }

    // Kurs als abgeschlossen markieren
    if (abgeschlossen) {
      updates.abgeschlossenAm = new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      await collection.updateOne(
        { benutzername, kursId },
        { $set: updates }
      );
    }

    const aktualisiert = await collection.findOne({ benutzername, kursId });
    return NextResponse.json(aktualisiert);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Fortschritts:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
