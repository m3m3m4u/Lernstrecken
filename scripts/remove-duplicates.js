// Script zum Entfernen von Duplikaten aus der Fortschritt-Collection
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function removeDuplicates() {
  console.log('Verbinde mit MongoDB...');
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const collection = client.db('lernstrecken').collection('fortschritt');
  
  // Finde alle Fortschritte
  const alle = await collection.find({}).toArray();
  console.log('Gesamt:', alle.length);
  
  // Gruppiere nach benutzername + kursId
  const groups = {};
  alle.forEach(f => {
    const key = `${f.benutzername}|${f.kursId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  });
  
  // Finde und lösche Duplikate
  let geloescht = 0;
  for (const [key, items] of Object.entries(groups)) {
    if (items.length > 1) {
      console.log(`Duplikat gefunden: ${key} (${items.length}x)`);
      // Behalte den ersten, lösche den Rest
      for (let i = 1; i < items.length; i++) {
        await collection.deleteOne({ _id: items[i]._id });
        geloescht++;
      }
    }
  }
  
  console.log(`${geloescht} Duplikate gelöscht`);
  
  // Zeige verbleibende
  const verbleibend = await collection.find({}).toArray();
  console.log('Verbleibend:', verbleibend.length);
  verbleibend.forEach(f => console.log(`  ${f.benutzername} - ${f.kursId}`));
  
  await client.close();
  console.log('Fertig!');
}

removeDuplicates();
