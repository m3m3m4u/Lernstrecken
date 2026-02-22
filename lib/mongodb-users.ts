import { MongoClient } from "mongodb";

// Zweite Datenbank für Benutzerdaten - NUR LESEN!
if (!process.env.MONGODB_USERS_URI) {
  throw new Error("Bitte MONGODB_USERS_URI in .env.local definieren");
}

const uri = process.env.MONGODB_USERS_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoUsersClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoUsersClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoUsersClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoUsersClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
