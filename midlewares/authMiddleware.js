const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Accès refusé : aucun token fourni" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; // { id: "...", email: "..." }
        next();
    } catch (err) {
        res.status(400).json({ message: "Token invalide" });
    }
};
