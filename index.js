const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.estsi.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const toolCollection = client.db("carpenter-tools").collection("tools");
    const orderCollection = client.db("carpenter-tools").collection("orders");
    const reviewCollection = client.db("carpenter-tools").collection("reviews");
    const userCollection = client.db("carpenter-tools").collection("users");
    const paymentCollection = client
      .db("carpenter-tools")
      .collection("payments");

    app.get("/tool", async (req, res) => {
      const tools = await toolCollection.find({}).toArray();

      res.send(tools);
    });

    app.get("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolCollection.findOne(query);
      res.send(tool);
    });

    // app.put("/tool/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const orderQuantity = req.body;

    //   const filter = { _id: ObjectId(id) };
    //   const updateDoc = {
    //     $set: { orderQuantity },
    //   };
    //   const options = { upsert: true };
    //   const result = await toolCollection.updateOne(filter, updateDoc, options);

    //   res.send(result);
    // });

    app.post("/tool", async (req, res) => {
      const addProduct = req.body;
      const result = await toolCollection.insertOne(addProduct);
      res.send(result);
    });

    app.delete("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const deleteTool = await toolCollection.deleteOne(query);
      res.send(deleteTool);
    });

    app.post("/order", async (req, res) => {
      const purchase = req.body;
      const result = await orderCollection.insertOne(purchase);
      res.send(result);
    });

    app.get("/order", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const orders = await orderCollection.find(query).toArray();
      res.send(orders);
    });

    app.get("/all-order", async (req, res) => {
      const orders = await orderCollection.find({}).toArray();
      res.send(orders);
    });

    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    });

    app.get("/review", async (req, res) => {
      const reviews = await reviewCollection.find({}).toArray();
      res.send(reviews);
    });

    app.post("/review", async (req, res) => {
      const addReview = req.body;
      const result = await reviewCollection.insertOne(addReview);
      res.send(result);
    });

    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(filter);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1h" }
      );
      res.send({ result, token });
    });

    app.get("/user", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };

      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.post("/create-payment-intent", async (req, res) => {
      const service = req.body;
      const totalPrice = service.totalPrice;
      const amount = totalPrice * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.patch("/order/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
      const result = await paymentCollection.insertOne(payment);
      res.send(updatedDoc);
    });

    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
    //
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello from carpenter tools");
});

app.listen(port, () => {
  console.log("carpenter is running on port", port);
});
