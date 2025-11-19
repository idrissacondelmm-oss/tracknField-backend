import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, Divider } from "react-native-paper";

export default function ProfileInfoCard({ profile }: { profile: any }) {
    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text style={styles.sectionTitle}>Informations personnelles</Text>
                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Nom</Text>
                    <Text style={styles.value}>{profile?.name}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{profile?.email}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Âge</Text>
                    <Text style={styles.value}>{profile?.age || "Non renseigné"}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Date de naissance</Text>
                    <Text style={styles.value}>{profile?.birthDate || "Non renseignée"}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Pays</Text>
                    <Text style={styles.value}>{profile?.country || "Non renseigné"}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Sport</Text>
                    <Text style={styles.value}>{profile?.sport || "Non renseigné"}</Text>
                </View>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: { backgroundColor: "white", borderRadius: 12, elevation: 1 },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 5 },
    divider: { marginBottom: 10 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    label: { fontWeight: "600", color: "#475569" },
    value: { color: "#0f172a" },
});
