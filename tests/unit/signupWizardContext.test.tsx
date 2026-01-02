import React, { useEffect } from "react";
import { act, renderWithProviders, waitFor } from "../test-utils";
import { useSignupWizard } from "../../src/context/SignupWizardContext";

type ProbeProps = {
    onReady: (value: ReturnType<typeof useSignupWizard>) => void;
};

const ContextProbe = ({ onReady }: ProbeProps) => {
    const ctx = useSignupWizard();
    useEffect(() => {
        onReady(ctx);
    }, [ctx, onReady]);
    return null;
};

describe("SignupWizardContext", () => {
    test("resets email verification when the email changes", async () => {
        let context: ReturnType<typeof useSignupWizard> | undefined;

        renderWithProviders(<ContextProbe onReady={(value) => { context = value; }} />);
        await waitFor(() => expect(context).toBeDefined());

        act(() => {
            context!.setStep1({ email: "first@example.com" });
        });

        act(() => {
            context!.setStep1({ emailVerified: true });
        });

        await waitFor(() => {
            expect(context!.draft.email).toBe("first@example.com");
            expect(context!.draft.emailVerified).toBe(true);
            expect(context!.draft.emailVerifiedAt).toBeDefined();
        });

        act(() => {
            context!.setStep1({ email: "second@example.com" });
        });

        await waitFor(() => {
            expect(context!.draft.email).toBe("second@example.com");
            expect(context!.draft.emailVerified).toBe(false);
            expect(context!.draft.emailVerifiedAt).toBeUndefined();
        });
    });

    test("clears verification timestamp when toggled false", async () => {
        let context: ReturnType<typeof useSignupWizard> | undefined;

        renderWithProviders(<ContextProbe onReady={(value) => { context = value; }} />);
        await waitFor(() => expect(context).toBeDefined());

        act(() => {
            context!.setStep1({ email: "user@example.com" });
            context!.setStep1({ emailVerified: true });
        });

        await waitFor(() => {
            expect(context!.draft.emailVerified).toBe(true);
            expect(context!.draft.emailVerifiedAt).toBeDefined();
        });

        act(() => {
            context!.setStep1({ emailVerified: false });
        });

        await waitFor(() => {
            expect(context!.draft.emailVerified).toBe(false);
            expect(context!.draft.emailVerifiedAt).toBeUndefined();
        });
    });

    test("setStep2 merges demographics", async () => {
        let context: ReturnType<typeof useSignupWizard> | undefined;

        renderWithProviders(<ContextProbe onReady={(value) => { context = value; }} />);
        await waitFor(() => expect(context).toBeDefined());

        act(() => {
            context!.setStep2({ birthDate: "2000-01-01", gender: "female", role: "athlete" });
        });

        await waitFor(() => {
            expect(context!.draft.birthDate).toBe("2000-01-01");
            expect(context!.draft.gender).toBe("female");
            expect(context!.draft.role).toBe("athlete");
        });
    });

    test("setStep3 merges sport info", async () => {
        let context: ReturnType<typeof useSignupWizard> | undefined;

        renderWithProviders(<ContextProbe onReady={(value) => { context = value; }} />);
        await waitFor(() => expect(context).toBeDefined());

        act(() => {
            context!.setStep3({
                mainDisciplineFamily: "sprint",
                mainDiscipline: "100m",
                licenseNumber: "LIC-1234",
            });
        });

        await waitFor(() => {
            expect(context!.draft.mainDisciplineFamily).toBe("sprint");
            expect(context!.draft.mainDiscipline).toBe("100m");
            expect(context!.draft.licenseNumber).toBe("LIC-1234");
        });
    });

    test("reset clears all draft fields", async () => {
        let context: ReturnType<typeof useSignupWizard> | undefined;

        renderWithProviders(<ContextProbe onReady={(value) => { context = value; }} />);
        await waitFor(() => expect(context).toBeDefined());

        act(() => {
            context!.setStep1({ email: "user@example.com", emailVerified: true });
            context!.setStep2({ birthDate: "2000-01-01", gender: "female", role: "athlete" });
            context!.setStep3({ mainDisciplineFamily: "sprint", mainDiscipline: "100m", licenseNumber: "LIC-1234" });
        });

        await waitFor(() => expect(context!.draft.email).toBe("user@example.com"));

        act(() => {
            context!.reset();
        });

        await waitFor(() => {
            expect(context!.draft).toEqual({});
        });
    });
});
