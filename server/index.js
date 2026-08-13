require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const NavSettings = require("./models/NavSettings");
const SectionSettings = require("./models/SectionSettings");

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

// GET Custom Nav Settings Endpoint
app.get("/api/settings/nav", async (req, res) => {
  try {
    let settings = await NavSettings.findOne({ key: 'nav_titles' });
    if (!settings) {
      const defaultNav = {
        fr: { home: "Accueil", dashboard: "Espace Élève", parent: "Espace Parent", calendar: "Calendrier", admin: "Admin" },
        ar: { home: "الرئيسية", dashboard: "لوحة الطالب", parent: "فضاء الوليّ", calendar: "التقويم", admin: "الإدارة" },
        en: { home: "Home", dashboard: "Student Space", parent: "Parent Space", calendar: "Schedule", admin: "Admin" },
      };
      settings = await NavSettings.create({ key: 'nav_titles', nav: defaultNav });
    }
    res.json({ nav: settings.nav });
  } catch (error) {
    console.error("Erreur Fetch Nav Settings:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des paramètres nav." });
  }
});

// PUT Update Nav Settings Endpoint
app.put("/api/settings/nav", async (req, res) => {
  try {
    const { nav } = req.body;
    if (!nav) {
      return res.status(400).json({ error: "Données nav invalides." });
    }
    let settings = await NavSettings.findOneAndUpdate(
      { key: 'nav_titles' },
      { nav },
      { new: true, upsert: true }
    );
    res.json({ message: "Paramètres nav mis à jour avec succès !", nav: settings.nav });
  } catch (error) {
    console.error("Erreur Update Nav Settings:", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour des paramètres nav." });
  }
});

// GET Custom Section Settings Endpoint
app.get("/api/settings/sections", async (req, res) => {
  try {
    let settings = await SectionSettings.findOne({ key: 'home_sections' });
    if (!settings) {
      settings = await SectionSettings.create({ key: 'home_sections', sections: {} });
    }
    res.json({ sections: settings.sections || {} });
  } catch (error) {
    console.error("Erreur Fetch Section Settings:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des sections." });
  }
});

// PUT Update Section Settings Endpoint
app.put("/api/settings/sections", async (req, res) => {
  try {
    const { sections } = req.body;
    if (!sections) {
      return res.status(400).json({ error: "Données sections invalides." });
    }
    let settings = await SectionSettings.findOneAndUpdate(
      { key: 'home_sections' },
      { sections },
      { new: true, upsert: true }
    );
    res.json({ message: "Sections mises à jour avec succès !", sections: settings.sections });
  } catch (error) {
    console.error("Erreur Update Section Settings:", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour des sections." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;