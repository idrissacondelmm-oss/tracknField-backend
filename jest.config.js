module.exports = {
    preset: "jest-expo",
    testEnvironment: "node",
    setupFilesAfterEnv: [
        "@testing-library/jest-native/extend-expect",
        "<rootDir>/tests/setup.ts",
    ],
    testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|expo(nent)?|@expo|expo-.*|@expo-google-fonts/.*|@expo/vector-icons|react-native-vector-icons|react-native-svg|react-native-reanimated|@shopify/react-native-skia)/)",
    ],
};
