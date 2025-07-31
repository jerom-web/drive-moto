// customer-app/SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import authService from '../services/authService'; // Adjust path based on your structure

export default function CustomerSignupScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    }
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (!formData.address.street.trim() || !formData.address.city.trim()) {
      Alert.alert('Error', 'Please enter your complete address');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const addressString = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}`.trim();
      
      await authService.signupCustomer({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        address: addressString
      });
      
      Alert.alert(
        'Success',
        'Your customer account has been created successfully!',
        [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }] // Adjust route name
      );
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join our community</Text>

      {/* Personal Information */}
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <TextInput
        placeholder="Full Name"
        style={styles.input}
        value={formData.name}
        onChangeText={(value) => handleInputChange('name', value)}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Phone Number"
        style={styles.input}
        value={formData.phone}
        onChangeText={(value) => handleInputChange('phone', value)}
        keyboardType="phone-pad"
      />

      {/* Address Information */}
      <Text style={styles.sectionTitle}>Delivery Address</Text>

      <TextInput
        placeholder="Street Address"
        style={styles.input}
        value={formData.address.street}
        onChangeText={(value) => handleAddressChange('street', value)}
        autoCapitalize="words"
      />

      <View style={styles.row}>
        <TextInput
          placeholder="City"
          style={[styles.input, styles.halfInput]}
          value={formData.address.city}
          onChangeText={(value) => handleAddressChange('city', value)}
          autoCapitalize="words"
        />
        <TextInput
          placeholder="State"
          style={[styles.input, styles.halfInput]}
          value={formData.address.state}
          onChangeText={(value) => handleAddressChange('state', value)}
          autoCapitalize="characters"
          maxLength={2}
        />
      </View>

      <TextInput
        placeholder="ZIP Code"
        style={styles.input}
        value={formData.address.zipCode}
        onChangeText={(value) => handleAddressChange('zipCode', value)}
        keyboardType="numeric"
      />

      {/* Account Security */}
      <Text style={styles.sectionTitle}>Account Security</Text>

      <TextInput
        placeholder="Password (min 6 characters)"
        style={styles.input}
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
        secureTextEntry
      />

      <TextInput
        placeholder="Confirm Password"
        style={styles.input}
        value={formData.confirmPassword}
        onChangeText={(value) => handleInputChange('confirmPassword', value)}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
  },
  signupButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loading: {
    marginTop: 30,
  },
});