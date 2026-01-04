import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import ForgotPasswordScreen from "../../app/(auth)/forgot-password";
import { SafeAreaProvider } from "react-native-safe-area-context";

let mockLogin = jest.fn(async () => { });

jest.mock("../../src/context/AuthContext", () => {
    return {
        useAuth: () => ({
            login: (...args: any[]) => mockLogin(...args),
        }),
    };
});

jest.mock("../../src/api/authService", () => {
    return {
        requestPasswordResetCode: jest.fn(async () => ({ ok: true })),
        verifyPasswordResetCode: jest.fn(async () => ({ verified: true })),
        confirmPasswordReset: jest.fn(async () => ({ ok: true })),
    };
});

const authService = require("../../src/api/authService");

describe("ForgotPasswordScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLogin = jest.fn(async () => { });
    });

    test("trims email/code/password before confirm+login", async () => {
        const { getByTestId } = render(
            <SafeAreaProvider
                initialMetrics={{
                    frame: { x: 0, y: 0, width: 390, height: 844 },
                    insets: { top: 0, left: 0, right: 0, bottom: 0 },
                }}
            >
                <ForgotPasswordScreen />
            </SafeAreaProvider>,
        );

        fireEvent.changeText(getByTestId("forgot-email"), "  user@example.com  ");

        await act(async () => {
            fireEvent.press(getByTestId("forgot-send"));
        });

        await waitFor(() => expect(authService.requestPasswordResetCode).toHaveBeenCalledTimes(1));
        expect(authService.requestPasswordResetCode).toHaveBeenCalledWith("user@example.com");

        fireEvent.changeText(getByTestId("forgot-code"), " 123456 ");

        await act(async () => {
            fireEvent.press(getByTestId("forgot-verify"));
        });

        await waitFor(() => expect(authService.verifyPasswordResetCode).toHaveBeenCalledTimes(1));
        expect(authService.verifyPasswordResetCode).toHaveBeenCalledWith("user@example.com", "123456");

        fireEvent.changeText(getByTestId("forgot-newPassword"), "  secret123!  ");
        fireEvent.changeText(getByTestId("forgot-confirmPassword"), "  secret123!  ");

        await act(async () => {
            fireEvent.press(getByTestId("forgot-reset"));
        });

        await waitFor(() => expect(authService.confirmPasswordReset).toHaveBeenCalledTimes(1));
        expect(authService.confirmPasswordReset).toHaveBeenCalledWith("user@example.com", "123456", "secret123!");

        await waitFor(() => expect(mockLogin).toHaveBeenCalledTimes(1));
        expect(mockLogin).toHaveBeenCalledWith("user@example.com", "secret123!");
    });
});
