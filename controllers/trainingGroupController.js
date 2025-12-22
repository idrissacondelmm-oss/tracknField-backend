const TrainingGroup = require("../models/TrainingGroup");
const User = require("../models/User");

const OWNER_POPULATION = { path: "owner", select: "fullName username photoUrl" };
const MEMBER_POPULATION = { path: "members.user", select: "fullName username photoUrl" };

const toStringId = (value) => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value._id) return value._id.toString();
    return value.toString();
};

const formatGroup = (group, currentUserId, options = {}) => {
    const { includeMembers = false } = options;
    const members = group.members || [];
    const ownerId = toStringId(group.owner);
    const isMember = Boolean(
        currentUserId && (ownerId === currentUserId || members.some((member) => toStringId(member.user) === currentUserId))
    );

    const mappedMembers = includeMembers
        ? members.map((member) => {
            const user = member.user || {};
            if (typeof user === "string") {
                return { id: user, joinedAt: member.joinedAt };
            }
            return {
                id: user._id?.toString() || user.id || toStringId(user),
                fullName: user.fullName,
                username: user.username,
                photoUrl: user.photoUrl,
                joinedAt: member.joinedAt,
            };
        })
        : undefined;

    return {
        id: group.id || group._id?.toString(),
        name: group.name,
        description: group.description,
        owner: group.owner,
        membersCount: members.length,
        isMember,
        createdAt: group.createdAt,
        members: mappedMembers,
    };
};

exports.createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Le nom du groupe est requis." });
        }

        const payload = {
            name: name.trim(),
            description,
            owner: req.user.id,
            members: [{ user: req.user.id, joinedAt: new Date() }],
        };

        const group = await TrainingGroup.create(payload);
        await group.populate(OWNER_POPULATION);

        res.status(201).json(formatGroup(group, req.user.id));
    } catch (error) {
        console.error("Erreur création groupe:", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "Un groupe porte déjà ce nom." });
        }
        res.status(500).json({ message: "Impossible de créer le groupe" });
    }
};

exports.searchGroups = async (req, res) => {
    try {
        const query = req.query.q?.toString().trim();
        const limitParam = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 50);
        const filter = query ? { name: { $regex: query, $options: "i" } } : {};
        const groups = await TrainingGroup.find(filter)
            .sort({ createdAt: -1 })
            .limit(limitParam)
            .populate(OWNER_POPULATION);
        const payload = groups.map((group) => formatGroup(group, req.user.id));
        res.json(payload);
    } catch (error) {
        console.error("Erreur recherche groupes:", error);
        res.status(500).json({ message: "Impossible de rechercher des groupes" });
    }
};

exports.listMyGroups = async (req, res) => {
    try {
        const groups = await TrainingGroup.find({
            $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
        })
            .sort({ name: 1 })
            .populate(OWNER_POPULATION);
        const payload = groups.map((group) => formatGroup(group, req.user.id, { includeMembers: true }));
        res.json(payload);
    } catch (error) {
        console.error("Erreur liste groupes:", error);
        res.status(500).json({ message: "Impossible de récupérer vos groupes" });
    }
};

exports.getGroup = async (req, res) => {
    try {
        const group = await TrainingGroup.findById(req.params.id)
            .populate(OWNER_POPULATION)
            .populate(MEMBER_POPULATION);
        if (!group) {
            return res.status(404).json({ message: "Groupe introuvable" });
        }

        const userId = req.user.id;
        const ownerId = toStringId(group.owner);
        const isMember = ownerId === userId || group.members?.some((member) => toStringId(member.user) === userId);
        if (!isMember) {
            return res.status(403).json({ message: "Vous n'avez pas accès à ce groupe" });
        }

        res.json(formatGroup(group, userId, { includeMembers: true }));
    } catch (error) {
        console.error("Erreur récupération groupe:", error);
        res.status(500).json({ message: "Impossible de récupérer ce groupe" });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Le nom du groupe est requis." });
        }

        const group = await TrainingGroup.findById(req.params.id)
            .populate(OWNER_POPULATION)
            .populate(MEMBER_POPULATION);
        if (!group) {
            return res.status(404).json({ message: "Groupe introuvable" });
        }

        const userId = req.user.id;
        const ownerId = toStringId(group.owner);
        if (ownerId !== userId) {
            return res.status(403).json({ message: "Seul le créateur du groupe peut le modifier" });
        }

        group.name = name.trim();
        group.description = description?.trim() ? description.trim() : undefined;

        await group.save();
        await group.populate(OWNER_POPULATION);

        res.json(formatGroup(group, userId, { includeMembers: true }));
    } catch (error) {
        console.error("Erreur mise à jour groupe:", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "Un groupe porte déjà ce nom." });
        }
        res.status(500).json({ message: "Impossible de mettre à jour ce groupe" });
    }
};

