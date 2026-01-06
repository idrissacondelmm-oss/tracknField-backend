export const normalizePersonName = (raw: string): string => {
    const cleaned = String(raw ?? "")
        .trim()
        .replace(/\s+/g, " ");

    if (!cleaned) return "";

    const lower = cleaned.toLocaleLowerCase();

    // Split but keep delimiters (space, hyphen, apostrophes)
    const parts = lower.split(/([\s\-’'])/);

    return parts
        .map((part) => {
            if (!part) return "";
            if (/^[\s\-’']$/.test(part)) return part;

            const first = part.charAt(0).toLocaleUpperCase();
            return first + part.slice(1);
        })
        .join("")
        .replace(/\s+/g, " ")
        .trim();
};
