require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("=========================================");
    console.log("🚀 Connecté à MongoDB avec succès !");
    console.log("=========================================");
  })
  .catch((err) => {
    console.error("❌ Échec de la connexion à MongoDB :", err.message);
  });

// Routes
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "API Platform Français opérationnelle" });
});

// Signup Endpoint - Register user in MongoDB
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { parentName, childName, childAge, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "L'e-mail et le mot de passe sont obligatoires." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: "Cet e-mail est déjà utilisé." });
    }

    const newUser = new User({
      parentName,
      childName,
      childAge,
      email: email.toLowerCase(),
      password, // In production, hash with bcrypt
    });

    await newUser.save();

    const userObj = {
      id: newUser._id,
      parentName: newUser.parentName,
      childName: newUser.childName,
      childAge: newUser.childAge,
      email: newUser.email,
      role: newUser.role || 'user',
    };

    res.status(201).json({
      message: "Compte créé avec succès !",
      user: userObj,
    });
  } catch (error) {
    console.error("Erreur Inscription:", error);
    res.status(500).json({ error: "Erreur serveur lors de la création du compte." });
  }
});

// Login Endpoint - Authenticate user
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Veuillez remplir tous les champs." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "E-mail ou mot de passe incorrect." });
    }

    const userObj = {
      id: user._id,
      parentName: user.parentName,
      childName: user.childName,
      childAge: user.childAge,
      email: user.email,
      role: user.role || 'user',
    };

    res.json({
      message: "Connexion réussie !",
      user: userObj,
    });
  } catch (error) {
    console.error("Erreur Connexion:", error);
    res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
});

// Get All Clients Endpoint (For Admin Dashboard)
app.get("/api/clients", async (req, res) => {
  try {
    const clients = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ clients });
  } catch (error) {
    console.error("Erreur Fetch Clients:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des clients." });
  }
});

// Update Client Role Endpoint
app.put("/api/clients/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: "Client introuvable." });
    }
    client.role = role;
    await client.save();
    res.json({ message: "Rôle mis à jour avec succès !", client });
  } catch (error) {
    console.error("Erreur Update Role:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du rôle." });
  }
});

// Delete Client Endpoint
app.delete("/api/clients/:id", async (req, res) => {
  try {
    const deletedClient = await User.findByIdAndDelete(req.params.id);
    if (!deletedClient) {
      return res.status(404).json({ error: "Client introuvable." });
    }
    res.json({ message: "Client supprimé avec succès !" });
  } catch (error) {
    console.error("Erreur Delete Client:", error);
    res.status(500).json({ error: "Erreur lors de la suppression du client." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;