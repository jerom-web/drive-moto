# Firebase Security Testing Guide

## Overview
This guide provides comprehensive testing procedures to validate the role-based Firebase security implementation before production deployment.

## Test Environment Setup

### 1. Firebase Test Project
```bash
# Create test project
firebase projects:create your-app-security-test

# Configure test project
firebase use your-app-security-test
firebase init firestore
firebase init auth
```

### 2. Test Data Setup
```javascript
// Create test users for each role
const testUsers = {
  customer: {
    email: 'customer@test.com',
    password: 'test123456',
    name: 'Test Customer',
    phone: '+1-555-0001',
    address: '123 Test St, Test City, TC 12345'
  },
  driver: {
    email: 'driver@test.com',
    password: 'test123456',
    name: 'Test Driver',
    phone: '+1-555-0002',
    license: 'DL123456789',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Prius',
      year: '2020',
      color: 'Blue',
      licensePlate: 'TEST123'
    }
  },
  restaurant: {
    email: 'restaurant@test.com',
    password: 'test123456',
    restaurantName: 'Test Restaurant',
    ownerName: 'Test Owner',
    address: '456 Food Ave, Test City, TC 12345',
    cuisineTypes: ['American', 'Italian']
  }
};
```

## Test Categories

### A. Authentication Tests

#### A1. User Registration Tests
**Objective**: Verify new users can register with correct role assignment

```javascript
// Test Customer Registration
describe('Customer Registration', () => {
  test('should create customer account with all required fields', async () => {
    const result = await authService.signupCustomer(testUsers.customer);
    
    expect(result.user).toBeDefined();
    expect(result.role).toBe('customer');
    expect(result.profile.name).toBe(testUsers.customer.name);
    
    // Verify Firestore documents created
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const customerDoc = await getDoc(doc(db, 'customers', result.user.uid));
    
    expect(userDoc.exists()).toBe(true);
    expect(customerDoc.exists()).toBe(true);
    expect(userDoc.data().role).toBe('customer');
  });
  
  test('should reject invalid email format', async () => {
    const invalidData = { ...testUsers.customer, email: 'invalid-email' };
    
    await expect(authService.signupCustomer(invalidData))
      .rejects
      .toThrow('Invalid email address');
  });
  
  test('should reject weak password', async () => {
    const weakPasswordData = { ...testUsers.customer, password: '123' };
    
    await expect(authService.signupCustomer(weakPasswordData))
      .rejects
      .toThrow('Password should be at least 6 characters');
  });
});

// Similar tests for Driver and Restaurant registration
```

#### A2. Login Tests
**Objective**: Verify role-based login validation works correctly

```javascript
describe('Role-Based Login', () => {
  beforeEach(async () => {
    // Create test users for all roles
    await authService.signupCustomer(testUsers.customer);
    await authService.signupDriver(testUsers.driver);
    await authService.signupRestaurant(testUsers.restaurant);
  });
  
  test('customer should login to customer app', async () => {
    const result = await authService.login(
      testUsers.customer.email,
      testUsers.customer.password,
      'customer'
    );
    
    expect(result.role).toBe('customer');
    expect(result.user.email).toBe(testUsers.customer.email);
  });
  
  test('customer should be blocked from driver app', async () => {
    await expect(authService.login(
      testUsers.customer.email,
      testUsers.customer.password,
      'driver'
    )).rejects.toThrow('This app is for drivers only');
  });
  
  test('driver should be blocked from restaurant app', async () => {
    await expect(authService.login(
      testUsers.driver.email,
      testUsers.driver.password,
      'restaurant'
    )).rejects.toThrow('This app is for restaurants only');
  });
});
```

### B. Firestore Security Rules Tests

#### B1. Collection Access Tests
**Objective**: Verify users can only access data they're authorized to see

```javascript
describe('Firestore Security Rules', () => {
  let customerUser, driverUser, restaurantUser;
  
  beforeEach(async () => {
    // Create and login test users
    customerUser = await authService.signupCustomer(testUsers.customer);
    driverUser = await authService.signupDriver(testUsers.driver);
    restaurantUser = await authService.signupRestaurant(testUsers.restaurant);
  });
  
  test('customer can read their own profile', async () => {
    // Login as customer
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    
    const customerDoc = await getDoc(doc(db, 'customers', customerUser.user.uid));
    expect(customerDoc.exists()).toBe(true);
  });
  
  test('customer cannot read other customer profiles', async () => {
    // Create another customer
    const otherCustomer = await authService.signupCustomer({
      ...testUsers.customer,
      email: 'other@test.com'
    });
    
    // Login as first customer
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    
    // Try to read other customer's profile
    await expect(getDoc(doc(db, 'customers', otherCustomer.user.uid)))
      .rejects
      .toMatchObject({ code: 'permission-denied' });
  });
  
  test('customer cannot access driver profiles', async () => {
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    
    await expect(getDoc(doc(db, 'drivers', driverUser.user.uid)))
      .rejects
      .toMatchObject({ code: 'permission-denied' });
  });
});
```

