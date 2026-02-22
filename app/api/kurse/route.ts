import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Kurs } from "@/data/types";
import { kurse as defaultKurse } from "@/data/kurse";

const DB_NAME = "lernstrecken";
const COLLECTION_NAME = "kurse";

// GET: Alle Kurse abrufen
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Kurs>(COLLECTION_NAME);
    
    const kurse = await collection.find({}).toArray();
    
    // Wenn keine Kurse vorhanden, Default-Kurse einfügen
    if (kurse.length === 0) {
      await collection.insertMany(defaultKurse as any[]);
      return NextResponse.json(defaultKurse);
    }
    
    return NextResponse.json(kurse);
  } catch (error) {
    console.error("Fehler beim Laden der Kurse:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// POST: Neuen Kurs anlegen
export async function POST(request: Request) {
  try {
    const kurs: Kurs = await request.json();
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Kurs>(COLLECTION_NAME);
    
    await collection.insertOne(kurs as any);
    
    return NextResponse.json(kurs, { status: 201 });
  } catch (error) {
    console.error("Fehler beim Anlegen des Kurses:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// PUT: Alle Kurse aktualisieren (Bulk-Update)
export async function PUT(request: Request) {
  try {
    const kurse: Kurs[] = await request.json();
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Kurs>(COLLECTION_NAME);
    
    // Alle löschen und neu einfügen
    await collection.deleteMany({});
    if (kurse.length > 0) {
      await collection.insertMany(kurse as any[]);
    }
    
    return NextResponse.json(kurse);
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Kurse:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
