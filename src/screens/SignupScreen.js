// screens/SignupScreen.js
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
import authService from '../services/authService';

export default function SignupScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    license: '',
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: '',
    }
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVehicleInfoChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      vehicleInfo: {
        ...prev.vehicleInfo,
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
    if (!formData.license.trim()) {
      Alert.alert('Error', 'Please enter your driver license number');
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
    if (!formData.vehicleInfo.make.trim() || !formData.vehicleInfo.model.trim()) {
      Alert.alert('Error', 'Please enter your vehicle make and model');
      return false;
    }
    if (!formData.vehicleInfo.licensePlate.trim()) {
      Alert.alert('Error', 'Please enter your vehicle license plate');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await authService.signupDriver({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        license: formData.license,
        vehicleInfo: formData.vehicleInfo
      });
      
      Alert.alert(
        'Success',
        'Your driver account has been created successfully!',
        [{ text: 'OK', onPress: () => navigation.replace('OrdersScreen') }]
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
      <Text style={styles.title}>Driver Registration</Text>
      <Text style={styles.subtitle}>Join our delivery team</Text>

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

      <TextInput
        placeholder="Driver License Number"
        style={styles.input}
        value={formData.license}
        onChangeText={(value) => handleInputChange('license', value)}
        autoCapitalize="characters"
      />

      {/* Vehicle Information */}
      <Text style={styles.sectionTitle}>Vehicle Information</Text>

      <View style={styles.row}>
        <TextInput
          placeholder="Make"
          style={[styles.input, styles.halfInput]}
          value={formData.vehicleInfo.make}
          onChangeText={(value) => handleVehicleInfoChange('make', value)}
          autoCapitalize="words"
        />
        <TextInput
          placeholder="Model"
          style={[styles.input, styles.halfInput]}
          value={formData.vehicleInfo.model}
          onChangeText={(value) => handleVehicleInfoChange('model', value)}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.row}>
        <TextInput
          placeholder="Year"
          style={[styles.input, styles.halfInput]}
          value={formData.vehicleInfo.year}
          onChangeText={(value) => handleVehicleInfoChange('year', value)}
          keyboardType="numeric"
          maxLength={4}
        />
        <TextInput
          placeholder="Color"
          style={[styles.input, styles.halfInput]}
          value={formData.vehicleInfo.color}
          onChangeText={(value) => handleVehicleInfoChange('color', value)}
          autoCapitalize="words"
        />
      </View>

      <TextInput
        placeholder="License Plate"
        style={styles.input}
        value={formData.vehicleInfo.licensePlate}
        onChangeText={(value) => handleVehicleInfoChange('licensePlate', value)}
        autoCapitalize="characters"
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
        <ActivityIndicator size="large" color="#222" style={styles.loading} />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Create Driver Account</Text>
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
    backgroundColor: '#fcd53f',
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
    color: '#222',
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
    color: '#222',
    marginTop: 20,
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    fontSize: 16,
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
    backgroundColor: '#222',
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
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
  },
  loading: {
    marginTop: 30,
  },
});