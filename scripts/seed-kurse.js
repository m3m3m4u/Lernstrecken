// Script zum Einfügen der Standard-Kurse in MongoDB
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const kurse = [
  {
    id: 'podcasts-interviews',
    titel: 'Podcasts und Interviews',
    beschreibung: 'Lerne wie du professionelle Podcasts und Interviews aufnimmst und bearbeitest',
    farbe: 'from-violet-500 to-purple-600',
    icon: '',
    lektionen: [],
  },
  {
    id: '3d-druck',
    titel: '3D-Druck',
    beschreibung: 'Erstelle eigene 3D-Modelle und drucke sie aus',
    farbe: 'from-sky-500 to-blue-600',
    icon: '',
    lektionen: [],
  },
  {
    id: 'lasercutter',
    titel: 'LaserCutter',
    beschreibung: 'Schneide und graviere mit dem Lasercutter',
    farbe: 'from-rose-500 to-red-600',
    icon: '',
    lektionen: [],
  },
  {
    id: 'lego-spike',
    titel: 'Lego Spike',
    beschreibung: 'Programmiere Roboter mit Lego Spike',
    farbe: 'from-amber-500 to-orange-600',
    icon: '',
    lektionen: [],
  },
  {
    id: 'greenscreen',
    titel: 'Greenscreen',
    beschreibung: 'Erstelle Videos mit Greenscreen-Effekten',
    farbe: 'from-emerald-500 to-green-600',
    icon: '',
    lektionen: [],
  },
];

async function run() {
  console.log('Verbinde mit MongoDB...');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  console.log('Verbunden!');
  
  const db = client.db('lernstrecken');
  const collection = db.collection('kurse');
  
  // Prüfe ob Kurse vorhanden
  const count = await collection.countDocuments();
  console.log('Vorhandene Kurse:', count);
  
  if (count === 0) {
    await collection.insertMany(kurse);
    console.log('Standard-Kurse eingefuegt!');
  } else {
    console.log('Kurse sind bereits vorhanden.');
  }
  
  const allKurse = await collection.find({}).toArray();
  console.log('Alle Kurse:', allKurse.map(k => k.titel));
  
  await client.close();
  console.log('Fertig!');
}

run().catch(console.error);
