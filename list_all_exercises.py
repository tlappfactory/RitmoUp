import re

mock_file = r'c:\RitmoUp\mockData.ts'

with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to find id, name, imageUrl
#   {
#     id: '2092',
#     name: 'Remada Cavalinho (Barra T)',
#     ...
#     imageUrl: '...'
#   },

# pattern = r"id:\s*'([^']+)',\s*name:\s*'([^']+)',.*?imageUrl:\s*'([^']+)'"
# The structure might span multiple lines, so we need DOTALL and be careful.
# A more robust way is to find each object block.

print(f"File size: {len(content)}")

# Let's iterate through matches
# We assume standard formatting: id: '...', name: '...', ... imageUrl: '...'
pattern = r"id:\s*'([^']+)',\s*name:\s*(['\"])(.*?)\2"
matches = re.finditer(pattern, content, re.DOTALL)

exercises = []
for m in matches:
    eid = m.group(1)
    quote = m.group(2)
    name = m.group(3)
    
    # Try to find the image url in the vicinity
    # search forward from this match until next "id:" or "};"
    start_pos = m.end()
    # rough heuristic: look in next 500 chars
    chunk = content[start_pos:start_pos+1000]
    
    img_match = re.search(r"imageUrl:\s*(['\"])(.*?)\1", chunk)
    img_url = img_match.group(2) if img_match else "NO_IMAGE"
    
    exercises.append({
        "id": eid,
        "name": name,
        "imageUrl": img_url
    })

print(f"Found {len(exercises)} exercises.")

targets = ["Butt Kicks", "Calcanhar", "Farmer", "Fazendeiro", "Mesa Flexora", "Remada Cavalinho", "Tríceps Corda", "Triceps Corda"]

print("\n--- POTENTIAL DUPLICATES ---")
for ex in exercises:
    for t in targets:
        if t.lower() in ex['name'].lower():
            print(f"ID: {ex['id']} | Name: {ex['name']} | Img: {ex['imageUrl']}")
            break
