import { StatusBar } from "expo-status-bar";
import Navigation from "./src/navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Navigation />
        <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
