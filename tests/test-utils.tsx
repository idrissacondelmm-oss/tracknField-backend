import React from "react";
import { render } from "@testing-library/react-native";
import { SignupWizardProvider } from "../src/context/SignupWizardContext";

type RenderOptions = Parameters<typeof render>[1];

type WrapperProps = {
    children: React.ReactNode;
};

const Providers = ({ children }: WrapperProps) => {
    return <SignupWizardProvider>{children}</SignupWizardProvider>;
};

export const renderWithProviders = (ui: React.ReactElement, options?: RenderOptions) =>
    render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react-native";
