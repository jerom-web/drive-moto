// src/services/errorHandler.js
import { Alert } from 'react-native';

class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.isLoggingEnabled = __DEV__; // Enable logging in development
  }

  // Log errors for debugging
  log(error, context = 'Unknown', userId = null) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context,
      userId,
      userAgent: navigator?.userAgent || 'React Native'
    };

    this.errorLog.push(errorEntry);

    if (this.isLoggingEnabled) {
      console.error(`[ERROR ${context}]`, error);
    }

    // In production, you might want to send to analytics service
    // this.sendToAnalytics(errorEntry);
  }

  // Handle Firebase Authentication errors
  handleAuthError(error, context = 'Authentication') {
    this.log(error, context);

    let userMessage = 'An unexpected error occurred. Please try again.';
    let title = 'Authentication Error';

    switch (error.code) {
      case 'auth/user-not-found':
        title = 'Account Not Found';
        userMessage = 'No account found with this email address. Please check your email or create a new account.';
        break;

      case 'auth/wrong-password':
        title = 'Incorrect Password';
        userMessage = 'The password you entered is incorrect. Please try again.';
        break;

      case 'auth/email-already-in-use':
        title = 'Email In Use';
        userMessage = 'An account with this email already exists. Please use a different email or try logging in.';
        break;

      case 'auth/weak-password':
        title = 'Weak Password';
        userMessage = 'Password should be at least 6 characters long and include a mix of letters and numbers.';
        break;

      case 'auth/invalid-email':
        title = 'Invalid Email';
        userMessage = 'Please enter a valid email address.';
        break;

      case 'auth/too-many-requests':
        title = 'Too Many Attempts';
        userMessage = 'Too many failed login attempts. Please wait a few minutes before trying again.';
        break;

      case 'auth/network-request-failed':
        title = 'Network Error';
        userMessage = 'Please check your internet connection and try again.';
        break;

      case 'auth/user-disabled':
        title = 'Account Disabled';
        userMessage = 'This account has been disabled. Please contact support for assistance.';
        break;

      case 'auth/operation-not-allowed':
        title = 'Operation Not Allowed';
        userMessage = 'This sign-in method is not enabled. Please contact support.';
        break;

      case 'auth/requires-recent-login':
        title = 'Re-authentication Required';
        userMessage = 'For security reasons, please log out and log back in to perform this action.';
        break;

      default:
        if (error.message.includes('Access denied')) {
          title = 'Access Denied';
          userMessage = error.message;
        } else if (error.message.includes('role')) {
          title = 'Account Type Error';
          userMessage = error.message;
        }
        break;
    }

    Alert.alert(title, userMessage);
    return { title, userMessage };
  }

  // Handle Firestore permission errors
  handleFirestoreError(error, context = 'Database') {
    this.log(error, context);

    let userMessage = 'Unable to access data. Please try again.';
    let title = 'Data Access Error';

    if (error.code === 'permission-denied') {
      title = 'Access Denied';
      userMessage = 'You don\'t have permission to access this data. Please make sure you\'re logged in with the correct account type.';
    } else if (error.code === 'unavailable') {
      title = 'Service Unavailable';
      userMessage = 'The service is temporarily unavailable. Please try again in a few moments.';
    } else if (error.code === 'not-found') {
      title = 'Data Not Found';
      userMessage = 'The requested data could not be found.';
    } else if (error.code === 'cancelled') {
      // Usually not shown to user as it's intentional
      return null;
    } else if (error.code === 'deadline-exceeded') {
      title = 'Request Timeout';
      userMessage = 'The request took too long. Please check your connection and try again.';
    }

    Alert.alert(title, userMessage);
    return { title, userMessage };
  }

  // Handle role-based access errors
  handleRoleError(userRole, expectedRole, context = 'Role Validation') {
    const error = new Error(`Access denied. Expected role: ${expectedRole}, actual role: ${userRole}`);
    this.log(error, context);

    const roleNames = {
      customer: 'Customer',
      driver: 'Driver',
      restaurant: 'Restaurant'
    };

    const title = 'Wrong App';
    const userMessage = `This app is for ${roleNames[expectedRole] || expectedRole}s only. You are logged in as a ${roleNames[userRole] || userRole}. Please use the correct app for your account type.`;

    Alert.alert(title, userMessage, [
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          // This should trigger logout
          // You can pass a callback here or emit an event
        }
      },
      {
        text: 'OK',
        style: 'cancel'
      }
    ]);

    return { title, userMessage };
  }

  // Handle network errors
  handleNetworkError(error, context = 'Network') {
    this.log(error, context);

    Alert.alert(
      'Connection Error',
      'Please check your internet connection and try again.',
      [{ text: 'OK' }]
    );
  }

  // Handle validation errors
  handleValidationError(field, message, context = 'Validation') {
    const error = new Error(`Validation failed for ${field}: ${message}`);
    this.log(error, context);

    Alert.alert('Validation Error', message);
    return { field, message };
  }

  // Handle migration errors
  handleMigrationError(error, userId = null, context = 'Migration') {
    this.log(error, context, userId);

    Alert.alert(
      'Account Setup Required',
      'We need to update your account. Please contact support if this issue persists.',
      [{ text: 'OK' }]
    );
  }

  // Handle general errors with retry option
  handleErrorWithRetry(error, retryCallback, context = 'General') {
    this.log(error, context);

    Alert.alert(
      'Something went wrong',
      'Would you like to try again?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Retry',
          onPress: retryCallback
        }
      ]
    );
  }

  // Show success messages
  showSuccess(title, message) {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }

  // Show warning messages
  showWarning(title, message, onConfirm = null) {
    const buttons = [{ text: 'Cancel', style: 'cancel' }];
    
    if (onConfirm) {
      buttons.push({
        text: 'Continue',
        onPress: onConfirm
      });
    } else {
      buttons.push({ text: 'OK' });
    }

    Alert.alert(title, message, buttons);
  }

  // Show critical errors that require app restart
  showCriticalError(error, context = 'Critical') {
    this.log(error, context);

    Alert.alert(
      'Critical Error',
      'The app encountered a critical error. Please restart the app.',
      [
        {
          text: 'Restart App',
          onPress: () => {
            // In React Native, you might use a library like react-native-restart
            // or handle this at the app level
          }
        }
      ],
      { cancelable: false }
    );
  }

  // Get error logs for debugging
  getErrorLogs() {
    return this.errorLog;
  }

  // Clear error logs
  clearLogs() {
    this.errorLog = [];
  }

  // Enable/disable logging
  setLogging(enabled) {
    this.isLoggingEnabled = enabled;
  }

  // Send errors to external service (placeholder)
  async sendToAnalytics(errorEntry) {
    try {
      // Example: Send to Firebase Analytics, Crashlytics, or custom service
      // await analytics().logEvent('app_error', {
      //   error_message: errorEntry.error.message,
      //   error_code: errorEntry.error.code,
      //   context: errorEntry.context,
      //   user_id: errorEntry.userId
      // });
    } catch (analyticsError) {
      console.warn('Failed to send error to analytics:', analyticsError);
    }
  }

  // Format error for display
  formatError(error) {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }

  // Check if error is retryable
  isRetryableError(error) {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'network-request-failed',
      'timeout'
    ];
    
    return retryableCodes.includes(error.code);
  }
}

// Export singleton instance
export default new ErrorHandler();

// Utility functions for common error scenarios
export const errorUtils = {
  // Wrapper for async operations with error handling
  async withErrorHandling(operation, context = 'Operation', showAlert = true) {
    try {
      return await operation();
    } catch (error) {
      if (showAlert) {
        if (error.code && error.code.startsWith('auth/')) {
          ErrorHandler.handleAuthError(error, context);
        } else if (error.code && (error.code === 'permission-denied' || error.code.startsWith('firestore/'))) {
          ErrorHandler.handleFirestoreError(error, context);
        } else {
          ErrorHandler.handleAuthError(error, context);
        }
      } else {
        ErrorHandler.log(error, context);
      }
      throw error;
    }
  },

  // Retry logic for operations
  async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !ErrorHandler.isRetryableError(error)) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError;
  }
};