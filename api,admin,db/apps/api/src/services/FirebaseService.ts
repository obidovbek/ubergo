/**
 * Firebase Admin Service
 * Initializes and manages Firebase Admin SDK
 */

import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to Firebase Admin service account JSON
const serviceAccountPath = join(__dirname, '../../ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json');

let initialized = false;
let initializationError: Error | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase(): void {
  if (initialized) {
    console.log('🔥 Firebase Admin already initialized');
    return;
  }

  try {
    // Check if running from compiled code (dist folder) or source
    const isCompiled = __dirname.includes('dist');
    const path = isCompiled 
      ? join(__dirname, '../ubexgo-ae910-firebase-adminsdk-fbsvc-b50ff8034e.json')
      : serviceAccountPath;

    console.log('🔥 Initializing Firebase Admin SDK from:', path);

    // Check if file exists
    if (!existsSync(path)) {
      throw new Error(`Service account file not found at: ${path}`);
    }

    // Read and parse service account JSON
    const serviceAccount = JSON.parse(readFileSync(path, 'utf8'));
    
    console.log('🔥 Service account loaded:', {
      project_id: serviceAccount.project_id,
      client_email: serviceAccount.client_email
    });

    // Initialize with service account object with explicit HTTP agent settings
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add timeout and retry settings
      httpAgent: undefined, // Let Firebase use default Node.js HTTP agent
    });

    initialized = true;
    initializationError = null;
    console.log('✅ Firebase Admin SDK initialized successfully for project:', serviceAccount.project_id);
  } catch (error: any) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.error('   Stack:', error.stack);
    initializationError = error;
    // Don't throw, allow app to continue without Firebase
    initialized = false;
  }
}

/**
 * Get Firebase Admin instance
 */
export function getFirebaseAdmin(): typeof admin {
  if (!initialized) {
    initializeFirebase();
  }
  return admin;
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return initialized;
}

/**
 * Get initialization error if any
 */
export function getInitializationError(): Error | null {
  return initializationError;
}

export default admin;

