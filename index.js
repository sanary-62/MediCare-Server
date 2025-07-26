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
  credential: admin.credential.cert(serviceAccount),
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
    const organizersCollection = db.collection("organizers");

    //custom middleware
    const verifyFBToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded = decoded; // this is needed in verifyAdmin
    next();
  } catch (err) {
    return res.status(401).send({ message: "Invalid token", error: err.message });
  }
};



const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.decoded.email;
    const user = await usersCollection.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    next();
  } catch (err) {
    return res.status(500).send({ message: 'Admin verification failed', error: err });
  }
};



app.get('/users/search', verifyFBToken, async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: 'Email is required' });

  try {
    // Use case-insensitive regex to match partial email
    const user = await usersCollection.findOne({ email: { $regex: email, $options: 'i' } });

    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (err) {
    res.status(500).send({ message: 'Error searching user', error: err });
  }
});


// Update user role (admin or remove admin)
app.patch('/users/role/:email', verifyFBToken, verifyAdmin, async (req, res) => {
  const email = req.params.email;
  const { role } = req.body;

  if (!email || !role) {
    return res.status(400).send({ message: 'Email and role are required' });
  }

  try {
    const result = await usersCollection.updateOne(
      { email },
      { $set: { role } }
    );
    res.send({ message: 'User role updated', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).send({ message: 'Failed to update role', error: err });
  }
});


// Check if user is admin
app.get('/users/is-admin/:email', async (req, res) => {
  const email = req.params.email;

  if (!email) {
    return res.status(400).send({ message: 'Email is required' });
  }

  try {
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const isAdmin = user.role === 'admin';
    res.send({ isAdmin });
  } catch (err) {
    res.status(500).send({ message: 'Failed to check role', error: err });
  }
});



// existing code above remains unchanged

// --- Add this below your other routes inside `run()` ---

// 1. GET Camps by Organizer
app.get("/my-camps", verifyFBToken, async (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).send({ message: "Email is required" });
  try {
    const camps = await campsCollection.find({ organizerEmail: email }).toArray();
    res.send(camps);
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch camps", error: err });
  }
});

// 2. PATCH Update a Camp
app.patch("/update-camp/:id", verifyFBToken, async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  try {
    console.log("Incoming update for camp ID:", id);
    console.log("Update data:", updatedData);

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid camp ID format" });
    }

    const result = await campsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    console.log("Update result:", result);

    res.send(result);
  } catch (err) {
    console.error("Failed to update camp:", err);
    res.status(500).send({ message: "Failed to update camp", error: err.message });
  }
});


// 3. DELETE Camp
app.delete("/delete-camp/:id", verifyFBToken, async (req, res) => {
  const id = req.params.id;
  try {
    const result = await campsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to delete camp", error: err });
  }
});




app.get('/registered-camps', async (req, res) => {
  const email = req.query.organizerEmail;
   const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  if (!email) {
    return res.status(400).send({ message: 'Missing organizer email' });
  }

  try {
    
    const camps = await campsCollection.find({  }).toArray();

    const campIds = camps.map(camp => camp._id.toString());

    console.log("Camps found:", camps.length, "Camp IDs:", campIds);

     const totalItems = await participantsCollection.countDocuments({ campId: { $in: campIds } });



    const participants = await participantsCollection
      .find({ campId: { $in: campIds } })
       .skip(skip)
      .limit(limit)
      .toArray();

      const totalPages = Math.ceil(totalItems / limit);

    res.send({registrations:participants, totalPages: participants.length, currentPage: page,
      totalItems: totalItems});
  } catch (error) {
    console.error('Error fetching registered participants:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});




// 5. PATCH Confirm Registration
app.patch("/confirm-registration/:id", verifyFBToken, async (req, res) => {
  const id = req.params.id;
  try {
    const result = await participantsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { confirmationStatus: "Confirmed" } }
    );
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to confirm registration", error: err });
  }
});

// 6. DELETE Cancel Registration
app.delete("/cancel-registration/:id", verifyFBToken, async (req, res) => {
  const id = req.params.id;
  try {
    const result = await participantsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (err) {
    res.status(500).send({ message: "Failed to cancel registration", error: err });
  }
});




app.post("/users", async (req, res) => {
  const { email, name } = req.body;

  const userExists = await usersCollection.findOne({ email });
  if (userExists) {
    return res.status(200).send({ message: "User already exists", inserted: false });
  }

  const user = { email, name: name || "Unknown" };
  const result = await usersCollection.insertOne(user);
  res.send(result);
});


   app.put("/participants/:id", async (req, res) => {
  const id = req.params.id;
  const { name, image, contact, email } = req.body;

  try {
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          participantName: name, 
          image,
          contact,
          email
        }
      }
    );
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Failed to update participant", error: err });
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


   app.post("/organizers", async (req, res) => {
  try {
    const { email, ...rest } = req.body;

    // Get name from users collection using email
    const user = await usersCollection.findOne({ email });
console.log("Fetched user for organizer:", user);


    const newOrganizer = {
      email,
      ...rest,
      name, // Include the name here
      status: (req.body.status || 'pending').toLowerCase()
    };

    const result = await organizersCollection.insertOne(newOrganizer);
    res.send({ insertedId: result.insertedId });
  } catch (err) {
    console.error("Error inserting organizer:", err);
    res.status(500).send({ message: "Failed to save organizer", error: err });
  }
});



app.get("/organizers", verifyFBToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      if (status.toLowerCase() === "pending") {
        query = { $or: [ { status: { $regex: /^pending$/i } }, { status: { $exists: false } } ] };
      } else {
        query = { status: { $regex: new RegExp(`^${status}$`, 'i') } };
      }
    }
    const result = await organizersCollection.find(query).toArray();

    console.log("Fetched organizers:", result.map(o => ({ id: o._id, name: o.name, participantName: o.participantName })));

    res.send(result);
  } catch (err) {
    console.error("Error fetching organizers:", err);
    res.status(500).send({ message: "Failed to fetch organizers", error: err });
  }
});


