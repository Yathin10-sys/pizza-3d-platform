const { MongoClient } = require('mongodb');

console.log("Starting MongoDB connection test...");

// Direct connection (non-SRV) - bypasses DNS SRV query issue
const uri = "mongodb://yathinbobby1_db:sliceflow123@ac-akcefnk-shard-00-00.ssxscqo.mongodb.net:27017,ac-akcefnk-shard-00-01.ssxscqo.mongodb.net:27017,ac-akcefnk-shard-00-02.ssxscqo.mongodb.net:27017/?ssl=true&replicaSet=atlas-5mmhne-shard-0&authSource=admin&retryWrites=true&w=majority";

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
