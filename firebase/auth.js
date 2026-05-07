import { auth } from './config';
import { createUserWithEmailAndPassword } from 'firebase/auth';

/**
 * Create multiple user accounts with Firebase Auth
 * @param {Array} employees - Array of employee objects with email, displayName, role
 * @param {string} defaultPassword - Default password for all accounts
 * @returns {Promise<{successful: Array, failed: Array}>}
 */
export const batchCreateAccounts = async (employees, defaultPassword = 'GIA2026') => {
  const successful = [];
  const failed = [];

  for (const employee of employees) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        employee.email,
        defaultPassword
      );

      successful.push({
        uid: userCredential.user.uid,
        email: employee.email,
        displayName: employee.displayName,
        role: employee.role,
        employeeId: employee.employeeId,
        department: employee.department,
      });
    } catch (error) {
      failed.push({
        email: employee.email,
        displayName: employee.displayName,
        error: error.code === 'auth/email-already-in-use'
          ? 'Email already exists'
          : error.message,
      });
    }
  }

  return { successful, failed };
};