app.patch("/organizers/:id", verifyFBToken, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).send({ message: "Status is required" });
  }

  try {
    // Step 1: Get the organizer first
    const organizer = await organizersCollection.findOne({ _id: new ObjectId(id) });
    if (!organizer) {
      return res.status(404).send({ message: "Organizer not found" });
    }

    // Step 2: Update organizer status
    const result = await organizersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: status.toLowerCase() } }
    );

    // Step 3: If accepted, update user role
    if (status === 'accept') {
      const userQuery = { email: organizer.email };
      const userUpdatedDoc = {
        $set: {
          role: 'organizer'
        }
      };
      const roleResult = await usersCollection.updateOne(userQuery, userUpdatedDoc);
      console.log("User role update:", roleResult.modifiedCount);
    }

    res.send({ message: "Status updated", modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error("Failed to update organizer status:", err);
    res.status(500).send({ message: "Failed to update status", error: err });
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
  const page = parseInt(req.query.page) || 1;   // default page 1
  const limit = parseInt(req.query.limit) || 10; // default 10 items per page
  const skip = (page - 1) * limit;

  try {
    const totalItems = await campsCollection.countDocuments();
    const camps = await campsCollection.find().skip(skip).limit(limit).toArray();

    const totalPages = Math.ceil(totalItems / limit);

    res.send({
      camps,
      totalPages,
      currentPage: page,
      totalItems
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch camps", error: err.message });
  }
});


    app.post("/camps", verifyFBToken, async (req, res) => {
  const { email } = req.decoded;
  const user = await usersCollection.findOne({ email });

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return res.status(403).send({ message: 'Only organizers or admins can create camps' });
  }

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
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;    
  const limit = parseInt(req.query.limit) || 10;   
  const skip = (page - 1) * limit;

   const query = {
    email: email, 
    campName: { $regex: search, $options: 'i' } 
  };

  if (!email) return res.status(400).send({ message: "Email is required" });

  try {
    
    const query = { email: { $regex: `^${email}$`, $options: "i" } };

    
    const total = await participantsCollection.countDocuments(query);

     const result = await participantsCollection

    
    const participants = await participantsCollection
      .find(query)
      .skip(skip)
      .limit(limit)
      .toArray();

    
    const totalPages = Math.ceil(total / limit);

    res.send({
      participants,   
      totalPages,
      currentPage: page,
      totalItems: total,
    });
  } catch (err) {
    res.status(500).send({ message: "Failed to fetch participants", error: err });
  }
});



    app.delete("/participants/:id", verifyFBToken, verifyAdmin, async (req, res) => {
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
        res.status(201).send({
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
       email,
        campId,
      });

      console.log("Matching participant:", found);

      try {
        const updateResult = await participantsCollection.updateOne(
          { email, campId },
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
