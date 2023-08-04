const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid = require("uid2");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI);

// Import des models & middlewares
const User = require("./models/User");
const Offer = require("./models/Offer");
const isAuthenticated = require("./middelwares/isAuthenticated");

// Import des routes
const userRoutes = require("./Routes/user");
app.use(userRoutes);

const offersRoutes = require("./Routes/offer");
app.use(offersRoutes);

// ROUTE Serveur mis en ligne
app.get("/", (req, res) => {
  try {
    res.status(200).json("Bienvenue sur le serveur Vinted ! ");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/offers", fileUpload, async (req, res) => {
  try {
    const foundUser = await findOne({ owner: req.body.username });
    console.log("=> ", req.body);
    console.log(foundUser);
    res.status(200).json("en cours ...");
  } catch (error) {
    res.status(400).json("error whith the offer ");
  }
});

app.all("*", (req, res) => {
  try {
    res.status(404).json("Cette page n'existe pas");
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log("Server started !");
});
