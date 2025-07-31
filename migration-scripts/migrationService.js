// migration-scripts/migrationService.js
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

class MigrationService {
  constructor() {
    this.migrationLog = [];
  }

  // Log migration activities
  log(message, type = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    this.migrationLog.push(logEntry);
    console.log(`[MIGRATION ${type.toUpperCase()}] ${message}`);
  }

  // Get all users from Firebase Auth (you'll need to call this from Firebase Admin SDK)
  async getAllAuthUsers() {
    // This should be called from your backend/admin script
    // Firebase client SDK doesn't allow listing all users
    throw new Error('This method should be implemented using Firebase Admin SDK on your backend');
  }

  // Check if user has role assignment
  async checkUserHasRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.exists() && userDoc.data().role;
    } catch (error) {
      this.log(`Error checking user role for ${uid}: ${error.message}`, 'error');
      return false;
    }
  }

  // Create user role document
  async createUserRoleDocument(uid, email, role) {
    try {
      await setDoc(doc(db, 'users', uid), {
        email,
        role,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        migratedAt: serverTimestamp(),
        isMigrated: true
      });
      this.log(`Created role document for user ${uid} with role ${role}`);
      return true;
    } catch (error) {
      this.log(`Error creating role document for ${uid}: ${error.message}`, 'error');
      return false;
    }
  }

  // Create default profile based on role
  async createDefaultProfile(uid, email, role, additionalData = {}) {
    try {
      let profileData = {
        email,
        userId: uid,
        createdAt: serverTimestamp(),
        isMigrated: true
      };

      switch (role) {
        case 'customer':
          profileData = {
            ...profileData,
            name: additionalData.name || 'Customer User',
            phone: additionalData.phone || '',
            address: additionalData.address || 'Address not provided'
          };
          await setDoc(doc(db, 'customers', uid), profileData);
          break;

        case 'driver':
          profileData = {
            ...profileData,
            name: additionalData.name || 'Driver User',
            phone: additionalData.phone || '',
            license: additionalData.license || 'License not provided',
            vehicleInfo: additionalData.vehicleInfo || {
              make: 'Unknown',
              model: 'Unknown',
              year: '',
              color: '',
              licensePlate: 'Not provided'
            },
            isAvailable: true,
            rating: 5.0,
            totalDeliveries: 0
          };
          await setDoc(doc(db, 'drivers', uid), profileData);
          break;

        case 'restaurant':
          profileData = {
            ...profileData,
            restaurantName: additionalData.restaurantName || 'Restaurant Name',
            ownerName: additionalData.ownerName || 'Restaurant Owner',
            address: additionalData.address || 'Address not provided',
            cuisineTypes: additionalData.cuisineTypes || ['American'],
            isOpen: false,
            rating: 5.0,
            totalOrders: 0,
            ownerId: uid,
            operatingHours: {
              monday: { open: '09:00', close: '22:00', isOpen: true },
              tuesday: { open: '09:00', close: '22:00', isOpen: true },
              wednesday: { open: '09:00', close: '22:00', isOpen: true },
              thursday: { open: '09:00', close: '22:00', isOpen: true },
              friday: { open: '09:00', close: '22:00', isOpen: true },
              saturday: { open: '09:00', close: '22:00', isOpen: true },
              sunday: { open: '09:00', close: '22:00', isOpen: true }
            }
          };
          await setDoc(doc(db, 'restaurants', uid), profileData);
          break;

        default:
          throw new Error(`Unknown role: ${role}`);
      }

      this.log(`Created ${role} profile for user ${uid}`);
      return true;
    } catch (error) {
      this.log(`Error creating profile for ${uid}: ${error.message}`, 'error');
      return false;
    }
  }

  // Migrate single user with specified role
  async migrateSingleUser(uid, email, role, profileData = {}) {
    try {
      this.log(`Starting migration for user ${uid} to role ${role}`);

      // Check if already migrated
      if (await this.checkUserHasRole(uid)) {
        this.log(`User ${uid} already has role assignment, skipping`);
        return { success: true, skipped: true };
      }

      // Create user role document
      const roleCreated = await this.createUserRoleDocument(uid, email, role);
      if (!roleCreated) {
        return { success: false, error: 'Failed to create role document' };
      }

      // Create profile document
      const profileCreated = await this.createDefaultProfile(uid, email, role, profileData);
      if (!profileCreated) {
        return { success: false, error: 'Failed to create profile document' };
      }

      this.log(`Successfully migrated user ${uid} to role ${role}`);
      return { success: true, migrated: true };
    } catch (error) {
      this.log(`Migration failed for user ${uid}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Batch migrate multiple users
  async batchMigrateUsers(userMigrationData) {
    const results = {
      total: userMigrationData.length,
      migrated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    this.log(`Starting batch migration for ${results.total} users`);

    for (const userData of userMigrationData) {
      const { uid, email, role, profileData } = userData;
      const result = await this.migrateSingleUser(uid, email, role, profileData);

      if (result.success) {
        if (result.migrated) {
          results.migrated++;
        } else if (result.skipped) {
          results.skipped++;
        }
      } else {
        results.failed++;
        results.errors.push({
          uid,
          email,
          error: result.error
        });
      }

      // Add small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.log(`Batch migration completed: ${results.migrated} migrated, ${results.skipped} skipped, ${results.failed} failed`);
    return results;
  }

  // Interactive migration helper for manual assignment
  async promptForUserRole(uid, email) {
    // This would be used in a manual migration interface
    return new Promise((resolve) => {
      console.log(`\nUser needs role assignment:`);
      console.log(`UID: ${uid}`);
      console.log(`Email: ${email}`);
      console.log(`Please choose role:`);
      console.log(`1. Customer`);
      console.log(`2. Driver`);
      console.log(`3. Restaurant`);
      console.log(`4. Skip this user`);
      
      // In a real implementation, you'd have a proper UI for this
      // This is just a conceptual example
      resolve('customer'); // Default for example
    });
  }

  // Update existing orders to include missing user references
  async migrateOrderReferences() {
    try {
      this.log('Starting order reference migration');
      
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const batch = writeBatch(db);
      let updatedCount = 0;

      ordersSnapshot.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        let needsUpdate = false;
        let updates = {};

        // Add restaurantOwnerId if missing
        if (orderData.restaurantId && !orderData.restaurantOwnerId) {
          // This would need to be populated based on your restaurant data
          // For now, we'll flag it for manual review
          updates.needsRestaurantOwnerUpdate = true;
          needsUpdate = true;
        }

        // Add customerId if missing (if you have customer email)
        if (orderData.customerEmail && !orderData.customerId) {
          updates.needsCustomerIdUpdate = true;
          needsUpdate = true;
        }

        if (needsUpdate) {
          batch.update(doc(db, 'orders', orderDoc.id), {
            ...updates,
            migrationRequired: true,
            migratedAt: serverTimestamp()
          });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        this.log(`Updated ${updatedCount} orders with migration flags`);
      } else {
        this.log('No orders needed reference migration');
      }

      return { success: true, updatedCount };
    } catch (error) {
      this.log(`Order reference migration failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  // Get migration report
  getMigrationReport() {
    return {
      logs: this.migrationLog,
      summary: {
        totalOperations: this.migrationLog.length,
        errors: this.migrationLog.filter(log => log.type === 'error').length,
        warnings: this.migrationLog.filter(log => log.type === 'warning').length,
        infos: this.migrationLog.filter(log => log.type === 'info').length
      }
    };
  }

  // Clear migration logs
  clearLogs() {
    this.migrationLog = [];
  }
}

// Export singleton instance
export default new MigrationService();

// Example usage functions
export const migrationExamples = {
  // Example: Migrate specific users with known roles
  async migrateKnownUsers() {
    const usersToMigrate = [
      {
        uid: 'user1-uid',
        email: 'driver1@example.com',
        role: 'driver',
        profileData: {
          name: 'John Driver',
          phone: '555-0001',
          license: 'DL123456',
          vehicleInfo: {
            make: 'Toyota',
            model: 'Prius',
            year: '2020',
            color: 'Blue',
            licensePlate: 'ABC123'
          }
        }
      },
      {
        uid: 'user2-uid',
        email: 'restaurant1@example.com',
        role: 'restaurant',
        profileData: {
          restaurantName: 'Pizza Palace',
          ownerName: 'Mario Restaurant',
          address: '123 Main St, City, State 12345',
          cuisineTypes: ['Italian', 'Pizza']
        }
      }
      // Add more users as needed
    ];

    return await MigrationService.batchMigrateUsers(usersToMigrate);
  },

  // Example: Create transition period safety checks
  async createTransitionSafetyMeasures() {
    // You could implement temporary rules or safety checks here
    console.log('Implementing transition safety measures...');
    
    // Example: Create a backup of critical data
    // Example: Set up monitoring for failed auth attempts
    // Example: Create rollback procedures
  }
};