import React, { createContext, useContext, useState, useCallback } from "react";

export type SignupDraft = {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    birthDate?: string;
    gender?: "male" | "female";
    role?: "athlete" | "coach";
};

type SignupWizardContextType = {
    draft: SignupDraft;
    setStep1: (payload: Pick<SignupDraft, "firstName" | "lastName" | "email" | "password">) => void;
    setStep2: (payload: Pick<SignupDraft, "birthDate" | "gender" | "role">) => void;
    reset: () => void;
};

const SignupWizardContext = createContext<SignupWizardContextType | undefined>(undefined);

export const SignupWizardProvider = ({ children }: { children: React.ReactNode }) => {
    const [draft, setDraft] = useState<SignupDraft>({});

    const setStep1 = useCallback((payload: Pick<SignupDraft, "firstName" | "lastName" | "email" | "password">) => {
        setDraft((prev) => ({ ...prev, ...payload }));
    }, []);

    const setStep2 = useCallback((payload: Pick<SignupDraft, "birthDate" | "gender" | "role">) => {
        setDraft((prev) => ({ ...prev, ...payload }));
    }, []);

    const reset = useCallback(() => setDraft({}), []);

    return (
        <SignupWizardContext.Provider value={{ draft, setStep1, setStep2, reset }}>
            {children}
        </SignupWizardContext.Provider>
    );
};

export const useSignupWizard = () => {
    const ctx = useContext(SignupWizardContext);
    if (!ctx) {
        throw new Error("useSignupWizard must be used within SignupWizardProvider");
    }
    return ctx;
};
