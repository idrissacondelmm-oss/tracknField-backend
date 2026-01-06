type SanitizeInternalPathOptions = {
    allowedPrefixes?: readonly string[];
    allowedExact?: readonly string[];
};

const hasScheme = (value: string) => /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value);

export const sanitizeInternalAppPath = (
    raw: string | null | undefined,
    options: SanitizeInternalPathOptions = {},
): string | null => {
    if (!raw) {
        return null;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
        return null;
    }

    // Reject absolute URLs and scheme-based values (e.g. https:, mailto:, javascript:)
    if (hasScheme(trimmed)) {
        return null;
    }

    // Reject scheme-relative URLs ("//example.com")
    if (trimmed.startsWith("//")) {
        return null;
    }

    const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

    // Basic hardening against weird/invisible characters and path traversal.
    if (/\s/.test(normalized.replace(/\?/g, ""))) {
        // keep query strings but disallow whitespace anywhere else
        return null;
    }
    if (normalized.includes("\\") || normalized.includes("..")) {
        return null;
    }

    const { allowedExact, allowedPrefixes } = options;

    if (allowedExact?.length && allowedExact.includes(normalized)) {
        return normalized;
    }

    if (allowedPrefixes?.length) {
        const allowed = allowedPrefixes.some((prefix) => normalized.startsWith(prefix));
        return allowed ? normalized : null;
    }

    return normalized;
};
