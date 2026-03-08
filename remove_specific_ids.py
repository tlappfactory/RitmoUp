import re

mock_file = r'c:\RitmoUp\mockData.ts'
ids_to_remove = ['2088', '2089', '2029', '2052', '2011']

with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to remove the whole block for these IDs.
# Regex:
# \s*{\s*id:\s*'ID',.*?},?
# We handle potential trailing comma and whitespace.

replacement_count = 0

for eid in ids_to_remove:
    # Pattern to match the object block containing this specific ID
    # We look for { ... id: 'eid', ... }
    # This is tricky with regex because keys can be in any order, but usually id is first.
    # Based on the file structure, id seems to be the first key.
    
    # Try finding: { \n \s* id: 'eid', ... }
    pattern = r"\s*\{\s*id:\s*'" + eid + r"',.*?\},?"
    
    # Check if it exists first
    if re.search(pattern, content, re.DOTALL):
        # Remove it
        content = re.sub(pattern, "", content, count=1, flags=re.DOTALL)
        replacement_count += 1
        print(f"Removed ID: {eid}")
    else:
        print(f"wARNING: Could not find block for ID: {eid}")

# Clean up potential double commas or empty lines if needed, but the regex included the trailing comma
# verifying structure stability is key.

with open(mock_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Total removed: {replacement_count}")
