import React, { createContext, useContext, useState, useCallback } from "react";

export type SignupDraft = {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    emailVerified?: boolean;
    emailVerifiedAt?: string;
    birthDate?: string;
    gender?: "male" | "female";
    role?: "athlete" | "coach";
    mainDisciplineFamily?: string;
    mainDiscipline?: string;
    licenseNumber?: string;
};

type SignupWizardContextType = {
    draft: SignupDraft;
    setStep1: (payload: Partial<Pick<SignupDraft, "firstName" | "lastName" | "email" | "password" | "emailVerified" | "emailVerifiedAt">>) => void;
    setStep2: (payload: Pick<SignupDraft, "birthDate" | "gender" | "role">) => void;
    setStep3: (payload: Pick<SignupDraft, "mainDisciplineFamily" | "mainDiscipline" | "licenseNumber">) => void;
    reset: () => void;
};

const SignupWizardContext = createContext<SignupWizardContextType | undefined>(undefined);

export const SignupWizardProvider = ({ children }: { children: React.ReactNode }) => {
    const [draft, setDraft] = useState<SignupDraft>({});

    const setStep1 = useCallback((payload: Partial<Pick<SignupDraft, "firstName" | "lastName" | "email" | "password" | "emailVerified" | "emailVerifiedAt">>) => {
        setDraft((prev) => {
            const emailChanged = payload.email && payload.email !== prev.email;
            const next = { ...prev, ...payload };

            if (emailChanged) {
                next.emailVerified = false;
                next.emailVerifiedAt = undefined;
            }

            if (payload.emailVerified === false) {
                next.emailVerifiedAt = undefined;
            }

            if (payload.emailVerified) {
                next.emailVerifiedAt = payload.emailVerifiedAt || new Date().toISOString();
            }

            return next;
        });
    }, []);

    const setStep2 = useCallback((payload: Pick<SignupDraft, "birthDate" | "gender" | "role">) => {
        setDraft((prev) => ({ ...prev, ...payload }));
    }, []);

    const setStep3 = useCallback((payload: Pick<SignupDraft, "mainDisciplineFamily" | "mainDiscipline" | "licenseNumber">) => {
        setDraft((prev) => ({ ...prev, ...payload }));
    }, []);

    const reset = useCallback(() => setDraft({}), []);

    return (
        <SignupWizardContext.Provider value={{ draft, setStep1, setStep2, setStep3, reset }}>
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
