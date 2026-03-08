import re
import os

mock_file = r'c:\RitmoUp\mockData.ts'
out_file = r'c:\RitmoUp\duplicates.txt'

with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.finditer(r"id:\s*'([^']+)',\s*name:\s*(['\"])(.*?)\2", content, re.DOTALL)

exercises = []
for m in matches:
    eid = m.group(1)
    name = m.group(3)
    start_pos = m.end()
    # Search in next 500 chars for imageUrl
    chunk = content[start_pos:start_pos+1000]
    img_match = re.search(r"imageUrl:\s*(['\"])(.*?)\1", chunk)
    img_url = img_match.group(2) if img_match else "NO_IMAGE"
    
    exercises.append({
        "id": eid,
        "name": name,
        "imageUrl": img_url
    })

targets = [
    "butt kicks", "calcanhar", 
    "farmer", "fazendeiro",
    "mesa flexora", 
    "remada cavalinho", 
    "tríceps corda", "triceps corda"
]

with open(out_file, 'w', encoding='utf-8') as f:
    f.write(f"Total exercises found: {len(exercises)}\n")
    f.write("--- CANDIDATES FOR DELETION/KEEPING ---\n")

    for ex in exercises:
        n = ex['name'].lower()
        for t in targets:
            if t in n:
                f.write(f"ID: {ex['id']} | Name: {ex['name']}\n")
                f.write(f"    URL: {ex['imageUrl']}\n")
                f.write("-" * 20 + "\n")
                break
print("Done writing to duplicates.txt")
