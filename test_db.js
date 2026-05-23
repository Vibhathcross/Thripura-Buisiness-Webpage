// test_db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
console.log('Attempting connection to:', uri.split('@')[1] || uri); // hide password

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB database!');
    const db = client.db('thripura_db');
    const collections = await db.listCollections().toArray();
    console.log('Collections in thripura_db:');
    collections.forEach(col => console.log(` - ${col.name}`));
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  } finally {
    await client.close();
  }
}

run();
