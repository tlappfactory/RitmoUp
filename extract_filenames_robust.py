
import re

src_file = r'c:\RitmoUp\mockData.ts'

with open(src_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Get all IDs >= 2000
ids_names = re.findall(r"id:\s*'(\d+)',\s*name:\s*'([^']+)'", content)
new_exercises = {eid: name for eid, name in ids_names if int(eid) >= 2000}

print(f"Total new exercises found by ID: {len(new_exercises)}")

# 2. Extract image URLs for those IDs
# We'll parse object by object to be safer
objects = content.split('},')
count_with_image = 0
projected_filenames = []

for obj in objects:
    id_match = re.search(r"id:\s*'(\d+)'", obj)
    if id_match:
        eid = id_match.group(1)
        if int(eid) >= 2000:
            url_match = re.search(r"imageUrl:\s*'([^']+)'", obj)
            if url_match:
                url = url_match.group(1)
                filename = url.split('/')[-1]
                # Remove query params if any (though my data shouldn't have them for new ones)
                if '?' in filename:
                    filename = filename.split('?')[0]
                
                projected_filenames.append(f"- {filename}  (Exercise: {new_exercises[eid]})")
                count_with_image += 1
            else:
                print(f"WARNING: No image URL found for ID {eid} ({new_exercises[eid]})")

print(f"Total exercises with images extracted: {count_with_image}")
print("\n--- Filenames List ---")
for f in projected_filenames:
    print(f)