#### B2. Orders Collection Tests
**Objective**: Verify complex order access rules work correctly

```javascript
describe('Orders Collection Security', () => {
  let customerUser, driverUser, restaurantUser;
  let testOrder;
  
  beforeEach(async () => {
    // Setup users
    customerUser = await authService.signupCustomer(testUsers.customer);
    driverUser = await authService.signupDriver(testUsers.driver);
    restaurantUser = await authService.signupRestaurant(testUsers.restaurant);
    
    // Create test order
    testOrder = {
      customerId: customerUser.user.uid,
      restaurantOwnerId: restaurantUser.user.uid,
      status: 'PENDING',
      items: ['pizza', 'salad'],
      total: 25.99,
      createdAt: serverTimestamp()
    };
  });
  
  test('customer can create order for themselves', async () => {
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    
    const orderRef = doc(collection(db, 'orders'));
    await expect(setDoc(orderRef, testOrder)).resolves.not.toThrow();
  });
  
  test('customer cannot create order for other customers', async () => {
    const otherCustomer = await authService.signupCustomer({
      ...testUsers.customer,
      email: 'other@test.com'
    });
    
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    
    const invalidOrder = { ...testOrder, customerId: otherCustomer.user.uid };
    const orderRef = doc(collection(db, 'orders'));
    
    await expect(setDoc(orderRef, invalidOrder))
      .rejects
      .toMatchObject({ code: 'permission-denied' });
  });
  
  test('driver can read READY orders', async () => {
    // Create order as customer
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    const readyOrder = { ...testOrder, status: 'READY' };
    const orderRef = doc(collection(db, 'orders'));
    await setDoc(orderRef, readyOrder);
    
    // Switch to driver
    await authService.login(testUsers.driver.email, testUsers.driver.password);
    
    // Driver should be able to read READY order
    const orderDoc = await getDoc(orderRef);
    expect(orderDoc.exists()).toBe(true);
  });
  
  test('driver cannot read PENDING orders', async () => {
    // Create pending order as customer
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    const orderRef = doc(collection(db, 'orders'));
    await setDoc(orderRef, testOrder);
    
    // Switch to driver
    await authService.login(testUsers.driver.email, testUsers.driver.password);
    
    // Driver should not be able to read PENDING order
    await expect(getDoc(orderRef))
      .rejects
      .toMatchObject({ code: 'permission-denied' });
  });
});
```

### C. Error Handling Tests

#### C1. Authentication Error Tests
**Objective**: Verify error handling works correctly for auth scenarios

```javascript
describe('Authentication Error Handling', () => {
  test('should handle invalid login gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await expect(authService.login('invalid@test.com', 'wrongpassword'))
      .rejects
      .toThrow();
    
    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
  
  test('should handle network errors', async () => {
    // Mock network failure
    const mockError = { code: 'auth/network-request-failed' };
    jest.spyOn(authService, 'login').mockRejectedValue(mockError);
    
    await expect(authService.login('test@test.com', 'password'))
      .rejects
      .toMatchObject({ code: 'auth/network-request-failed' });
  });
});
```

#### C2. Role Validation Error Tests
**Objective**: Verify role validation errors are handled properly

```javascript
describe('Role Validation Error Handling', () => {
  test('should show appropriate error for wrong app access', async () => {
    await authService.signupCustomer(testUsers.customer);
    
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    try {
      await authService.login(
        testUsers.customer.email,
        testUsers.customer.password,
        'driver'
      );
    } catch (error) {
      // Error should be thrown and alert should be shown
      expect(alertSpy).toHaveBeenCalledWith(
        'Wrong App',
        expect.stringContaining('This app is for drivers only')
      );
    }
    
    alertSpy.mockRestore();
  });
});
```

### D. Migration Tests

#### D1. User Migration Tests
**Objective**: Verify migration service works correctly

```javascript
describe('User Migration', () => {
  test('should migrate existing user to driver role', async () => {
    // Create user without role (simulating existing user)
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'existing@test.com',
      'password123'
    );
    
    // Migrate user
    const result = await migrationService.migrateSingleUser(
      userCredential.user.uid,
      'existing@test.com',
      'driver',
      {
        name: 'Migrated Driver',
        phone: '+1-555-0003',
        license: 'ML123456',
        vehicleInfo: {
          make: 'Honda',
          model: 'Civic',
          year: '2019',
          color: 'Red',
          licensePlate: 'MIG123'
        }
      }
    );
    
    expect(result.success).toBe(true);
    expect(result.migrated).toBe(true);
    
    // Verify documents were created
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    const driverDoc = await getDoc(doc(db, 'drivers', userCredential.user.uid));
    
    expect(userDoc.exists()).toBe(true);
    expect(driverDoc.exists()).toBe(true);
    expect(userDoc.data().role).toBe('driver');
    expect(userDoc.data().isMigrated).toBe(true);
  });
  
  test('should skip already migrated users', async () => {
    const existingUser = await authService.signupDriver(testUsers.driver);
    
    const result = await migrationService.migrateSingleUser(
      existingUser.user.uid,
      testUsers.driver.email,
      'driver'
    );
    
    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
  });
});
```

