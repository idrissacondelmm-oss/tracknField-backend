export const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password: string) =>
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(password);
