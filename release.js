import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load firebase-admin from local functions if possible
let admin;
try {
    admin = require('firebase-admin');
} catch (e) {
    try {
        admin = require('./functions/node_modules/firebase-admin');
    } catch (e2) {
        console.error('\x1b[31m%s\x1b[0m', 'Error: firebase-admin not found.');
        console.error('Please run "npm install firebase-admin" in the root directory or "cd functions && npm install" first.');
        process.exit(1);
    }
}

const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const PACKAGE_JSON_PATH = path.join(__dirname, 'package.json');
const BUILD_GRADLE_PATH = path.join(__dirname, 'android', 'app', 'build.gradle');

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
    console.log('\x1b[36m%s\x1b[0m', '🚀  RitmoUp Release Automation  🚀');

    // 1. Read Current Version
    const packageJson = require(PACKAGE_JSON_PATH);
    const currentVersion = packageJson.version;
    console.log(`Current Package Version: \x1b[33m${currentVersion}\x1b[0m`);

    // 2. Ask for New Version
    const newVersion = await askQuestion(`Enter new version (current: ${currentVersion}): `);
    let targetVersion = newVersion.trim();

    if (!targetVersion) {
        // Default logic: increment patch
        const parts = currentVersion.split('.').map(Number);
        parts[2]++;
        targetVersion = parts.join('.');
    }

    console.log(`Target Version: \x1b[32m${targetVersion}\x1b[0m`);

    // 3. Update package.json
    packageJson.version = targetVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`✅ Updated package.json`);

    // 4. Update build.gradle
    if (fs.existsSync(BUILD_GRADLE_PATH)) {
        let gradleContent = fs.readFileSync(BUILD_GRADLE_PATH, 'utf8');

        // Update versionCode (increment)
        const versionCodeRegex = /versionCode\s+(\d+)/;
        const codeMatch = gradleContent.match(versionCodeRegex);
        if (codeMatch) {
            const currentCode = parseInt(codeMatch[1]);
            const newCode = currentCode + 1;
            gradleContent = gradleContent.replace(versionCodeRegex, `versionCode ${newCode}`);
            console.log(`✅ Incremented versionCode to ${newCode}`);
        } else {
            console.log(`⚠️  Could not find versionCode in build.gradle`);
        }

        // Update versionName
        const versionNameRegex = /versionName\s+"[^"]+"/;
        gradleContent = gradleContent.replace(versionNameRegex, `versionName "${targetVersion}"`);
        console.log(`✅ Updated versionName to "${targetVersion}"`);

        fs.writeFileSync(BUILD_GRADLE_PATH, gradleContent);
    } else {
        console.log(`⚠️  android/app/build.gradle not found. Skipping Android update.`);
    }

    // 5. Update Firestore
    console.log(`⏳ Updating Firestore system/config...`);
    try {
        await db.collection('system').doc('config').set({
            latest_version: targetVersion,
        }, { merge: true });
        console.log(`✅ Firestore updated successfully!`);
        console.log(`   latest_version: ${targetVersion}`);
    } catch (error) {
        console.error(`❌ Error updating Firestore:`, error);
    }

    console.log('\n\x1b[32m%s\x1b[0m', '✨  Release Prep Complete!  ✨');
    rl.close();
    process.exit(0);
}

main();
