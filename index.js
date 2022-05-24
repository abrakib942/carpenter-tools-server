const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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

    app.put("/tool/:id", async (req, res) => {
      const id = req.params.id;
      const orderQuantity = req.body;

      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { orderQuantity },
      };
      const options = { upsert: true };
      const result = await toolCollection.updateOne(filter, updateDoc, options);

      res.send(result);
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

    app.get("/review", async (req, res) => {
      const reviews = await reviewCollection.find({}).toArray();
      res.send(reviews);
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
