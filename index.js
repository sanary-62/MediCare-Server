
// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@sanary.5oi2id1.mongodb.net/?retryWrites=true&w=majority&appName=Sanary`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     await client.connect();

//     const db = client.db("medi_care");
//     const campsCollection = db.collection("camps");
//     const participantsCollection = db.collection("participants");
//     const paymentHistoryCollection = db.collection("paymentHistory");
//     const feedbackCollection = db.collection("feedback");


//     app.put('/participants/:id', async (req, res) => {
//   const id = req.params.id;
//   const { participantName, image, contact } = req.body;

//   try {
//     const result = await participantsCollection.updateOne(
//       { _id: new ObjectId(id) },
//       { $set: { participantName, image, contact } }
//     );

//     // Send the entire result object, which includes modifiedCount
//     res.send(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({ message: "Failed to update participant", error: err });
//   }
// });


        
//     app.post('/feedback', async (req, res) => {
//   try {
//     const feedbackData = req.body;
//     const result = await feedbackCollection.insertOne(feedbackData);
//     return res.status(201).send({ message: "Feedback saved", insertedId: result.insertedId }); // added return
//   } catch (err) {
//     console.error(err);
//     return res.status(500).send({ message: "Failed to save feedback", error: err }); // added return
//   }
// });



//     app.get('/feedback', async (req, res) => {
//   try {
//     const feedbackList = await feedbackCollection.find().toArray();
//     res.send(feedbackList);
//   } catch (err) {
//     res.status(500).send({ message: "Failed to fetch feedback", error: err });
//   }
// });







//     app.get("/camps", async (req, res) => {
//       const camps = await campsCollection.find().toArray();
//       res.send(camps);
//     });

//     app.post("/camps", async (req, res) => {
//   try {
//     const newCamp = req.body;
//     if (newCamp.date) {
//       newCamp.date = new Date(newCamp.date); 
//     }
//     const result = await campsCollection.insertOne(newCamp);
//     res.send(result);
//   } catch (error) {
//     res.status(500).send({ message: "Failed to add camp", error });
//   }
// });


//     app.get("/camps/:id", async (req, res) => {
//       const id = req.params.id;
//       try {
//         const camp = await campsCollection.findOne({ _id: new ObjectId(id) });
//         if (!camp) {
//           return res.status(404).send({ message: "Camp not found" });
//         }
//         res.send(camp);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ message: "Internal server error" });
//       }
//     });

//     app.patch("/camps/increment/:id", async (req, res) => {
//       const id = req.params.id;
//       try {
//         const result = await campsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $inc: { participantCount: 1 } }
//         );
//         res.send(result);
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ message: "Failed to increment participant count" });
//       }
//     });

//     app.post("/participants", async (req, res) => {
//       try {
//         const newParticipant = req.body;
//         const result = await participantsCollection.insertOne(newParticipant);
//         res.send(result);
//       } catch (error) {
//         res.status(500).send({ message: "Failed to register participant", error });
//       }
//     });

//     app.get('/participants', async (req, res) => {
//       const email = req.query.email;
//       if (!email) return res.status(400).send({ message: "Email is required" });

//       try {
//         const result = await participantsCollection.find({ participantEmail: email }).toArray();
//         res.send(result);
//       } catch (err) {
//         res.status(500).send({ message: "Failed to fetch participants", error: err });
//       }
//     });

//     app.delete('/participants/:id', async (req, res) => {
//       const id = req.params.id;
//       try {
//         const result = await participantsCollection.deleteOne({ _id: new ObjectId(id) });
//         res.send(result);
//       } catch (err) {
//         res.status(500).send({ message: "Failed to cancel participation", error: err });
//       }
//     });

//     // PATCH to update participant payment status, confirmation, and transactionId
//     app.patch('/participants/payment/:id', async (req, res) => {
//       const id = req.params.id;
//       const { paymentStatus, confirmationStatus, transactionId } = req.body;

//       try {
//         const result = await participantsCollection.updateOne(
//           { _id: new ObjectId(id) },
//           { $set: { paymentStatus, confirmationStatus, transactionId } }
//         );
//         if (result.matchedCount === 0) {
//           return res.status(404).send({ message: "Participant not found" });
//         }
//         res.send({ message: "Payment updated" });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ message: "Failed to update payment", error: err });
//       }
//     });

//     // POST payment history record
//     app.post('/payment-history', async (req, res) => {
//       const paymentData = req.body;
//       try {
//         const result = await paymentHistoryCollection.insertOne(paymentData);
//         res.status(201).send({ message: "Payment history saved", insertedId: result.insertedId });
//       } catch (err) {
//         console.error(err);
//         res.status(500).send({ message: "Failed to save payment history", error: err });
//       }
//     });

//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Optional: await client.close();
//   }
// }
// run().catch(console.dir);





// // Default route
// app.get("/", (req, res) => {
//   res.send("MediCare Server is Running");
// });

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });



























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
    const participantsCollection = db.collection("participants");
    const paymentHistoryCollection = db.collection("paymentHistory");
    const feedbackCollection = db.collection("feedback");

    app.put('/participants/:id', async (req, res) => {
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
        res.status(500).send({ message: "Failed to update participant", error: err });
      }
    });

    app.post('/feedback', async (req, res) => {
      try {
        const feedbackData = req.body;
        const result = await feedbackCollection.insertOne(feedbackData);
        return res.status(201).send({ message: "Feedback saved", insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        return res.status(500).send({ message: "Failed to save feedback", error: err });
      }
    });

    app.get('/feedback', async (req, res) => {
      try {
        const feedbackList = await feedbackCollection.find().toArray();
        res.send(feedbackList);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch feedback", error: err });
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
    console.log("Looking for camp with ID:", id); // Add this
    const camp = await campsCollection.findOne({ _id: new ObjectId(id) });
    if (!camp) {
      return res.status(404).send({ message: "Camp not found" });
    }
    res.send(camp);
  } catch (err) {
    console.error("Error while fetching camp by ID:", err);
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

    app.post("/participants", async (req, res) => {
      try {
        const newParticipant = req.body;
        const result = await participantsCollection.insertOne(newParticipant);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to register participant", error });
      }
    });

    app.get('/participants', async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ message: "Email is required" });

      try {
        const result = await participantsCollection.find({ participantEmail: email }).toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to fetch participants", error: err });
      }
    });

    app.delete('/participants/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const result = await participantsCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
      } catch (err) {
        res.status(500).send({ message: "Failed to cancel participation", error: err });
      }
    });

    app.patch('/participants/payment/:id', async (req, res) => {
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
        res.status(500).send({ message: "Failed to update payment", error: err });
      }
    });

    app.post('/payment-history', async (req, res) => {
      const paymentData = req.body;
      try {
        const result = await paymentHistoryCollection.insertOne(paymentData);
        res.status(201).send({ message: "Payment history saved", insertedId: result.insertedId });
      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to save payment history", error: err });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Optionally close the connection
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("MediCare Server is Running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
