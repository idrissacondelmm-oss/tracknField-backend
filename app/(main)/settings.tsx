import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Text, TextInput, Snackbar } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { deleteAccount, updateUserCredentials } from "../../src/api/userService";

type ActionKey = "logout" | "delete" | "password" | "email" | "terms" | null;

type ActionItem = {
    key: Exclude<ActionKey, null>;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
    tone?: "default" | "danger";
    onPress: () => void;
};

export default function SettingsScreen() {
    const { logout } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [loadingAction, setLoadingAction] = useState<ActionKey>(null);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [currentPasswordForPwd, setCurrentPasswordForPwd] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [showEmailPwd, setShowEmailPwd] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [successToast, setSuccessToast] = useState("");
    const [toastVisible, setToastVisible] = useState(false);
    const [emailLoading, setEmailLoading] = useState(false);

    const finishSession = async () => {
        await logout();
        router.replace("/(auth)/login");
    };

    const handleLogout = async () => {
        if (loadingAction) return;
        setLoadingAction("logout");
        try {
            await finishSession();
        } catch (error: any) {
            Alert.alert("Déconnexion impossible", error?.message || "Réessaie dans un instant.");
        } finally {
            setLoadingAction(null);
        }
    };

    const confirmDeletion = () => {
        if (loadingAction) return;
        Alert.alert(
            "Supprimer mon compte",
            "Cette action est définitive. Toutes tes données Talent-X seront supprimées.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: async () => {
                        setLoadingAction("delete");
                        try {
                            await deleteAccount();
                            await finishSession();
                        } catch (error: any) {
                            Alert.alert(
                                "Suppression impossible",
                                error?.message || "Merci de réessayer plus tard.",
                            );
                        } finally {
                            setLoadingAction(null);
                        }
                    },
                },
            ],
        );
    };

    const actions: ActionItem[] = [
        {
            key: "email",
            icon: "mail-outline",
            label: "Changer d'email",
            description: "Mettre à jour ton adresse",
            onPress: () => setShowEmailForm(true),
        },
        {
            key: "password",
            icon: "key-outline",
            label: "Changer le mot de passe",
            description: "Accéder au formulaire de modification",
            onPress: () => setShowPasswordForm(true),
        },
        {
            key: "terms",
            icon: "document-text-outline",
            label: "Conditions d'utilisation",
            description: "Consulter les règles d'utilisation",
            onPress: () => router.push("/terms"),
        },
        {
            key: "logout",
            icon: "log-out-outline",
            label: "Se déconnecter",
            description: "Fermer ta session sur cet appareil",
            onPress: handleLogout,
        },
        {
            key: "delete",
            icon: "trash-outline",
            label: "Supprimer mon compte",
            description: "Effacer définitivement ton profil et tes données",
            tone: "danger",
            onPress: confirmDeletion,
        },
    ];

    const handleUpdatePassword = async () => {
        if (passwordLoading) return;
        setPasswordError("");
        const current = currentPasswordForPwd.trim();
        const nextPwd = newPassword.trim();
        const confirm = confirmPassword.trim();

        if (!current) {
            setPasswordError("Entre ton mot de passe actuel.");
            return;
        }
        if (!nextPwd) {
            Alert.alert("Nouveau mot de passe", "Renseigne un nouveau mot de passe.");
            return;
        }
        if (nextPwd === current) {
            setPasswordError("Le nouveau mot de passe doit être différent de l'actuel.");
            return;
        }
        if (nextPwd.length < 8) {
            Alert.alert("Sécurité", "Le mot de passe doit contenir au moins 8 caractères.");
            return;
        }
        if (nextPwd !== confirm) {
            Alert.alert("Confirmation", "Les deux mots de passe ne correspondent pas.");
            return;
        }

        setPasswordLoading(true);
        try {
            const result = await updateUserCredentials({ currentPassword: current, newPassword: nextPwd });
            if (!result.ok) {
                setPasswordError(result.message || "Mot de passe actuel incorrect.");
                return;
            }
            const msg = result.message || "Mot de passe modifié avec succès";
            setSuccessToast(msg);
            setToastVisible(true);
            setCurrentPasswordForPwd("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordError("");
            setShowPasswordForm(false);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Erreur lors de la mise à jour";
            setPasswordError(message);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (emailLoading) return;
        setEmailError("");
        const current = currentPasswordForEmail.trim();
        const nextEmail = newEmail.trim().toLowerCase();

        if (!current) {
            setEmailError("Entre ton mot de passe actuel.");
            return;
        }
        if (!nextEmail) {
            setEmailError("Renseigne un nouvel email.");
            return;
        }
        if (!nextEmail.includes("@") || nextEmail.length < 5) {
            setEmailError("Email invalide.");
            return;
        }

        setEmailLoading(true);
        try {
            const result = await updateUserCredentials({ currentPassword: current, newEmail: nextEmail });
            if (!result.ok) {
                setEmailError(result.message || "Impossible de mettre à jour l'email.");
                return;
            }
            const msg = result.message || "Email modifié avec succès";
            setSuccessToast(msg);
            setToastVisible(true);
            setCurrentPasswordForEmail("");
            setNewEmail("");
            setEmailError("");
            setShowEmailForm(false);
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || "Erreur lors de la mise à jour";
            setEmailError(message);
        } finally {
            setEmailLoading(false);
        }
    };

    React.useEffect(() => {
        if (!toastVisible) return undefined;
        const id = setTimeout(() => setToastVisible(false), 2400);
        return () => clearTimeout(id);
    }, [toastVisible]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <Snackbar
                visible={toastVisible}
                onDismiss={() => setToastVisible(false)}
                style={styles.toast}
                wrapperStyle={{ position: "absolute", top: "45%", alignSelf: "center", left: 12, right: 12, zIndex: 999, elevation: 20 }}
                duration={Snackbar.DURATION_SHORT}
                action={{ label: "OK", onPress: () => setToastVisible(false), color: "#0f172a" }}
            >
                <Text style={styles.toastText}>{successToast}</Text>
            </Snackbar>

            {showPasswordForm ? (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={[styles.infoHeaderRow, { marginBottom: 4 }]}>
                            <Ionicons name="lock-closed-outline" size={18} color="#e2e8f0" />
                            <Text style={styles.infoTitle}>Changer le mot de passe</Text>
                        </View>
                        <Text style={styles.infoSubtitle}>Mot de passe long (8+ caractères) et unique.</Text>

                        <TextInput
                            label="Mot de passe actuel"
                            value={currentPasswordForPwd}
                            onChangeText={setCurrentPasswordForPwd}
                            secureTextEntry={!showCurrentPwd}
                            mode="outlined"
                            outlineColor="rgba(148,163,184,0.4)"
                            activeOutlineColor="#22d3ee"
                            textColor="#e2e8f0"
                            style={styles.input}
                            error={Boolean(passwordError)}
                            placeholder="Obligatoire"
                            placeholderTextColor="#94a3b8"
                            right={
                                <TextInput.Icon
                                    icon={showCurrentPwd ? "eye-off" : "eye"}
                                    onPress={() => setShowCurrentPwd((prev) => !prev)}
                                    forceTextInputFocus={false}
                                />
                            }
                        />
                        {passwordError ? <Text style={styles.inlineError}>{passwordError}</Text> : null}

                        <TextInput
                            label="Nouveau mot de passe"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPwd}
                            mode="outlined"
                            outlineColor="rgba(148,163,184,0.4)"
                            activeOutlineColor="#22d3ee"
                            textColor="#e2e8f0"
                            style={styles.input}
                            placeholder="Minimum 8 caractères"
                            placeholderTextColor="#94a3b8"
                            right={
                                <TextInput.Icon
                                    icon={showNewPwd ? "eye-off" : "eye"}
                                    onPress={() => setShowNewPwd((prev) => !prev)}
                                    forceTextInputFocus={false}
                                />
                            }
                        />

                        <TextInput
                            label="Confirmer le nouveau mot de passe"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPwd}
                            mode="outlined"
                            outlineColor="rgba(148,163,184,0.4)"
                            activeOutlineColor="#22d3ee"
                            textColor="#e2e8f0"
                            style={styles.input}
                            placeholder="Saisis-le à nouveau"
                            placeholderTextColor="#94a3b8"
                            right={
                                <TextInput.Icon
                                    icon={showConfirmPwd ? "eye-off" : "eye"}
                                    onPress={() => setShowConfirmPwd((prev) => !prev)}
                                    forceTextInputFocus={false}
                                />
                            }
                        />

                        <TouchableOpacity
                            style={[styles.actionButton, passwordLoading && { opacity: 0.6 }]}
                            activeOpacity={0.85}
                            onPress={handleUpdatePassword}
                            disabled={passwordLoading}
                        >
                            {passwordLoading ? (
                                <ActivityIndicator color="#0f172a" />
                            ) : (
                                <>
                                    <Ionicons name="key-outline" size={16} color="#0f172a" />
                                    <Text style={styles.actionButtonText}>Mettre à jour</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.secondaryButton]}
                            activeOpacity={0.85}
                            onPress={() => {
                                setShowPasswordForm(false);
                                setPasswordError("");
                            }}
                        >
                            <Ionicons name="close" size={16} color="#e2e8f0" />
                            <Text style={[styles.actionButtonText, { color: "#e2e8f0" }]}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            {showEmailForm ? (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={[styles.infoHeaderRow, { marginBottom: 4 }]}>
                            <Ionicons name="mail-outline" size={18} color="#e2e8f0" />
                            <Text style={styles.infoTitle}>Changer d’email</Text>
                        </View>
                        <Text style={styles.infoSubtitle}>Saisis ton mot de passe et ton nouvel email.</Text>

                        <TextInput
                            label="Mot de passe actuel"
                            value={currentPasswordForEmail}
                            onChangeText={setCurrentPasswordForEmail}
                            secureTextEntry={!showEmailPwd}
                            mode="outlined"
                            outlineColor="rgba(148,163,184,0.4)"
                            activeOutlineColor="#22d3ee"
                            textColor="#e2e8f0"
                            style={styles.input}
                            error={Boolean(emailError)}
                            placeholder="Obligatoire"
                            placeholderTextColor="#94a3b8"
                            right={
                                <TextInput.Icon
                                    icon={showEmailPwd ? "eye-off" : "eye"}
                                    onPress={() => setShowEmailPwd((prev) => !prev)}
                                    forceTextInputFocus={false}
                                />
                            }
                        />
                        {emailError ? <Text style={styles.inlineError}>{emailError}</Text> : null}

                        <TextInput
                            label="Nouvel email"
                            value={newEmail}
                            onChangeText={setNewEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            mode="outlined"
                            outlineColor="rgba(148,163,184,0.4)"
                            activeOutlineColor="#22d3ee"
                            textColor="#e2e8f0"
                            style={styles.input}
                            placeholder="ex: moi@mail.com"
                            placeholderTextColor="#94a3b8"
                        />

                        <TouchableOpacity
                            style={[styles.actionButton, emailLoading && { opacity: 0.6 }]}
                            activeOpacity={0.85}
                            onPress={handleUpdateEmail}
                            disabled={emailLoading}
                        >
                            {emailLoading ? (
                                <ActivityIndicator color="#0f172a" />
                            ) : (
                                <>
                                    <Ionicons name="shield-checkmark" size={16} color="#0f172a" />
                                    <Text style={styles.actionButtonText}>Mettre à jour l’email</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.secondaryButton]}
                            activeOpacity={0.85}
                            onPress={() => {
                                setShowEmailForm(false);
                                setEmailError("");
                            }}
                        >
                            <Ionicons name="close" size={16} color="#e2e8f0" />
                            <Text style={[styles.actionButtonText, { color: "#e2e8f0" }]}>Fermer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : null}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 10,
                    paddingTop: 12,
                    paddingBottom: Math.max(insets.bottom + 24, 36),
                }}
                contentInsetAdjustmentBehavior="never"
            >
                <View style={styles.actionsStack}>
                    {actions.map((action) => {
                        const isLoading = loadingAction === action.key;
                        return (
                            <TouchableOpacity
                                key={action.key}
                                style={[styles.actionCard, action.tone === "danger" && styles.actionCardDanger]}
                                activeOpacity={0.85}
                                disabled={Boolean(loadingAction)}
                                onPress={action.onPress}
                            >
                                <View style={[styles.actionIcon, action.tone === "danger" && styles.actionIconDanger]}>
                                    <Ionicons
                                        name={action.icon}
                                        size={18}
                                        color={action.tone === "danger" ? "#fca5a5" : "#cbd5f5"}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.actionLabel}>{action.label}</Text>
                                    <Text style={styles.actionDescription}>{action.description}</Text>
                                </View>
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#cbd5f5" />
                                ) : (
                                    <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "transparent",
    },
    headerCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#0b1224",
        borderRadius: 16,
        padding: 10,
        gap: 12,
        borderWidth: 1,
        borderColor: "#1f2937",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
        marginBottom: 10,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#1f2937",
        backgroundColor: "#141415ff",
        alignItems: "center",
        justifyContent: "center",
    },
    headerIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    headerTitle: {
        color: "#e5e7eb",
        fontSize: 14,
        fontWeight: "700",
    },
    actionsStack: {
        gap: 10,
    },
    stickyHeader: {
        paddingHorizontal: 0,
        paddingBottom: 10,
    },
    infoCard: {
        backgroundColor: "#0f172a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        marginBottom: 18,
        gap: 12,
    },
    infoTitle: {
        color: "#e2e8f0",
        fontSize: 16,
        fontWeight: "700",
    },
    infoHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoSubtitle: {
        color: "#cbd5e1",
        fontSize: 14,
        marginTop: 4,
        marginBottom: 10,
    },
    input: {
        backgroundColor: "#0b1224",
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#22d3ee",
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    actionButtonText: {
        color: "#0f172a",
        fontWeight: "700",
        fontSize: 14,
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "#0b1224",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    actionCardDanger: {
        borderColor: "#7f1d1d",
        backgroundColor: "#150b0b",
    },
    actionIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111827",
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    actionIconDanger: {
        backgroundColor: "#1c0b0b",
        borderColor: "#7f1d1d",
    },
    actionLabel: {
        color: "#e5e7eb",
        fontSize: 15,
        fontWeight: "700",
    },
    actionDescription: {
        color: "#cbd5e1",
        fontSize: 13,
        marginTop: 4,
    },
    inlineError: {
        color: "#f87171",
        fontSize: 12,
        marginTop: 6,
    },
    toast: {
        backgroundColor: "#22c55e",
        borderRadius: 14,
        marginTop: 8,
    },
    toastText: {
        color: "#0b1224",
        fontWeight: "700",
    },
    secondaryButton: {
        backgroundColor: "#1f2937",
        borderColor: "#334155",
        borderWidth: 1,
    },
    modalOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
    },
    modalCard: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#0f172a",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
        gap: 12,
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 16,
    },
});
