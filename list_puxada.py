import re

mock_file = r'c:\RitmoUp\mockData.ts'

with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Simple string search first
if "uxada" in content:
    print("Found 'uxada' in content.")
else:
    print("Did NOT find 'uxada' in content.")

# Regex search
pattern = r"id:\s*'([^']+)',\s*name:\s*['\"]([^'\"]*uxada[^'\"]*)['\"]"
matches = re.finditer(pattern, content, re.IGNORECASE)

for m in matches:
    print(f"ID: {m.group(1)} | Name: {m.group(2)}")
    
    # Context
    start = m.end()
    chunk = content[start:start+500]
    img = re.search(r"imageUrl:\s*['\"]([^'\"]+)['\"]", chunk)
    if img:
        print(f"Image: {img.group(1)}")
