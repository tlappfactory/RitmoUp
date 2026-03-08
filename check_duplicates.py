
import re
import collections

def find_duplicates():
    with open('mockData.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find exerciseCatalog
    start_marker = "export const exerciseCatalog: Exercise[] = ["
    try:
        start_index = content.index(start_marker)
    except ValueError:
        print("Could not find exerciseCatalog")
        return

    # Extract the array content
    array_content = content[start_index:]
    # Simple heuristic to find end of array which is usually ];
    # But since it's at the end of file, we can just parse until the end or match brackets.
    # We'll just regex for id: '...' and name: '...' inside this block.
    
    # Let's find all objects { ... } roughly
    # Or just find all id: '...' and name: '...' matches and their indices
    
    pattern_id = re.compile(r"id:\s*'([^']+)'")
    pattern_name = re.compile(r"name:\s*'([^']+)'")
    
    ids = []
    names = []
    
    lines = array_content.split('\n')
    for i, line in enumerate(lines):
        id_match = pattern_id.search(line)
        if id_match:
            ids.append((id_match.group(1), i))
            
        name_match = pattern_name.search(line)
        if name_match:
            names.append((name_match.group(1), i))

    # Check for duplicates
    id_counts = collections.Counter([x[0] for x in ids])
    name_counts = collections.Counter([x[0] for x in names])

    print("Duplicate IDs:")
    for id_val, count in id_counts.items():
        if count > 1:
            print(f"ID: {id_val}, Count: {count}")
            # Print line numbers
            print(f"Found at relative lines: {[x[1] for x in ids if x[0] == id_val]}")

    print("\nDuplicate Names:")
    for name_val, count in name_counts.items():
        if count > 1:
            print(f"Name: {name_val}, Count: {count}")
            # Print line numbers
            print(f"Found at relative lines: {[x[1] for x in names if x[0] == name_val]}")

if __name__ == "__main__":
    find_duplicates()
