const fetch = require("node-fetch");
const User = require("../models/User");
const rpmService = require("../services/rpmService");

const RPM_API_URL = process.env.RPM_API_URL || "https://api.readyplayer.me/v2/avatars";

const ensureRpmIdentity = async (user) => {
    if (user.rpmUserId && user.rpmUserToken) {
        return user;
    }

    const rpmUser = await rpmService.createAnonymousUser();
    user.rpmUserId = rpmUser.id || rpmUser._id;
    user.rpmUserToken = rpmUser.token;
    await user.save();
    return user;
};

const sanitizeUser = (userDoc) => {
    const plain = userDoc.toObject();
    delete plain.passwordHash;
    delete plain.rpmUserToken;
    return plain;
};

/**
 * POST /api/avatar/generate
 * Génère un avatar via l'API Ready Player Me à partir des préférences utilisateur.
 */
exports.generateAvatar = async (req, res) => {
    if (!process.env.RPM_API_KEY) {
        return res.status(500).json({ message: "Clé RPM manquante dans la configuration serveur" });
    }

    const {
        gender = "female",
        bodyType = "fullbody",
        outfitVersion = "casual",
        morphTargets = {},
        metadata = {},
        templateId,
        hairColor,
        skinColor,
        partner = process.env.RPM_PARTNER_NAME || process.env.RPM_PARTNER_SUBDOMAIN,
    } = req.body;

    const payload = {
        gender,
        bodyType,
        outfitVersion,
        morphTargets,
        metadata,
    };

    if (templateId) payload.templateId = templateId;
    if (hairColor) payload.hairColor = hairColor;
    if (skinColor) payload.skinColor = skinColor;
    if (partner) payload.partner = partner;

    try {
        const response = await fetch(RPM_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.RPM_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch (err) {
            data = { raw: text };
        }

        if (!response.ok) {
            return res.status(response.status).json({
                message: data?.message || "Erreur lors de la génération d'avatar",
                details: data,
            });
        }

        return res.status(201).json({
            avatarId: data?.id || data?.avatarId || data?.avatar?.id,
            status: data?.status || data?.state || "processing",
            files: data?.files || data?.data?.files || [],
            data,
        });
    } catch (error) {
        console.error("Erreur Ready Player Me:", error);
        return res.status(500).json({ message: "Erreur serveur lors de la génération de l'avatar" });
    }
};

/**
 * POST /api/avatar/save
 * Enregistre (ou remplace) l'avatar Ready Player Me de l'utilisateur connecté.
 */
exports.saveAvatar = async (req, res) => {
    try {
        const { rpmAvatarUrl, rpmAvatarPreviewUrl, rpmAvatarMeta, rpmAvatarId } = req.body;

        if (!rpmAvatarUrl) {
            return res.status(400).json({ message: "Le champ rpmAvatarUrl est obligatoire." });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        user.rpmAvatarUrl = rpmAvatarUrl;
        user.rpmAvatarPreviewUrl = rpmAvatarPreviewUrl || user.rpmAvatarPreviewUrl;
        user.rpmAvatarId = rpmAvatarId || user.rpmAvatarId;

        const existingMeta = (user.rpmAvatarMeta && typeof user.rpmAvatarMeta === "object") ? user.rpmAvatarMeta : {};
        const incomingMeta = (rpmAvatarMeta && typeof rpmAvatarMeta === "object") ? rpmAvatarMeta : {};
        const mergedMeta = {
            ...existingMeta,
            ...incomingMeta,
            userId: user.rpmUserId,
        };

        if (user.rpmAvatarId) {
            mergedMeta.avatarId = user.rpmAvatarId;
        }
        if (user.rpmAvatarUrl) {
            mergedMeta.url = user.rpmAvatarUrl;
        }

        user.rpmAvatarMeta = mergedMeta;

        if (rpmAvatarPreviewUrl) {
            user.photoUrl = rpmAvatarPreviewUrl;
        }

        await user.save();

        const sanitized = sanitizeUser(user);

        return res.status(200).json({
            message: "Avatar synchronisé",
            user: sanitized,
        });
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'avatar RPM:", error);
        return res.status(500).json({ message: "Erreur serveur lors de l'enregistrement de l'avatar" });
    }
};

exports.listTemplates = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("+rpmUserToken");
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        await ensureRpmIdentity(user);
        const templates = await rpmService.fetchTemplates(user.rpmUserToken);

        return res.status(200).json({ templates });
    } catch (error) {
        console.error("Erreur lors de la récupération des templates RPM:", error);
        const status = error?.status || 500;
        return res.status(status).json({
            message: error?.message || "Impossible de récupérer les templates Ready Player Me",
            details: error?.details,
        });
    }
};

exports.createDraftAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("+rpmUserToken");
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        await ensureRpmIdentity(user);

        const requestedTemplateId = req.body?.templateId;
        const templates = await rpmService.fetchTemplates(user.rpmUserToken);

        let selectedTemplate;
        if (requestedTemplateId) {
            selectedTemplate = templates.find((tpl) => tpl.id === requestedTemplateId);
            if (!selectedTemplate) {
                console.warn("Template RPM introuvable, on choisit un template aléatoire");
                selectedTemplate = rpmService.pickRandomTemplate(templates);
            }
        } else {
            selectedTemplate = rpmService.pickRandomTemplate(templates);
        }

        if (!selectedTemplate) {
            return res.status(400).json({ message: "Aucun template Ready Player Me disponible" });
        }

        const templateId = selectedTemplate.id;
        const overrides = { userId: user.rpmUserId };
        if (req.body?.gender) {
            overrides.gender = req.body.gender;
        } else if (selectedTemplate.gender) {
            overrides.gender = selectedTemplate.gender;
        }
        if (req.body?.bodyType) {
            overrides.bodyType = req.body.bodyType;
        }
        if (req.body?.partner) {
            overrides.partner = req.body.partner;
        }

        const draft = await rpmService.createDraftFromTemplate(templateId, user.rpmUserToken, overrides);
        const avatarId = draft?.id || draft?._id || draft?.avatarId;

        user.rpmAvatarId = avatarId;
        user.rpmAvatarMeta = { ...(user.rpmAvatarMeta || {}), lastTemplateId: templateId, draftAssets: draft?.assets };
        await user.save();

        const glbUrl = rpmService.buildAvatarAssetUrl(avatarId, "glb");
        const previewUrl = rpmService.buildAvatarAssetUrl(avatarId, "png");

        return res.status(201).json({
            avatarId,
            rpmUserId: user.rpmUserId,
            templateId,
            glbUrl,
            previewUrl,
            assets: draft?.assets || {},
        });
    } catch (error) {
        console.error("Erreur lors de la création du draft RPM:", error);
        const status = error?.status || 500;
        return res.status(status).json({
            message: error?.message || "Impossible de créer un avatar draft",
            details: error?.details,
        });
    }
};
