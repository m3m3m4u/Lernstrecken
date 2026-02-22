require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function test() {
  console.log('Teste Gesamtliste-Datenbank...');
  console.log('URI:', process.env.MONGODB_USERS_URI ? 'vorhanden' : 'FEHLT!');
  
  const client = new MongoClient(process.env.MONGODB_USERS_URI);
  
  try {
    await client.connect();
    console.log('Verbunden!');
    
    const dbs = await client.db().admin().listDatabases();
    console.log('Datenbanken:', dbs.databases.map(d => d.name));
    
    for (const dbInfo of dbs.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local') continue;
      
      const db = client.db(dbInfo.name);
      const cols = await db.listCollections().toArray();
      console.log(`\n${dbInfo.name}:`);
      console.log('  Collections:', cols.map(c => c.name));
      
      for (const col of cols) {
        const sample = await db.collection(col.name).findOne({});
        if (sample) {
          console.log(`  ${col.name} Felder:`, Object.keys(sample));
        }
      }
    }
  } catch (e) {
    console.error('Fehler:', e.message);
  } finally {
    await client.close();
    console.log('\nFertig!');
  }
}

test();
