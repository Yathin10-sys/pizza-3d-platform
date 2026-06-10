const { MongoClient } = require('mongodb');

console.log("Starting MongoDB connection test...");

// Direct connection (non-SRV) - bypasses DNS SRV query issue
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Attempting to connect...");
    await client.connect();
    console.log("Connected! Sending ping...");
    await client.db("admin").command({ ping: 1 });
    console.log("✅ SUCCESS! Connected to MongoDB!");
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
    console.error("Full error:", err);
  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

run();
