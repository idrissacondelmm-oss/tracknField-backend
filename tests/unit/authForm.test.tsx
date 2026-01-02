import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import AuthForm from "../../src/components/AuthForm";

type SubmitPayload = {
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
};

describe("AuthForm", () => {
    test("does not trim spaces while typing (allows multi-word names)", async () => {
        const onSubmit = jest.fn(async (_form: SubmitPayload) => { });

        const { getByTestId } = render(
            <AuthForm type="signup" onSubmit={onSubmit} suppressSuccessToast />,
        );

        const firstNameInput = getByTestId("auth-firstName");
        fireEvent.changeText(firstNameInput, "Jean ");

        // Trailing space should remain while typing so the user can continue with a second word.
        expect(getByTestId("auth-firstName").props.value).toBe("Jean ");
    });

    test("trims email and password before submit (login)", async () => {
        const onSubmit = jest.fn(async (_form: SubmitPayload) => { });

        const { getByTestId, getByText } = render(
            <AuthForm type="login" onSubmit={onSubmit} includeNames={false} suppressSuccessToast />,
        );

        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");

        fireEvent.changeText(emailInput, "  user@example.com  ");
        fireEvent.changeText(passwordInput, "  secret123!  ");
        await act(async () => {
            fireEvent.press(getByText("Se connecter"));
        });

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());
        expect(onSubmit).toHaveBeenCalledWith({
            email: "user@example.com",
            password: "secret123!",
            firstName: "",
            lastName: "",
        });
    });

    test("trims names and email before submit (signup)", async () => {
        const onSubmit = jest.fn(async (_form: SubmitPayload) => { });

        const { getByTestId, getByText } = render(
            <AuthForm type="signup" onSubmit={onSubmit} suppressSuccessToast />,
        );

        const firstNameInput = getByTestId("auth-firstName");
        const lastNameInput = getByTestId("auth-lastName");
        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");
        const confirmInput = getByTestId("auth-confirm");

        fireEvent.changeText(firstNameInput, "  Ada  ");
        fireEvent.changeText(lastNameInput, "  Lovelace  ");
        fireEvent.changeText(emailInput, "  ada@example.com  ");
        fireEvent.changeText(passwordInput, "P@ssw0rd!");
        fireEvent.changeText(confirmInput, "P@ssw0rd!");

        await act(async () => {
            fireEvent.press(getByText("S'inscrire"));
        });

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());
        expect(onSubmit).toHaveBeenCalledWith({
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@example.com",
            password: "P@ssw0rd!",
        });
    });

    test("shows error on invalid email (signup)", async () => {
        const { getByTestId, getByText, queryByText } = render(
            <AuthForm
                type="signup"
                onSubmit={jest.fn(async (_form: SubmitPayload) => { })}
                includeNames={false}
            />,
        );

        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");
        const confirmInput = getByTestId("auth-confirm");

        fireEvent.changeText(emailInput, "not-an-email");
        fireEvent.changeText(passwordInput, "P@ssw0rd!");
        fireEvent.changeText(confirmInput, "P@ssw0rd!");

        fireEvent.press(getByText("S'inscrire"));

        await waitFor(() => expect(queryByText("Email invalide")).toBeTruthy());
        expect(queryByText("Les mots de passe ne correspondent pas")).toBeFalsy();
    });

    test("shows error when passwords do not match (signup)", async () => {
        const { getByTestId, getByText, queryByText } = render(
            <AuthForm
                type="signup"
                onSubmit={jest.fn(async (_form: SubmitPayload) => { })}
                includeNames={false}
            />,
        );

        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");
        const confirmInput = getByTestId("auth-confirm");

        fireEvent.changeText(emailInput, "user@example.com");
        fireEvent.changeText(passwordInput, "P@ssw0rd!");
        fireEvent.changeText(confirmInput, "Mismatch1!");

        fireEvent.press(getByText("S'inscrire"));

        await waitFor(() => expect(queryByText("Les mots de passe ne correspondent pas")).toBeTruthy());
    });

    test("blocks weak password (signup)", async () => {
        const { getByTestId, getByText, queryByText } = render(
            <AuthForm
                type="signup"
                onSubmit={jest.fn(async (_form: SubmitPayload) => { })}
                includeNames={false}
            />,
        );

        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");
        const confirmInput = getByTestId("auth-confirm");

        fireEvent.changeText(emailInput, "user@example.com");
        fireEvent.changeText(passwordInput, "weakpw");
        fireEvent.changeText(confirmInput, "weakpw");

        fireEvent.press(getByText("S'inscrire"));

        await waitFor(() => expect(queryByText("6+ caractères, 1 majuscule, 1 chiffre, 1 symbole")).toBeTruthy());
    });

    test("does not call onSubmit when validation fails", async () => {
        const onSubmit = jest.fn(async (_form: SubmitPayload) => { });
        const { getByTestId, getByText } = render(
            <AuthForm type="signup" onSubmit={onSubmit} includeNames={false} />,
        );

        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");
        const confirmInput = getByTestId("auth-confirm");

        fireEvent.changeText(emailInput, "user@example.com");
        fireEvent.changeText(passwordInput, "P@ssw0rd!");
        fireEvent.changeText(confirmInput, "Mismatch1!");

        fireEvent.press(getByText("S'inscrire"));

        await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    });

    test("password toggle disables secureTextEntry", async () => {
        const { getByTestId } = render(
            <AuthForm type="login" onSubmit={jest.fn(async (_form: SubmitPayload) => { })} includeNames={false} />,
        );

        const passwordInput = getByTestId("auth-password");
        expect(passwordInput.props.secureTextEntry).toBe(true);

        const eyeButton = getByTestId("auth-password-toggle");
        fireEvent.press(eyeButton);

        const updatedPasswordInput = getByTestId("auth-password");
        expect(updatedPasswordInput.props.secureTextEntry).toBe(false);
    });

    test("disables submit while pending", async () => {
        let resolvePromise: (() => void) | undefined;
        const onSubmit = jest.fn((_form: SubmitPayload) => new Promise<void>((res) => {
            resolvePromise = () => res();
        }));

        const { getByText, getByTestId } = render(
            <AuthForm type="login" onSubmit={onSubmit} includeNames={false} suppressSuccessToast />,
        );

        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");

        fireEvent.changeText(emailInput, "user@example.com");
        fireEvent.changeText(passwordInput, "P@ssw0rd!");

        await act(async () => {
            fireEvent.press(getByText("Se connecter"));
        });

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

        fireEvent.press(getByText("Se connecter"));

        await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

        await act(async () => {
            resolvePromise?.();
        });
    });

    test("login requires password", async () => {
        const { getByTestId, getByText, queryByText } = render(
            <AuthForm type="login" onSubmit={jest.fn(async (_form: SubmitPayload) => { })} includeNames={false} />,
        );

        const emailInput = getByTestId("auth-email");
        const passwordInput = getByTestId("auth-password");

        fireEvent.changeText(emailInput, "user@example.com");
        fireEvent.changeText(passwordInput, "");

        fireEvent.press(getByText("Se connecter"));

        await waitFor(() => expect(queryByText("Mot de passe requis")).toBeTruthy());
    });
});