### E. Performance Tests

#### E1. Rule Performance Tests
**Objective**: Verify security rules don't cause performance issues

```javascript
describe('Performance Tests', () => {
  test('should execute rules within acceptable time', async () => {
    await authService.signupCustomer(testUsers.customer);
    await authService.login(testUsers.customer.email, testUsers.customer.password);
    
    const startTime = Date.now();
    
    // Perform multiple data access operations
    const promises = Array(10).fill().map(async (_, i) => {
      const customerDoc = await getDoc(doc(db, 'customers', customerUser.user.uid));
      return customerDoc.exists();
    });
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 2 seconds
    expect(duration).toBeLessThan(2000);
  });
});
```

## Test Execution

### Manual Testing Checklist

#### Pre-Test Setup
- [ ] Deploy code to test environment
- [ ] Deploy Firestore rules to test project
- [ ] Configure test Firebase project
- [ ] Create test user accounts

#### Authentication Flow Testing
- [ ] Test customer registration in customer app
- [ ] Test driver registration in driver app  
- [ ] Test restaurant registration in restaurant app
- [ ] Test login with correct role in each app
- [ ] Test login with wrong role (should be blocked)
- [ ] Test password reset functionality
- [ ] Test remember me functionality
- [ ] Test logout functionality

#### Data Access Testing
- [ ] Customer can access own data
- [ ] Customer cannot access other user data
- [ ] Driver can access available orders
- [ ] Driver cannot access customer profiles
- [ ] Restaurant can access own restaurant data
- [ ] Restaurant can access own orders
- [ ] Cross-role data access is blocked

#### Error Scenarios Testing
- [ ] Invalid email format
- [ ] Weak password
- [ ] Network disconnection
- [ ] Wrong app access attempt
- [ ] Permission denied scenarios
- [ ] Server unavailable scenarios

#### Migration Testing
- [ ] Migrate test users to different roles
- [ ] Verify migrated users can login
- [ ] Verify migrated users have correct permissions
- [ ] Test batch migration performance
- [ ] Test migration rollback

### Automated Test Execution

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "Authentication"
npm test -- --grep "Firestore Security"
npm test -- --grep "Migration"

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode during development
npm test -- --watch
```

### Test Data Cleanup

```javascript
// Clean up test data after tests
afterEach(async () => {
  // Delete test users
  await cleanupTestUsers();
  
  // Clean up test documents
  await cleanupTestDocuments();
});

async function cleanupTestUsers() {
  // Use Firebase Admin SDK to delete test users
  const testEmails = [
    'customer@test.com',
    'driver@test.com',
    'restaurant@test.com'
  ];
  
  for (const email of testEmails) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(user.uid);
    } catch (error) {
      // User might not exist, ignore
    }
  }
}
```

## Test Reports

### Test Coverage Requirements
- Authentication functions: 100%
- Security rules: 100%
- Error handling: 95%
- Migration functions: 100%
- UI components: 80%

### Performance Benchmarks
- Authentication operations: < 1 second
- Data access operations: < 500ms
- Rule evaluation: < 100ms
- Migration operations: < 2 seconds per user

### Security Test Results
- [ ] No unauthorized data access possible
- [ ] All role validations working
- [ ] All error scenarios handled
- [ ] No security rule bypasses found

## Troubleshooting

### Common Test Issues

#### Issue: Rules not taking effect
**Solution**: Ensure rules are deployed to test project
```bash
firebase deploy --only firestore:rules --project your-test-project
```

#### Issue: Tests failing due to async operations
**Solution**: Ensure proper async/await usage and timeouts
```javascript
test('async operation', async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  // ... test code
}, 10000); // 10 second timeout
```

#### Issue: Permission denied errors in tests
**Solution**: Verify test user has correct authentication
```javascript
// Ensure user is properly authenticated before testing
await authService.login(testUser.email, testUser.password);
```

### Test Environment Issues

#### Issue: Firebase emulator not starting
**Solution**: 
```bash
# Install emulator
firebase setup:emulators:firestore

# Start emulator
firebase emulators:start --only firestore
```

#### Issue: Test data persistence
**Solution**: Use emulator with clean state for each test
```javascript
beforeEach(async () => {
  await clearFirestoreData();
});
```

## Continuous Integration

### CI/CD Pipeline Integration

```yaml
# .github/workflows/test.yml
name: Test Firebase Security
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start Firebase emulators
        run: firebase emulators:start --only firestore &
        
      - name: Run tests
        run: npm test
        
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

### Quality Gates
- All tests must pass
- Coverage must be > 90%
- No critical security issues
- Performance benchmarks met

Remember: Testing is crucial for ensuring your security implementation works correctly and doesn't break existing functionality. Take time to thoroughly test all scenarios before deploying to production.