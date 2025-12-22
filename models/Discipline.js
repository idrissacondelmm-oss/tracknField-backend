const mongoose = require("mongoose");

// ✅ Chaque clé ("100m", "200m", etc.) contiendra un tableau de performances (strings)
const EpreuveSchema = new mongoose.Schema(
    {
        _id: false, // on désactive l'ID interne pour éviter d’en générer à chaque sous-doc
    },
    { strict: false } // autorise les clés dynamiques
);

// ✅ Schéma principal Discipline
const DisciplineSchema = new mongoose.Schema({
    discipline: { type: String, required: true },
    epreuves: { type: [EpreuveSchema], default: [] },
});

module.exports = mongoose.model("Discipline", DisciplineSchema);
