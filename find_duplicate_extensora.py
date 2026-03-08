import re

mock_file = r'c:\RitmoUp\mockData.ts'

print(f"Scanning {mock_file} for 'Extensora'...")

try:
    with open(mock_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to capture ID and Name around the keyword
    # We look for the entire object block or just the name/id lines
    # Pattern: id: '...', name: '...Extensora...' (multiline)
    
    # Let's just find "name: ...Extensora..." and then look backwards/forwards for ID
    
    # Or iterate through all matches of "Extensora"
    matches = [m.start() for m in re.finditer('Extensora', content, re.IGNORECASE)]
    
    print(f"Found {len(matches)} matches for 'Extensora'.")
    
    for pos in matches:
        # Grab a chunk around the match
        start_chunk = max(0, pos - 200)
        end_chunk = min(len(content), pos + 200)
        chunk = content[start_chunk:end_chunk]
        
        # Try to find ID in this chunk
        # Look for "id: 'XYZ'"
        id_match = re.search(r"id:\s*'([^']+)'", chunk)
        name_match = re.search(r"name:\s*'([^']+)'", chunk)
        
        ex_id = id_match.group(1) if id_match else "UNKNOWN"
        ex_name = name_match.group(1) if name_match else "UNKNOWN"
        
        print(f"Match at {pos}: ID={ex_id}, Name={ex_name}")

except Exception as e:
    print(f"Error: {e}")
