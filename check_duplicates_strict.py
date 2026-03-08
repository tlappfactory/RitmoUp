import re
from collections import Counter

file_path = r"c:\Users\leofe\OneDrive\Documentos\RitmoUp\RitmoUp\mockData.ts"

def analyze_exercises(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find name and id. 
    # Assumes format: { id: '...', name: '...', ... }
    # This is a heuristic parser for the TS file.
    
    # Extract the exerciseCatalog array content roughly
    match = re.search(r'export const exerciseCatalog: Exercise\[\] = \[(.*?)\];', content, re.DOTALL)
    if not match:
        print("Could not find exerciseCatalog array.")
        return

    catalog_content = match.group(1)
    
    # Find all objects
    # We'll search for id: '...' and name: '...' pattern
    
    # Using specific regex for properties to handle potential variations
    ids = re.findall(r"id:\s*['\"](.*?)['\"]", catalog_content)
    names = re.findall(r"name:\s*['\"](.*?)['\"]", catalog_content)

    print(f"Found {len(ids)} IDs and {len(names)} Names.")

    if len(ids) != len(names):
        print("WARNING: Mismatch in count of IDs and Names. Parsing might be inaccurate.")
    
    # Check for ID duplicates
    id_counts = Counter(ids)
    dup_ids = [id for id, count in id_counts.items() if count > 1]
    
    # Check for Name duplicates (case insensitive)
    normalized_names = [n.strip().lower() for n in names]
    name_counts = Counter(normalized_names)
    dup_names = [name for name, count in name_counts.items() if count > 1]

    print("\n--- DUPLICATE ANALYSIS ---")
    
    if dup_ids:
        print(f"Duplicate IDs Found ({len(dup_ids)}):")
        for i in dup_ids:
            print(f"- {i}")
    else:
        print("No duplicate IDs found.")

    if dup_names:
        print(f"Duplicate Names Found ({len(dup_names)}):")
        for n in dup_names:
            print(f"- '{n}' (appearing {name_counts[n]} times)")
    else:
        print("No duplicate Names found.")
        
    # Check for specific ones user mentioned
    user_examples = ["elevação lateral", "burpee", "corrida na esteira", "cadeira flexora"]
    print("\n--- CHECKING USER EXAMPLES ---")
    for ex in user_examples:
        found = [n for n in normalized_names if ex in n]
        print(f"Matches for '{ex}': {found}")

analyze_exercises(file_path)
