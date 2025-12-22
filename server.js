const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const userRoutes = require("./routes/userRoute");
const authRoutes = require("./routes/authRoute");
const avatarRoutes = require("./routes/avatarRoute");
const trainingRoutes = require("./routes/trainingRoute");
const trainingGroupRoutes = require("./routes/trainingGroupRoute");


dotenv.config();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("Erreur MongoDB:", err));

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/trainings", trainingRoutes);
app.use("/api/groups", trainingGroupRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
