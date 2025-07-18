const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");

dotenv.config();

const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());




const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sanary.5oi2id1.mongodb.net/?retryWrites=true&w=majority&appName=Sanary`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("medi_care");
    const campsCollection = db.collection("camps");
    const participantsCollection = db.collection("participants");
    const usersCollection = db.collection("users");

    const paymentHistoryCollection = db.collection("paymentHistory");
    const feedbackCollection = db.collection("feedback");


//custom middleware
    const verifyFBToken = async (req, res, next) => {
      const authHeader = req.headers.Authorization;
      if (!authHeader){
        return res.status(401).send ({message: 'unauthorized access' })
      }
      const token = authHeader.split(' ')[1];
      if(!token) {
        return res.status(401).send ({message: 'unauthorized access' })
      }

      //verify the token

      next();
    };





    app.post("/users", async (req, res) => {
       const email = req.body.email;
       const userExists = await usersCollection.findOne({ email })
       if (userExists){
        return res.status(200).send ({message: 'User already exist', inserted: false});
       }
       const user = req.body;
       const result = await usersCollection.insertOne(user);
       res.send(result);
    })

    app.put("/participants/:id", async (req, res) => {
      const id = req.params.id;
      const { participantName, image, contact } = req.body;
      try {
        const result = await participantsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { participantName, image, contact } }
        );
        res.send(result);
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to update participant", error: err });
      }
    });

    app.post("/feedback", async (req, res) => {
      try {
        const feedbackData = req.body;
        const result = await feedbackCollection.insertOne(feedbackData);
        return res
          .status(201)
          .send({ message: "Feedback saved", insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        return res
          .status(500)
          .send({ message: "Failed to save feedback", error: err });
      }
    });

    app.get("/feedback", async (req, res) => {
      try {
        const feedbackList = await feedbackCollection.find().toArray();
        res.send(feedbackList);
      } catch (err) {
        res
          .status(500)
          .send({ message: "Failed to fetch feedback", error: err });
      }
    });

    app.get("/camps", async (req, res) => {
      const camps = await campsCollection.find().toArray();
      res.send(camps);
    });

    app.post("/camps", async (req, res) => {
      try {
        const newCamp = req.body;
        
        if (newCamp.date) {
          newCamp.date = new Date(newCamp.date);
        }
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
        res
          .status(500)
          .send({ message: "Failed to increment participant count" });
      }
    });

    app.post("/participants", async (req, res) => {
      try {
        const newParticipant = req.body;
        const result = await participantsCollection.insertOne(newParticipant);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "Failed to register participant", error });
      }
    });

    app.get("/participants", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      try {
        const result = await participantsCollection
          .find({ participantEmail: email })
          .toArray();
        res.send(result);
      } catch (err) {
        res
          .status(500)
          .send({ message: "Failed to fetch participants", error: err });
      }
    });

    app.delete("/participants/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const result = await participantsCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        res
          .status(500)
          .send({ message: "Failed to cancel participation", error: err });
      }
    });

    app.patch("/participants/payment/:id", verifyFBToken, async (req, res) => {
      const id = req.params.id;
      const { paymentStatus, confirmationStatus, transactionId } = req.body;
      try {
        const result = await participantsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { paymentStatus, confirmationStatus, transactionId } }
        );
        if (result.matchedCount === 0) {
          return res.status(404).send({ message: "Participant not found" });
        }
        res.send({ message: "Payment updated" });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to update payment", error: err });
      }
    });

    app.get("/payment-history", async (req, res) => {
      const email = req.query.email;
      console.log("Fetching payment history for email:", email);
      console.log("paymentHistoryCollection is", paymentHistoryCollection);

      if (!paymentHistoryCollection) {
        console.error("paymentHistoryCollection is not initialized!");
        return res
          .status(500)
          .send({ message: "Database collection not ready" });
      }

      const filter = email ? { email } : {};

      try {
        const history = await paymentHistoryCollection
          .find(filter)
          .sort({ date: -1 })
          .toArray();

        console.log("Payment history found:", history.length);
        res.send(history);
      } catch (error) {
        console.error("Error fetching payment history:", error);
        res
          .status(500)
          .send({ message: "Failed to load payment history", error });
      }
    });

    app.post("/payment-history", async (req, res) => {
      const paymentData = req.body;
      try {
        const result = await paymentHistoryCollection.insertOne(paymentData);
        res
          .status(201)
          .send({
            message: "Payment history saved",
            insertedId: result.insertedId,
          });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .send({ message: "Failed to save payment history", error: err });
      }
    });

    app.post("/payment-success", async (req, res) => {
      const {
        transactionId,
        email,
        amount,
        campId,
        campName,
        participantName,
        date,
      } = req.body;

      console.log("Received payment info:", req.body);

      const found = await participantsCollection.findOne({
        participantEmail: email,
        campId,
      });

      console.log("Matching participant:", found);

      try {
        const updateResult = await participantsCollection.updateOne(
          { participantEmail: email, campId },
          {
            $set: {
              paymentStatus: "paid",
              confirmationStatus: "Confirmed",
              transactionId: transactionId,
            },
          }
        );

        if (updateResult.modifiedCount === 0) {
          return res.status(404).send({ message: "Participant not found" });
        }

        console.log("Looking for participant with:", { email, campId });

        const paymentHistory = {
          transactionId,
          email,
          amount,
          campId,
          campName,
          participantName,
          date: new Date(date),
        };

        const saveResult = await paymentHistoryCollection.insertOne(
          paymentHistory
        );

        res.send({
          message: "Payment processed and recorded successfully",
          transactionId,
          updateResult,
          insertedId: saveResult.insertedId,
        });
      } catch (error) {
        console.error("Error handling payment success:", error);
        res.status(500).send({ message: "Failed to process payment", error });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Optionally close the connection
  }
}

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  if (!amount || typeof amount !== "number" || isNaN(amount) || amount < 50) {
    return res
      .status(400)
      .send({ error: "Invalid amount. Must be a number >= 50 cents." });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(" Stripe error:", err);
    res.status(500).send({ error: err.message });
  }
});

async function startServer() {
  await run();

  app.get("/", (req, res) => {
    res.send("MediCare Server is Running");
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer().catch(console.dir);
