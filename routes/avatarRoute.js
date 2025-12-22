const express = require("express");
const router = express.Router();
const auth = require("../midlewares/authMiddleware");
const avatarController = require("../controllers/avatarController");

router.post("/generate", auth, avatarController.generateAvatar);
router.post("/save", auth, avatarController.saveAvatar);
router.get("/templates", auth, avatarController.listTemplates);
router.post("/draft", auth, avatarController.createDraftAvatar);

module.exports = router;
