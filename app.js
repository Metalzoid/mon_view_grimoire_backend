const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");

const app = express();

// Middleware pour parser le JSON dans les requêtes
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

// Routes
// Authentification
app.use("/api/auth", userRoutes);

module.exports = app;
