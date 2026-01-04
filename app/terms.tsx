import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function TermsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const lastUpdated = useMemo(() => {
        try {
            return new Date().toLocaleDateString("fr-FR");
        } catch {
            return "";
        }
    }, []);

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    paddingHorizontal: 10,
                    paddingTop: 0,
                    paddingBottom: Math.max(insets.bottom + 24, 36),
                }}
                contentInsetAdjustmentBehavior="never"
                stickyHeaderIndices={[0]}
            >
                <View style={styles.stickyHeader}>
                    <View style={styles.headerCard}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                            accessibilityRole="button"
                            accessibilityLabel="Retour"
                        >
                            <Ionicons name="chevron-back" size={18} color="#e2e8f0" />
                        </TouchableOpacity>
                        <View style={styles.headerIconWrap}>
                            <Ionicons name="document-text-outline" size={22} color="#e2e8f0" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle}>Mentions légales & CGU</Text>
                            <Text style={styles.headerSubtitle}>Dernière mise à jour : {lastUpdated}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.notice}>
                        Documents fournis par l’éditeur à titre informatif. Ils doivent être adaptés à ta situation (statut,
                        hébergeur, fonctionnalités) et validés si nécessaire par un professionnel.
                    </Text>

                    <Section title="1. Mentions légales">
                        {`Nom de l’application : Talent-X\n\nÉditeur :\nIdrissa CONDÉ\nStatut : Particulier – éditeur non professionnel\n\nAdresse :\nConformément à l’article 6-III-2 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, l’adresse personnelle de l’éditeur a été communiquée à l’hébergeur et peut être transmise aux autorités judiciaires sur réquisition.\n\nEmail de contact :\ncontact@talent-x.app\n\nDirecteur de la publication :\nIdrissa CONDÉ\n\nHébergeur :\nOVHcloud\nOVH SAS\n2 rue Kellermann, 59100 Roubaix, France`}
                    </Section>

                    <Section title="2. Conditions Générales d’Utilisation (CGU)">
                        {`1. Objet\nLes présentes Conditions Générales d’Utilisation (ci-après « CGU ») ont pour objet de définir les modalités d’accès et d’utilisation de l’application mobile Talent-X (ci-après « l’Application »).\n\nToute utilisation de l’Application implique l’acceptation pleine et entière des présentes CGU.\n\n2. Accès à l’Application\nL’Application est gratuite et accessible sur appareils Android et iOS, sous réserve de disposer d’un accès à internet.\n\nL’éditeur se réserve le droit de suspendre temporairement l’accès pour maintenance ou mise à jour, sans obligation d’indemnisation.\n\n3. Création de compte\nL’accès à certaines fonctionnalités nécessite la création d’un compte utilisateur.\n\nL’utilisateur s’engage à :\n• fournir des informations exactes,\n• maintenir la confidentialité de ses identifiants,\n• ne pas usurper l’identité d’un tiers.\n\nToute utilisation frauduleuse engage la responsabilité exclusive de l’utilisateur.\n\n4. Utilisation autorisée\nL’utilisateur s’engage à utiliser l’Application :\n• conformément aux lois françaises et européennes,\n• dans le respect des autres utilisateurs,\n• à des fins personnelles et non commerciales.\n\nSont strictement interdits :\n• toute tentative d’accès frauduleux,\n• toute extraction automatisée de données,\n• tout usage portant atteinte au bon fonctionnement de l’Application.\n\n5. Propriété intellectuelle\nL’ensemble des éléments de l’Application (code, design, logo, textes, bases de données) est protégé par le Code de la propriété intellectuelle.\n\nToute reproduction ou exploitation non autorisée est interdite.\n\n6. Responsabilité\nL’Application est fournie « en l’état ».\n\nL’éditeur ne saurait être tenu responsable :\n• d’une indisponibilité temporaire,\n• d’une perte de données imputable à l’utilisateur,\n• de dommages indirects liés à l’utilisation de l’Application.\n\nLes données sportives fournies par l’utilisateur ont une valeur informative et ne constituent en aucun cas un avis médical.\n\n7. Résiliation\nL’utilisateur peut supprimer son compte à tout moment.\n\nL’éditeur se réserve le droit de suspendre ou supprimer un compte en cas de non-respect des CGU.\n\n8. Droit applicable\nLes présentes CGU sont soumises au droit français.\n\nEn cas de litige, les tribunaux français sont seuls compétents.`}
                    </Section>

                    <Section title="3. Politique de confidentialité (RGPD)">
                        {`1. Responsable du traitement\nLe responsable du traitement des données est :\nIdrissa CONDÉ\nContact : contact@talent-x.app\n\n2. Données collectées\nL’Application peut collecter :\n• données d’identification (email, pseudo),\n• données sportives (performances, entraînements, statistiques),\n• données techniques (adresse IP, logs).\n\nLes données sportives sont considérées comme des données sensibles au sens du RGPD.\n\n3. Finalités\nLes données sont collectées pour :\n• le fonctionnement de l’Application,\n• la gestion des comptes utilisateurs,\n• l’affichage des statistiques sportives,\n• l’amélioration des services,\n• la sécurité et la prévention des abus.\n\n4. Base légale\nLe traitement repose sur :\n• l’exécution du service,\n• le consentement explicite de l’utilisateur,\n• l’intérêt légitime de l’éditeur pour la sécurité.\n\n5. Consentement explicite\nLors de l’inscription, l’utilisateur donne son consentement explicite à la collecte et au traitement de ses données personnelles et sportives.\n\nCe consentement peut être retiré à tout moment.\n\n6. Durée de conservation\nLes données sont conservées :\n• tant que le compte est actif,\n• puis supprimées dans un délai maximal de 30 jours après suppression du compte.\n\n7. Partage des données\nLes données ne sont :\n• ni vendues,\n• ni cédées,\n• ni transmises à des tiers,\n\nsauf obligation légale ou prestataire technique strictement nécessaire (hébergement).\n\n8. Sécurité\nDes mesures techniques et organisationnelles sont mises en œuvre :\n• accès restreint,\n• hébergement sécurisé,\n• protection contre les accès non autorisés.\n\n9. Droits des utilisateurs\nConformément au RGPD, l’utilisateur dispose des droits suivants :\n• accès,\n• rectification,\n• suppression,\n• limitation,\n• opposition,\n• portabilité.\n\nToute demande peut être adressée à :\ncontact@talent-x.app\n\n10. Réclamation\nL’utilisateur peut introduire une réclamation auprès de la CNIL :\nwww.cnil.fr`}
                    </Section>

                    <Section title="4. Texte d’acceptation (inscription)">
                        {`J’accepte les Conditions Générales d’Utilisation et la Politique de Confidentialité et je consens explicitement au traitement de mes données personnelles et sportives conformément au RGPD.`}
                    </Section>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionText}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#010617",
    },
    stickyHeader: {
        paddingTop: 6,
        paddingBottom: 10,
        backgroundColor: "#010617",
    },
    headerCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 22,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
    },
    backButton: {
        width: 34,
        height: 34,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.25)",
        backgroundColor: "rgba(2,6,23,0.55)",
    },
    headerIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.35)",
        backgroundColor: "rgba(34,211,238,0.12)",
    },
    headerTitle: {
        color: "#f8fafc",
        fontSize: 16,
        fontWeight: "800",
    },
    headerSubtitle: {
        color: "#94a3b8",
        fontSize: 12,
        marginTop: 2,
    },
    card: {
        borderRadius: 22,
        padding: 16,
        backgroundColor: "rgba(15,23,42,0.75)",
        borderWidth: 1,
        borderColor: "rgba(148,163,184,0.2)",
        gap: 12,
    },
    notice: {
        color: "#cbd5e1",
        fontSize: 12,
        lineHeight: 18,
        opacity: 0.9,
    },
    section: {
        gap: 6,
    },
    sectionTitle: {
        color: "#e2e8f0",
        fontWeight: "800",
        fontSize: 13,
        letterSpacing: 0.2,
    },
    sectionText: {
        color: "#cbd5e1",
        fontSize: 13,
        lineHeight: 19,
    },
});
