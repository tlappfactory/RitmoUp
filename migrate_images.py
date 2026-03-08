import os
import firebase_admin
from firebase_admin import credentials, storage
import json

# Setup
# IMPORTANT: This requires a service account key file to be present.
# Since we don't have one explicitly mentioned, we'll try to use the google-services.json creds
# OR relies on the user being logged in via 'gcloud auth application-default login'
# However, usually admin sdk needs a service account JSON.
# If we cannot bypass auth, we might need to ask the user to provide a service account key or use the client SDK in node.
# Let's try to assume we can run this environment where user has credentials.

# Actually, to make it easier for the user without asking for a service account key causing friction,
# we can use a Python script that uploads to public storage if it's open, OR better:
# We can use the firebase-admin with a service account if available.
# But often developers have 'firebase-tools' installed.
# Alternatives:
# 1. Ask user for 'serviceAccountKey.json'.
# 2. Use 'firebase-tools' via subprocess (slow for many files).
# 3. Use a Node script with the CLIENT SDK (already configured in the app) and login via browser? No, client sdk in node needs polyfills.

# Best bet: Ask user if they have a service account key or if they can run 'firebase login:ci' to get a token?
# Let's try to simulate a client upload using a script that mimics the app logic? No, too complex.

# Let's assume the user has access to generate a private key or we use the 'firebase-admin' mock if they have ADC setup.
cred = credentials.Certificate('serviceAccountKey.json') if os.path.exists('serviceAccountKey.json') else None

# If no creds found, we'll print a warning and exit.
if not cred:
    print("Error: 'serviceAccountKey.json' not found. Please download it from Firebase Console > Project Settings > Service Accounts and place it in the root folder.")
    exit(1)

app = firebase_admin.initialize_app(cred, {
    'storageBucket': 'ritmoup-b432b.firebasestorage.app' # from google-services.json
})

bucket = storage.bucket()

IMAGES_DIR = 'public/images/exercises'
URL_MAPPING_FILE = 'url_mapping.json'

def migrate():
    url_mapping = {}
    
    # Get list of files
    files = []
    for root, dirs, filenames in os.walk(IMAGES_DIR):
        for filename in filenames:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                files.append(os.path.join(root, filename))
    
    print(f"Found {len(files)} images to migrate.")
    
    for filepath in files:
        filename = os.path.basename(filepath)
        blob_path = f"exercises/{filename}"
        blob = bucket.blob(blob_path)
        
        print(f"Uploading {filename}...")
        
        # Check if exists (optional optimization, skip if needed)
        # if blob.exists(): ...
        
        blob.upload_from_filename(filepath)
        blob.make_public()
        
        url_mapping[f"/images/exercises/{filename}"] = blob.public_url
        print(f"Uploaded: {blob.public_url}")

    with open(URL_MAPPING_FILE, 'w') as f:
        json.dump(url_mapping, f, indent=2)
        
    print(f"Migration complete. Mapping saved to {URL_MAPPING_FILE}")

if __name__ == '__main__':
    migrate()
