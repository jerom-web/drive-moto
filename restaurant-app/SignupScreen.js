// restaurant-app/SignupScreen.js
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

const cuisineOptions = [
  'American', 'Italian', 'Chinese', 'Mexican', 'Indian', 'Japanese', 
  'Thai', 'Mediterranean', 'French', 'Spanish', 'Korean', 'Vietnamese',
  'Greek', 'Turkish', 'Lebanese', 'Pizza', 'Burgers', 'Seafood',
  'Vegetarian', 'Vegan', 'Fast Food', 'Healthy', 'Desserts', 'Coffee'
];

export default function RestaurantSignupScreen({ navigation }) {
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    cuisineTypes: [],
    phone: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [showCuisineOptions, setShowCuisineOptions] = useState(false);

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

  const toggleCuisineType = (cuisine) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes.includes(cuisine)
        ? prev.cuisineTypes.filter(c => c !== cuisine)
        : [...prev.cuisineTypes, cuisine]
    }));
  };

  const validateForm = () => {
    if (!formData.restaurantName.trim()) {
      Alert.alert('Error', 'Please enter your restaurant name');
      return false;
    }
    if (!formData.ownerName.trim()) {
      Alert.alert('Error', 'Please enter the owner name');
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
    if (formData.cuisineTypes.length === 0) {
      Alert.alert('Error', 'Please select at least one cuisine type');
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const addressString = `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zipCode}`.trim();
      
      await authService.signupRestaurant({
        email: formData.email,
        password: formData.password,
        restaurantName: formData.restaurantName,
        ownerName: formData.ownerName,
        address: addressString,
        cuisineTypes: formData.cuisineTypes
      });
      
      Alert.alert(
        'Success',
        'Your restaurant account has been created successfully!',
        [{ text: 'OK', onPress: () => navigation.replace('RestaurantDashboard') }] // Adjust route name
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
      <Text style={styles.title}>Restaurant Registration</Text>
      <Text style={styles.subtitle}>Join our platform</Text>

      {/* Restaurant Information */}
      <Text style={styles.sectionTitle}>Restaurant Information</Text>
      
      <TextInput
        placeholder="Restaurant Name"
        style={styles.input}
        value={formData.restaurantName}
        onChangeText={(value) => handleInputChange('restaurantName', value)}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Owner/Manager Name"
        style={styles.input}
        value={formData.ownerName}
        onChangeText={(value) => handleInputChange('ownerName', value)}
        autoCapitalize="words"
      />

      <TextInput
        placeholder="Restaurant Phone"
        style={styles.input}
        value={formData.phone}
        onChangeText={(value) => handleInputChange('phone', value)}
        keyboardType="phone-pad"
      />

      <TextInput
        placeholder="Restaurant Description (Optional)"
        style={[styles.input, styles.textArea]}
        value={formData.description}
        onChangeText={(value) => handleInputChange('description', value)}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Address Information */}
      <Text style={styles.sectionTitle}>Restaurant Address</Text>

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

      {/* Cuisine Types */}
      <Text style={styles.sectionTitle}>Cuisine Types</Text>
      <Text style={styles.subtext}>Select all that apply to your restaurant</Text>
      
      <TouchableOpacity 
        style={styles.cuisineSelector}
        onPress={() => setShowCuisineOptions(!showCuisineOptions)}
      >
        <Text style={styles.cuisineSelectorText}>
          {formData.cuisineTypes.length > 0 
            ? `${formData.cuisineTypes.length} cuisine(s) selected`
            : 'Select cuisine types'
          }
        </Text>
        <Text style={styles.dropdownArrow}>{showCuisineOptions ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showCuisineOptions && (
        <View style={styles.cuisineOptions}>
          {cuisineOptions.map((cuisine) => (
            <TouchableOpacity
              key={cuisine}
              style={[
                styles.cuisineOption,
                formData.cuisineTypes.includes(cuisine) && styles.cuisineOptionSelected
              ]}
              onPress={() => toggleCuisineType(cuisine)}
            >
              <Text style={[
                styles.cuisineOptionText,
                formData.cuisineTypes.includes(cuisine) && styles.cuisineOptionTextSelected
              ]}>
                {cuisine}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Account Information */}
      <Text style={styles.sectionTitle}>Account Information</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        autoCapitalize="none"
        keyboardType="email-address"
      />

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
        <ActivityIndicator size="large" color="#FF6B35" style={styles.loading} />
      ) : (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.signupButton} onPress={handleSignup}>
            <Text style={styles.signupButtonText}>Create Restaurant Account</Text>
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
    backgroundColor: '#fff',
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
  subtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
  textArea: {
    height: 80,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  cuisineSelector: {
    backgroundColor: 'white',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cuisineSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#666',
  },
  cuisineOptions: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    marginBottom: 10,
    maxHeight: 200,
  },
  cuisineOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cuisineOptionSelected: {
    backgroundColor: '#FF6B35',
  },
  cuisineOptionText: {
    fontSize: 16,
    color: '#333',
  },
  cuisineOptionTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 30,
    gap: 15,
  },
  signupButton: {
    backgroundColor: '#FF6B35',
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
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '500',
  },
  loading: {
    marginTop: 30,
  },
});