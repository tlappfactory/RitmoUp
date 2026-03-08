import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

def update_firestore():
    if not os.path.exists('url_mapping.json'):
        print("url_mapping.json not found. Run migrate_images.py first.")
        return

    cred = credentials.Certificate('serviceAccountKey.json')
    # Check if app is already initialized to avoid error if this script is imported
    try:
        app = firebase_admin.get_app()
    except ValueError:
        app = firebase_admin.initialize_app(cred)
        
    db = firestore.client()

    with open('url_mapping.json', 'r') as f:
        mapping = json.load(f)

    print("Reading exercises from Firestore...")
    docs = db.collection('exercises').stream()
    
    batch = db.batch()
    count = 0
    updated_count = 0
    
    for doc in docs:
        data = doc.to_dict()
        image_url = data.get('imageUrl')
        
        # Check if the current imageUrl matches one of our local paths
        # The mapping keys are like "/images/exercises/foo.png"
        if image_url and image_url in mapping:
            new_url = mapping[image_url]
            # Add to batch
            batch.update(doc.reference, {'imageUrl': new_url})
            count += 1
            updated_count += 1
            # print(f"Updating {doc.id}: {image_url} -> URL")

        # Batch limit is 500
        if count >= 400:
            batch.commit()
            batch = db.batch()
            count = 0
            print("Committed batch.")

    if count > 0:
        batch.commit()
        print("Committed final batch.")
        
    print(f"Finished. Updated {updated_count} documents in Firestore.")

if __name__ == '__main__':
    update_firestore()
