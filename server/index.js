require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const Session = require("./models/Session");
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
      status: newUser.status || 'Actif',
      availableDays: newUser.availableDays || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      timeSlots: newUser.timeSlots || ['10:00', '14:00', '16:30'],
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
      status: user.status || 'Actif',
      availableDays: user.availableDays || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      timeSlots: user.timeSlots || ['10:00', '14:00', '16:30'],
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

// GET All Teachers (Maîtresses) with Schedules
app.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await User.find({
      role: { $regex: /maitresse/i }
    }).select("-password").sort({ createdAt: -1 });

    const formattedTeachers = teachers.map(t => ({
      id: t._id,
      _id: t._id,
      name: t.parentName || t.email.split('@')[0],
      email: t.email,
      role: t.role,
      status: t.status,
      availableDays: t.availableDays && t.availableDays.length > 0
        ? t.availableDays
        : ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      timeSlots: t.timeSlots && t.timeSlots.length > 0
        ? t.timeSlots
        : ['10:00', '14:00', '16:30'],
    }));

    res.json({ teachers: formattedTeachers });
  } catch (error) {
    console.error("Erreur Fetch Teachers:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des maîtresses." });
  }
});

// PUT Update Specific Teacher Schedule
app.put("/api/teachers/:id/schedule", async (req, res) => {
  try {
    const { availableDays, timeSlots } = req.body;
    const teacher = await User.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ error: "Compte enseignant introuvable." });
    }

    if (availableDays !== undefined) teacher.availableDays = availableDays;
    if (timeSlots !== undefined) teacher.timeSlots = timeSlots;
    await teacher.save();

    res.json({
      message: "Planning de l'enseignant mis à jour avec succès !",
      teacher: {
        id: teacher._id,
        _id: teacher._id,
        name: teacher.parentName || teacher.email.split('@')[0],
        email: teacher.email,
        role: teacher.role,
        status: teacher.status,
        availableDays: teacher.availableDays,
        timeSlots: teacher.timeSlots,
      }
    });
  } catch (error) {
    console.error("Erreur Update Teacher Schedule:", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour du planning." });
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

// GET Single Client Profile Endpoint (For real-time role & status sync)
app.get("/api/clients/:id", async (req, res) => {
  try {
    const client = await User.findById(req.params.id).select("-password");
    if (!client) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }
    res.json({
      user: {
        id: client._id,
        _id: client._id,
        parentName: client.parentName,
        childName: client.childName,
        childAge: client.childAge,
        email: client.email,
        role: client.role || 'user',
        status: client.status || 'Actif',
        availableDays: client.availableDays || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
        timeSlots: client.timeSlots || ['10:00', '14:00', '16:30'],
      }
    });
  } catch (error) {
    console.error("Erreur Fetch Single Client:", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// Update Client Role & Status Endpoint (including teacher Subject)
app.put("/api/clients/:id/role", async (req, res) => {
  try {
    const { role, status, subject } = req.body;
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: "Client introuvable." });
    }
    if (role !== undefined) client.role = role;
    if (status !== undefined) client.status = status;
    if (subject !== undefined) client.subject = subject;
    await client.save();

    // If subject was provided, synchronize all sessions for this teacher
    if (subject) {
      const teacherName = client.parentName || client.email?.split('@')[0];
      const teacherEmail = (client.email || '').toLowerCase().trim();
      const teacherId = String(client._id);

      const teacherSessions = await Session.find({
        $or: [
          { teacherId: teacherId },
          { teacherEmail: teacherEmail },
          { teacherName: { $regex: new RegExp(`^${teacherName}$`, 'i') } },
        ],
      });

      for (const s of teacherSessions) {
        const match = String(s.subject || '').match(/(\(Séance \d+\/4\))/);
        const suffix = match ? ` ${match[1]}` : '';
        s.subject = `${subject}${suffix}`;
        await s.save();
      }
    }

    res.json({ message: "Compte mis à jour avec succès !", client });
  } catch (error) {
    console.error("Erreur Update Role/Status:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du rôle." });
  }
});

// GET All Teachers Endpoint
app.get("/api/teachers", async (req, res) => {
  try {
    const teachers = await User.find({
      $or: [
        { role: { $regex: /maitresse/i } },
        { role: { $regex: /teacher/i } },
        { role: { $regex: /maître/i } },
      ],
    }).select("-password");

    const formatted = teachers.map((t) => ({
      id: t._id,
      _id: t._id,
      teacherId: t._id,
      name: t.parentName || t.email.split('@')[0],
      parentName: t.parentName,
      email: t.email,
      role: t.role,
      subject: t.subject || 'Français & Arabe',
      availableDays: t.availableDays || ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
      timeSlots: t.timeSlots || ['10:00', '14:00', '16:30'],
    }));

    res.json({ teachers: formatted });
  } catch (error) {
    console.error("Erreur Fetch Teachers:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des enseignants." });
  }
});

