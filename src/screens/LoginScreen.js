// screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import authService from '../services/authService';
import * as Location from 'expo-location';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRemembered = async () => {
      const savedEmail = await authService.getRememberedEmail();
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    };
    loadRemembered();

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to show your current position on the map.'
        );
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      // Login with driver role validation
      await authService.login(email, password, 'driver', rememberMe);
      navigation.replace('OrdersScreen');
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    navigation.navigate('SignupScreen');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rider Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        onPress={() => setRememberMe(!rememberMe)}
        style={styles.checkboxRow}
      >
        <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
        <Text style={styles.checkboxLabel}>Remember Me</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#000" />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>New Driver? Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fcd53f',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
    color: '#222',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#222',
    borderRadius: 5,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#222',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 15,
  },
  loginButton: {
    backgroundColor: '#222',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#222',
  },
  signupButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
