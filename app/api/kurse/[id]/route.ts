import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Kurs } from "@/data/types";

const DB_NAME = "lernstrecken";
const COLLECTION_NAME = "kurse";

// GET: Einzelnen Kurs abrufen
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Kurs>(COLLECTION_NAME);
    
    const kurs = await collection.findOne({ id });
    
    if (!kurs) {
      return NextResponse.json({ error: "Kurs nicht gefunden" }, { status: 404 });
    }
    
    return NextResponse.json(kurs);
  } catch (error) {
    console.error("Fehler beim Laden des Kurses:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// PUT: Kurs aktualisieren
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kurs: Kurs = await request.json();
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Kurs>(COLLECTION_NAME);
    
    await collection.updateOne({ id }, { $set: kurs }, { upsert: true });
    
    return NextResponse.json(kurs);
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Kurses:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}

// DELETE: Kurs löschen
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection<Kurs>(COLLECTION_NAME);
    
    await collection.deleteOne({ id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fehler beim Löschen des Kurses:", error);
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }
}