// Update Client Status Endpoint
app.put("/api/clients/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: "Client introuvable." });
    }
    client.status = status;
    await client.save();
    res.json({ message: "Statut mis à jour avec succès !", client });
  } catch (error) {
    console.error("Erreur Update Status:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut." });
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

// ==========================================
// SESSIONS / RESERVATIONS ENDPOINTS
// ==========================================


// GET All Sessions (Supports filtering by teacherId, teacherEmail, or returns all)
app.get("/api/sessions", async (req, res) => {
  try {
    const { teacherId, teacherEmail } = req.query;
    let query = {};

    if (teacherId) {
      query.$or = [{ teacherId: teacherId }, { teacherEmail: teacherEmail || '' }];
    } else if (teacherEmail) {
      query.teacherEmail = teacherEmail.toLowerCase();
    }

    const sessions = await Session.find(query).sort({ createdAt: -1 });

    // Fetch all teachers to dynamically attach up-to-date subject
    const teachers = await User.find({
      $or: [
        { role: { $regex: /maitresse/i } },
        { role: { $regex: /teacher/i } },
        { role: { $regex: /maître/i } },
      ],
    }).select("_id email parentName subject");

    // Build lookup arrays (NOT maps) to avoid key collisions between teachers
    // Matching: ID → email → parentName (teacher's own display name only, NOT childName)
    const enrichedSessions = sessions.map((s) => {
      const sObj = s.toObject();
      const sTeacherId = String(s.teacherId || '').trim();
      const sTeacherEmail = (s.teacherEmail || '').toLowerCase().trim();
      const sTeacherName = (s.teacherName || '').toLowerCase().trim();

      // Find the exact teacher for this session
      const matchedTeacher = teachers.find((t) => {
        const tId = String(t._id).trim();
        const tEmail = (t.email || '').toLowerCase().trim();
        const tParentName = (t.parentName || '').toLowerCase().trim();
        const tUsername = tEmail ? tEmail.split('@')[0].toLowerCase().trim() : '';

        // Priority 1: ID match (most reliable)
        if (sTeacherId && tId && sTeacherId === tId) return true;
        // Priority 2: Email match
        if (sTeacherEmail && tEmail && sTeacherEmail === tEmail) return true;
        // Priority 3: Teacher's own display name (parentName) match
        if (sTeacherName && tParentName && (sTeacherName === tParentName)) return true;
        // Priority 4: Email username match
        if (sTeacherName && tUsername && (sTeacherName === tUsername)) return true;
        return false;
      });

      if (matchedTeacher?.subject) {
        const match = String(s.subject || '').match(/(\(Séance \d+\/4\)|\(الحصة \d+ من 4\))/);
        const suffix = match ? ` ${match[1]}` : '';
        sObj.subject = `${matchedTeacher.subject}${suffix}`;
      }

      return sObj;
    });

    res.json({ sessions: enrichedSessions });
  } catch (error) {
    console.error("Erreur Fetch Sessions:", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des sessions." });
  }
});

// POST Create New Session Reservation
app.post("/api/sessions", async (req, res) => {
  try {
    const {
      studentName,
      parentName,
      childName,
      childAge,
      studentEmail,
      studentId,
      teacherId,
      teacherName,
      teacherEmail,
      day,
      time,
      datetime,
      subject,
      paymentMethod,
      packId,
    } = req.body;

    if (!day || !time) {
      return res.status(400).json({ error: "Le jour et l'heure sont obligatoires." });
    }

    const assignedPackId = packId || `pack_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newSession = new Session({
      studentName: studentName || childName || parentName || "Élève",
      parentName: parentName || "",
      childName: childName || "",
      childAge: childAge || "",
      studentEmail: studentEmail ? studentEmail.toLowerCase() : "",
      studentId: studentId || "",
      teacherId: teacherId || "",
      teacherName: teacherName || "Enseignant",
      teacherEmail: teacherEmail ? teacherEmail.toLowerCase() : "",
      day,
      time,
      datetime: datetime || `${day}, ${time}`,
      subject: subject || "Français & Arabe (Séance d'essai)",
      status: "pending",
      meetUrl: "",
      paymentMethod: paymentMethod || "card",
      packId: assignedPackId,
    });

    await newSession.save();

    res.status(201).json({
      message: "Réservation effectuée avec succès !",
      session: newSession,
    });
  } catch (error) {
    console.error("Erreur Create Session:", error);
    res.status(500).json({ error: "Erreur serveur lors de la création de la session." });
  }
});

// POST Batch Create Sessions (e.g. 4-session pack)
app.post("/api/sessions/batch", async (req, res) => {
  try {
    const { sessions, packId } = req.body;
    if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({ error: "La liste des séances est invalide ou vide." });
    }

    const batchPackId = packId || `pack_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const sessionDocs = sessions.map((s, idx) => ({
      studentName: s.studentName || s.childName || s.parentName || "Élève",
      parentName: s.parentName || "",
      childName: s.childName || "",
      childAge: s.childAge || "",
      studentEmail: s.studentEmail ? s.studentEmail.toLowerCase() : "",
      studentId: s.studentId || "",
      teacherId: s.teacherId || "",
      teacherName: s.teacherName || "Enseignant",
      teacherEmail: s.teacherEmail ? s.teacherEmail.toLowerCase() : "",
      day: s.day,
      time: s.time,
      datetime: s.datetime || `${s.day}, ${s.time}`,
      subject: s.subject || `Français & Arabe (Séance ${idx + 1}/4)`,
      status: "pending",
      meetUrl: "",
      paymentMethod: s.paymentMethod || "card",
      packId: s.packId || batchPackId,
    }));

    const createdSessions = await Session.insertMany(sessionDocs);

    res.status(201).json({
      message: `${createdSessions.length} séances réservées avec succès !`,
      sessions: createdSessions,
      packId: batchPackId,
    });
  } catch (error) {
    console.error("Erreur Create Batch Sessions:", error);
    res.status(500).json({ error: "Erreur serveur lors de la réservation des séances." });
  }
});

// PUT Update Session (Meet URL, Status, etc.)
app.put("/api/sessions/:id", async (req, res) => {
  try {
    const { meetUrl, status } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ error: "Session introuvable." });
    }

    if (meetUrl !== undefined) session.meetUrl = meetUrl;
    if (status !== undefined) session.status = status;

    await session.save();

    res.json({
      message: "Session mise à jour avec succès !",
      session,
    });
  } catch (error) {
    console.error("Erreur Update Session:", error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour de la session." });
  }
});

// DELETE Session
app.delete("/api/sessions/:id", async (req, res) => {
  try {
    const deletedSession = await Session.findByIdAndDelete(req.params.id);
    if (!deletedSession) {
      return res.status(404).json({ error: "Session introuvable." });
    }
    res.json({ message: "Session supprimée avec succès !" });
  } catch (error) {
    console.error("Erreur Delete Session:", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de la session." });
  }
});

app.listen(PORT, () => {

  console.log(`Server running on port ${PORT}`);
});

module.exports = app;