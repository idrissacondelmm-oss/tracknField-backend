import React, { useRef } from "react";
import { SafeAreaView } from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
    const webviewRef = useRef(null);

    const avatarUrl =
        "https://kirikou.readyplayer.me/avatar?id=69281760fb99478e41c2f2f9";

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <WebView
                ref={webviewRef}
                source={{ uri: avatarUrl }}
                originWhitelist={["*"]}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                onMessage={(event) => {
                    console.log("Message from RPM iframe:", event.nativeEvent.data);
                }}
                injectedJavaScript={`
          window.ReactNativeWebView.postMessage("iframe-loaded");
          true;
        `}
                // 🔥 Paramètre crucial pour Ready Player Me
                setSupportMultipleWindows={false}
            />
        </SafeAreaView>
    );
}
