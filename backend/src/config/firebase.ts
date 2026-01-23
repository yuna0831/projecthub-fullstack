import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('🔥 Firebase Admin Initialized');
} catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
}

export default admin;
