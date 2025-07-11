const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sanary.5oi2id1.mongodb.net/?retryWrites=true&w=majority&appName=Sanary`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db("medi_care");
    const campsCollection = db.collection("camps");
    const participantsCollection = db.collection("participants");  // <-- define here

    app.get("/camps", async (req, res) => {
      const camps = await campsCollection.find().toArray();
      res.send(camps);
    });

    app.post("/camps", async (req, res) => {
      try {
        const newCamp = req.body;
        console.log("Received camp:", newCamp);
        const result = await campsCollection.insertOne(newCamp);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to add camp", error });
      }
    });

    app.get("/camps/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const camp = await campsCollection.findOne({ _id: new ObjectId(id) });
        if (!camp) {
          return res.status(404).send({ message: "Camp not found" });
        }
        res.send(camp);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.patch("/camps/increment/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await campsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $inc: { participantCount: 1 } }
        );
        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to increment participant count" });
      }
    });

    // Move this inside run, after participantsCollection is defined
    app.post("/participants", async (req, res) => {
      try {
        const newParticipant = req.body;
        const result = await participantsCollection.insertOne(newParticipant);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to register participant", error });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Optional: await client.close();
  }
}
run().catch(console.dir);

// Default route
app.get("/", (req, res) => {
  res.send("MediCare Server is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
