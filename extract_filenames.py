
import re

src_file = r'c:\RitmoUp\mockData.ts'

with open(src_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Regex to find id, name, and imageUrl
exercises = re.findall(r"id:\s*'(\d+)',\s*name:\s*'([^']+)',.*?imageUrl:\s*'([^']+)'", content, re.DOTALL)

print("Expected Filenames for New Exercises (ID >= 2000):")
print("------------------------------------------------")

count = 0
for eid, name, url in exercises:
    if int(eid) >= 2000:
        # Extract filename from URL
        filename = url.split('/')[-1]
        print(f"{filename}  (for: {name})")
        count += 1
print(f"\nTotal: {count}")
