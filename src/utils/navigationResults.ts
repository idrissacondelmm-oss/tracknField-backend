type NavigationResultValue = unknown;

const results = new Map<string, NavigationResultValue>();

export const setNavigationResult = (key: string, value: NavigationResultValue) => {
    if (!key) return;
    results.set(key, value);
};

export const consumeNavigationResult = <T = unknown>(key: string): T | undefined => {
    if (!key) return undefined;
    if (!results.has(key)) return undefined;
    const value = results.get(key) as T;
    results.delete(key);
    return value;
};
