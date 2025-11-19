import React from "react";
import { View, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { colors } from "../../../src/styles/theme";

export default function ProfileActions() {
    return (
        <View style={styles.container}>
            <Button
                mode="contained"
                style={styles.button}
                onPress={() => console.log("Voir mes performances")}
            >
                Voir mes performances
            </Button>

            <Button
                mode="outlined"
                textColor={colors.primary}
                style={styles.buttonOutline}
                onPress={() => console.log("Paramètres")}
            >
                Paramètres
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginTop: 10 },
    button: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        marginBottom: 10,
    },
    buttonOutline: {
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 14,
    },
});
