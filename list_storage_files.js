import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from 'fs';
import admin from 'firebase-admin';

// Initialize Firebase Admin
// Try to load service account
let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json');
} catch (e) {
    console.error("No serviceAccountKey.json found. Cannot authenticate.");
    process.exit(1);
}

// Check if app already initialized
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'ritmoup-b432b.firebasestorage.app'
    });
}

const bucket = admin.storage().bucket();

async function listFiles() {
    try {
        console.log("Listing files in 'exercises/' directory...");
        // getFiles returns [File[]]
        const [files] = await bucket.getFiles({ prefix: 'exercises/' });

        console.log(`Found ${files.length} files.`);

        const fileList = files.map(file => file.name);

        // Write to a local file for analysis
        fs.writeFileSync('storage_files_list.txt', fileList.join('\n'));
        console.log("File list written to 'storage_files_list.txt'");

        // Optional: Print first 10 and last 10
        console.log("first 5:", fileList.slice(0, 5));

    } catch (error) {
        console.error("Error listing files:", error);
    }
}

listFiles();