exports.joinGroup = async (req, res) => {
    try {
        const group = await TrainingGroup.findById(req.params.id)
            .populate(OWNER_POPULATION)
            .populate(MEMBER_POPULATION);
        if (!group) {
            return res.status(404).json({ message: "Groupe introuvable" });
        }

        const userId = req.user.id;
        const ownerId = toStringId(group.owner);
        const alreadyMember = ownerId === userId || group.members?.some((member) => toStringId(member.user) === userId);
        if (alreadyMember) {
            return res.status(400).json({ message: "Vous faites déjà partie de ce groupe" });
        }

        group.members.push({ user: userId, joinedAt: new Date() });
        await group.save();
        await group.populate(OWNER_POPULATION);

        res.json(formatGroup(group, userId));
    } catch (error) {
        console.error("Erreur rejoindre groupe:", error);
        res.status(500).json({ message: "Impossible de rejoindre ce groupe" });
    }
};

exports.addMember = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || !userId.toString().trim()) {
            return res.status(400).json({ message: "Identifiant de l'athlète requis" });
        }

        const targetUserId = userId.toString().trim();
        const group = await TrainingGroup.findById(req.params.id)
            .populate(OWNER_POPULATION)
            .populate(MEMBER_POPULATION);
        if (!group) {
            return res.status(404).json({ message: "Groupe introuvable" });
        }

        const requesterId = req.user.id;
        const ownerId = toStringId(group.owner);
        if (ownerId !== requesterId) {
            return res.status(403).json({ message: "Seul le créateur du groupe peut ajouter des membres" });
        }

        if (targetUserId === ownerId) {
            return res.status(400).json({ message: "Vous faites déjà partie du groupe" });
        }

        const targetUser = await User.findById(targetUserId).select("_id fullName username photoUrl");
        if (!targetUser) {
            return res.status(404).json({ message: "Athlète introuvable" });
        }

        const alreadyMember = group.members?.some((member) => toStringId(member.user) === targetUserId);
        if (alreadyMember) {
            return res.status(400).json({ message: "Cet athlète est déjà membre" });
        }

        group.members.push({ user: targetUserId, joinedAt: new Date() });
        await group.save();
        await group.populate(OWNER_POPULATION);
        await group.populate(MEMBER_POPULATION);

        res.json(formatGroup(group, requesterId, { includeMembers: true }));
    } catch (error) {
        console.error("Erreur ajout membre groupe:", error);
        res.status(500).json({ message: "Impossible d'ajouter ce membre" });
    }
};

exports.removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const targetMemberId = memberId?.toString().trim();
        if (!targetMemberId) {
            return res.status(400).json({ message: "Identifiant du membre requis" });
        }

        const group = await TrainingGroup.findById(req.params.id)
            .populate(OWNER_POPULATION)
            .populate(MEMBER_POPULATION);
        if (!group) {
            return res.status(404).json({ message: "Groupe introuvable" });
        }

        const requesterId = req.user.id;
        const ownerId = toStringId(group.owner);
        if (ownerId !== requesterId) {
            return res.status(403).json({ message: "Seul le créateur du groupe peut retirer des membres" });
        }

        if (targetMemberId === ownerId) {
            return res.status(400).json({ message: "Vous ne pouvez pas vous retirer du groupe" });
        }

        const existingIndex = group.members.findIndex((member) => toStringId(member.user) === targetMemberId);
        if (existingIndex === -1) {
            return res.status(404).json({ message: "Membre introuvable" });
        }

        group.members.splice(existingIndex, 1);
        await group.save();
        await group.populate(OWNER_POPULATION);
        await group.populate(MEMBER_POPULATION);

        res.json(formatGroup(group, requesterId, { includeMembers: true }));
    } catch (error) {
        console.error("Erreur suppression membre groupe:", error);
        res.status(500).json({ message: "Impossible de retirer ce membre" });
    }
};
