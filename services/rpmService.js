const fetch = require("node-fetch");

const DEFAULT_RPM_API_BASE = "https://api.readyplayer.me/v2";
const RPM_API_BASE = process.env.RPM_API_BASE || DEFAULT_RPM_API_BASE;
const buildPartnerBaseUrl = () => {
    const rawValue = process.env.RPM_PARTNER_SUBDOMAIN || "";
    if (!rawValue) {
        throw new Error("RPM_PARTNER_SUBDOMAIN must be configured");
    }
    const prefixed = rawValue.startsWith("http://") || rawValue.startsWith("https://")
        ? rawValue
        : `https://${rawValue}`;
    try {
        const parsedUrl = new URL(prefixed);
        return parsedUrl.origin;
    } catch (error) {
        return prefixed.replace(/\/+$/, "");
    }
};

const derivePartnerName = () => {
    if (process.env.RPM_PARTNER_NAME) return process.env.RPM_PARTNER_NAME;
    const subdomain = process.env.RPM_PARTNER_SUBDOMAIN || "";
    if (!subdomain) return null;
    const clean = subdomain
        .replace("https://", "")
        .replace("http://", "")
        .replace(/\/.*$/, "");
    return clean.split(".")[0];
};

const parseResponse = async (response) => {
    const text = await response.text();
    let payload;
    try {
        payload = text ? JSON.parse(text) : {};
    } catch (error) {
        payload = { raw: text };
    }

    if (!response.ok) {
        const err = new Error(payload?.message || "Erreur API Ready Player Me");
        err.status = response.status;
        err.details = payload;
        throw err;
    }

    return payload;
};

exports.createAnonymousUser = async () => {
    const url = `${buildPartnerBaseUrl()}/api/users`;
    const response = await fetch(url, { method: "POST" });
    const payload = await parseResponse(response);
    return payload?.data || payload;
};

exports.fetchTemplates = async (token) => {
    if (!token) {
        throw new Error("RPM user token manquant pour récupérer les templates");
    }
    const url = `${RPM_API_BASE}/avatars/templates`;
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const payload = await parseResponse(response);
    return payload?.data || payload;
};

exports.createDraftFromTemplate = async (templateId, token, overrides = {}) => {
    if (!token) {
        throw new Error("RPM user token manquant pour créer un avatar draft");
    }
    if (!templateId) {
        throw new Error("templateId obligatoire pour créer un avatar draft");
    }
    const url = `${RPM_API_BASE}/avatars/templates/${templateId}`;
    const defaultPayload = { ...overrides };
    if (!defaultPayload.partner) {
        const partnerName = derivePartnerName();
        if (partnerName) defaultPayload.partner = partnerName;
    }
    if (!defaultPayload.bodyType) {
        defaultPayload.bodyType = "fullbody";
    }
    const body = { data: defaultPayload };
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });
    const payload = await parseResponse(response);
    return payload?.data || payload;
};

exports.buildAvatarAssetUrl = (avatarId, extension = "glb", options = { preview: true }) => {
    if (!avatarId) return null;
    const searchParams = new URLSearchParams();
    if (options.preview) {
        searchParams.set("preview", "true");
    }
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return `${RPM_API_BASE}/avatars/${avatarId}.${extension}${suffix}`;
};

exports.pickRandomTemplate = (templates) => {
    if (!Array.isArray(templates) || templates.length === 0) {
        throw new Error("Aucun template Ready Player Me disponible");
    }
    const index = Math.floor(Math.random() * templates.length);
    return templates[index];
};
