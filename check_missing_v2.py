import re
import os

list_file = r'C:\Users\leofe\.gemini\antigravity\brain\758126b3-4dd2-4ebf-a760-a2f390d20804\exercises_list.txt'
mock_file = r'c:\RitmoUp\mockData.ts'

# Read user list
with open(list_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

user_items = []
for line in lines:
    line = line.strip()
    # Skip empty lines or headers
    if not line:
        continue
    if line in ["Costas & Bíceps", "Pernas", "Ombros", "Abdômen & Core", "Cardio & Funcional", "Mobilidade"]:
        continue
    # Remove numbering if present
    line = re.sub(r'^\d+\.\s*', '', line)
    user_items.append(line)

print(f"User provided {len(user_items)} items.")

# Read mockData.ts
with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract existing names
existing_names = set(re.findall(r"name:\s*'([^']+)'", content))
print(f"Found {len(existing_names)} existing exercises in mockData.ts.")

missing = []
for item in user_items:
    found = False
    if item in existing_names:
        found = True
    else:
        # Fuzzy check: "Supino no Chão (Floor Press)" vs "Supino no Chão"
        # Check if the base name exists
        base_name = item.split('(')[0].strip()
        for exist in existing_names:
            if base_name in exist or exist in item:
                found = True
                break
    
    if not found:
        missing.append(item)

print(f"\nMissing {len(missing)} items:")
for m in missing:
    print(f"- {m}")

# Generate a starter code block for missing items
if missing:
    print("\n--- Generated Code Skeleton for Missing Items ---")
    current_id_start = 2050 # Assuming we continue from 2038+
    
    print("export const newExercises = [")
    for m in missing:
        # Attempt to guess muscle group and english slug
        slug = m.split('(')[-1].replace(')', '').strip().lower().replace(' ', '_')
        if slug == m.lower().replace(' ', '_'): # No parentheses
             slug = m.lower().replace(' ', '_')
             # limit slug length or unicode
             slug = re.sub(r'[^a-z0-9_]', '', slug)
        
        print(f"  {{")
        print(f"    id: '{current_id_start}',")
        print(f"    name: '{m}',")
        print(f"    muscleGroup: 'TODO',")
        print(f"    equipment: 'TODO',")
        print(f"    type: 'Força',")
        print(f"    level: 'Intermediário',")
        print(f"    description: 'Exercício para ...',")
        print(f"    instructions: ['Instrução 1', 'Instrução 2'],")
        print(f"    tips: ['Dica 1'],")
        print(f"    imageUrl: 'https://storage.googleapis.com/ritmoup-b432b.firebasestorage.app/exercises/{slug}.png'")
        print(f"  }},")
        current_id_start += 1
    print("];")
