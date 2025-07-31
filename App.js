import { StatusBar } from "expo-status-bar";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import Navigation from "./src/navigation";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import authService from "./src/services/authService";

export default function App() {
  const [authState, setAuthState] = useState({
    loading: true,
    user: null,
    role: null,
    profile: null
  });

  useEffect(() => {
    // Initialize auth listener
    const unsubscribe = authService.initializeAuthListener((authData) => {
      setAuthState({
        loading: false,
        user: authData.user,
        role: authData.role,
        profile: authData.profile
      });

      // Validate driver access if user is authenticated
      if (authData.user && authData.role && authData.role !== 'driver') {
        Alert.alert(
          'Access Denied',
          'This app is for drivers only. Please use the correct app for your account type.',
          [
            {
              text: 'Logout',
              onPress: async () => {
                await authService.logout();
              }
            }
          ]
        );
      }
    });

    return unsubscribe;
  }, []);

  // Show loading screen while checking authentication
  if (authState.loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
          <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  // Show access denied screen for non-driver users
  if (authState.user && authState.role && authState.role !== 'driver') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View style={styles.accessDeniedContainer}>
            <Text style={styles.accessDeniedTitle}>Access Denied</Text>
            <Text style={styles.accessDeniedText}>
              This app is for drivers only. Your account type is: {authState.role}
            </Text>
            <Text style={styles.accessDeniedSubtext}>
              Please use the correct app for your account type.
            </Text>
          </View>
          <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Navigation />
        <StatusBar style={Platform.OS === "ios" ? "dark" : "auto"} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcd53f',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcd53f',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 20,
    textAlign: 'center',
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 10,
  },
  accessDeniedSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
