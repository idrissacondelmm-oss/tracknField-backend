const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const { performanceTimelineSeed } = require("../data/performanceTimelineSeed");

dotenv.config();

const email = process.argv[2];
if (!email) {
    console.error("Usage: node scripts/seedPerformanceTimeline.js <userEmail> [--disciplines=100m,200m]");
    process.exit(1);
}

const disciplineArg = process.argv.find((arg) => arg.startsWith("--disciplines="));
const normalizedFilter = disciplineArg
    ? disciplineArg
        .split("=")[1]
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    : null;

const shouldKeepDiscipline = (name) => {
    if (!normalizedFilter || normalizedFilter.length === 0) return true;
    return normalizedFilter.includes(name.trim().toLowerCase());
};

const buildTimelinePayload = () => {
    return Object.entries(performanceTimelineSeed)
        .filter(([name]) => shouldKeepDiscipline(name))
        .flatMap(([, timeline]) =>
            timeline.map((point) => ({
                ...point,
                date: new Date(point.date),
            }))
        );
};

(async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI non défini dans l'environnement");
        }

        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`Utilisateur introuvable pour l'email ${email}`);
            process.exit(1);
        }

        const payload = buildTimelinePayload();
        user.performanceTimeline = payload;
        await user.save();

        console.log(`✅ ${payload.length} points injectés pour ${email}`);
    } catch (error) {
        console.error("❌ Impossible d'exécuter le seed:", error.message || error);
        process.exit(1);
    } finally {
        await mongoose.disconnect().catch(() => undefined);
    }
})();
