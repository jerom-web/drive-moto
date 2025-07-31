import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import errorHandler, { errorUtils } from './errorHandler';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.userProfile = null;
  }

  // Initialize auth state listener
  initializeAuthListener(callback) {
    return onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          this.currentUser = user;
          await this.loadUserProfile(user.uid);
          callback({ user, role: this.userRole, profile: this.userProfile });
        } else {
          this.currentUser = null;
          this.userRole = null;
          this.userProfile = null;
          callback({ user: null, role: null, profile: null });
        }
      } catch (error) {
        errorHandler.log(error, 'Auth State Change', user?.uid);
        callback({ user: null, role: null, profile: null });
      }
    });
  }

  // Load user profile and role from Firestore
  async loadUserProfile(uid) {
    return await errorUtils.withErrorHandling(async () => {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.userRole = userData.role;
        
        // Load role-specific profile
        let roleProfile = null;
        if (userData.role === 'customer') {
          const customerDoc = await getDoc(doc(db, 'customers', uid));
          roleProfile = customerDoc.exists() ? customerDoc.data() : null;
        } else if (userData.role === 'driver') {
          const driverDoc = await getDoc(doc(db, 'drivers', uid));
          roleProfile = driverDoc.exists() ? driverDoc.data() : null;
        } else if (userData.role === 'restaurant') {
          const restaurantDoc = await getDoc(doc(db, 'restaurants', uid));
          roleProfile = restaurantDoc.exists() ? restaurantDoc.data() : null;
        }
        
        this.userProfile = { ...userData, ...roleProfile };
        return this.userProfile;
      } else {
        throw new Error('User profile not found. Please contact support.');
      }
    }, 'Load User Profile', false);
  }

  // Customer signup
  async signupCustomer({ email, password, name, phone, address }) {
    return await errorUtils.withErrorHandling(async () => {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        // Update display name
        await updateProfile(user, { displayName: name });

        // Create user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'customer',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        // Create customer profile
        await setDoc(doc(db, 'customers', user.uid), {
          name,
          email: user.email,
          phone,
          address,
          createdAt: serverTimestamp(),
          userId: user.uid
        });

        await this.loadUserProfile(user.uid);
        return { user, role: 'customer', profile: this.userProfile };
      } catch (firestoreError) {
        // If Firestore operations fail, try to clean up the auth user
        try {
          await user.delete();
        } catch (deleteError) {
          errorHandler.log(deleteError, 'Cleanup Auth User After Firestore Failure', user.uid);
        }
        throw firestoreError;
      }
    }, 'Customer Signup');
  }

  // Driver signup
  async signupDriver({ email, password, name, phone, license, vehicleInfo }) {
    return await errorUtils.withErrorHandling(async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await updateProfile(user, { displayName: name });

        // Create user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'driver',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        // Create driver profile
        await setDoc(doc(db, 'drivers', user.uid), {
          name,
          email: user.email,
          phone,
          license,
          vehicleInfo: {
            make: vehicleInfo.make || '',
            model: vehicleInfo.model || '',
            year: vehicleInfo.year || '',
            color: vehicleInfo.color || '',
            licensePlate: vehicleInfo.licensePlate || ''
          },
          isAvailable: true,
          rating: 5.0,
          totalDeliveries: 0,
          createdAt: serverTimestamp(),
          userId: user.uid
        });

        await this.loadUserProfile(user.uid);
        return { user, role: 'driver', profile: this.userProfile };
      } catch (firestoreError) {
        // Cleanup on failure
        try {
          await user.delete();
        } catch (deleteError) {
          errorHandler.log(deleteError, 'Cleanup Auth User After Firestore Failure', user.uid);
        }
        throw firestoreError;
      }
    }, 'Driver Signup');
  }

  // Restaurant signup
  async signupRestaurant({ email, password, restaurantName, ownerName, address, cuisineTypes }) {
    return await errorUtils.withErrorHandling(async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      try {
        await updateProfile(user, { displayName: ownerName });

        // Create user document
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          role: 'restaurant',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });

        // Create restaurant profile
        await setDoc(doc(db, 'restaurants', user.uid), {
          restaurantName,
          ownerName,
          email: user.email,
          address,
          cuisineTypes: Array.isArray(cuisineTypes) ? cuisineTypes : [cuisineTypes],
          isOpen: false,
          rating: 5.0,
          totalOrders: 0,
          ownerId: user.uid,
          createdAt: serverTimestamp(),
          // Default operating hours
          operatingHours: {
            monday: { open: '09:00', close: '22:00', isOpen: true },
            tuesday: { open: '09:00', close: '22:00', isOpen: true },
            wednesday: { open: '09:00', close: '22:00', isOpen: true },
            thursday: { open: '09:00', close: '22:00', isOpen: true },
            friday: { open: '09:00', close: '22:00', isOpen: true },
            saturday: { open: '09:00', close: '22:00', isOpen: true },
            sunday: { open: '09:00', close: '22:00', isOpen: true }
          }
        });

        await this.loadUserProfile(user.uid);
        return { user, role: 'restaurant', profile: this.userProfile };
      } catch (firestoreError) {
        // Cleanup on failure
        try {
          await user.delete();
        } catch (deleteError) {
          errorHandler.log(deleteError, 'Cleanup Auth User After Firestore Failure', user.uid);
        }
        throw firestoreError;
      }
    }, 'Restaurant Signup');
  }

  // Login with role validation
  async login(email, password, expectedRole = null, rememberMe = false) {
    return await errorUtils.withErrorHandling(async () => {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Load user profile to get role
      await this.loadUserProfile(user.uid);

      // Validate role if expected role is provided
      if (expectedRole && this.userRole !== expectedRole) {
        await signOut(auth);
        errorHandler.handleRoleError(this.userRole, expectedRole);
        throw new Error(`Access denied. This app is for ${expectedRole}s only.`);
      }

      // Handle remember me
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
      }

      // Update last login
      await setDoc(doc(db, 'users', user.uid), {
        lastLoginAt: serverTimestamp()
      }, { merge: true });

      return { user, role: this.userRole, profile: this.userProfile };
    }, 'Login');
  }

  // Logout
  async logout() {
    return await errorUtils.withErrorHandling(async () => {
      await signOut(auth);
      this.currentUser = null;
      this.userRole = null;
      this.userProfile = null;
    }, 'Logout', false);
  }

  // Role validation helpers
  isCustomer() {
    return this.userRole === 'customer';
  }

  isDriver() {
    return this.userRole === 'driver';
  }

  isRestaurant() {
    return this.userRole === 'restaurant';
  }

  validateAppAccess(requiredRole) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }
    if (this.userRole !== requiredRole) {
      errorHandler.handleRoleError(this.userRole, requiredRole);
      throw new Error(`Access denied. This app is for ${requiredRole}s only.`);
    }
    return true;
  }

  // Get current user info
  getCurrentUser() {
    return {
      user: this.currentUser,
      role: this.userRole,
      profile: this.userProfile
    };
  }

  // Check if user has remembered email
  async getRememberedEmail() {
    try {
      return await AsyncStorage.getItem('rememberedEmail');
    } catch (error) {
      errorHandler.log(error, 'Get Remembered Email');
      return null;
    }
  }

  // Safe operation wrapper for existing users
  async safeOperation(operation, context = 'Safe Operation') {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'permission-denied') {
        errorHandler.handleFirestoreError(error, context);
        // Suggest migration if needed
        errorHandler.showWarning(
          'Account Update Required',
          'Your account needs to be updated to use this feature. Would you like to update it now?',
          () => {
            // Trigger migration process
            this.triggerMigration();
          }
        );
      } else {
        throw error;
      }
    }
  }

  // Trigger migration for existing users
  async triggerMigration() {
    try {
      if (!this.currentUser) {
        throw new Error('No user logged in');
      }

      // This would trigger the migration process
      // For now, we'll just show an info message
      errorHandler.showSuccess(
        'Account Update',
        'Please contact support to update your account.'
      );
    } catch (error) {
      errorHandler.handleMigrationError(error, this.currentUser?.uid);
    }
  }
}

// Export singleton instance
export default new AuthService();