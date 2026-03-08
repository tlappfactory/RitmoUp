import re
import os

list_file = r'C:\Users\leofe\.gemini\antigravity\brain\758126b3-4dd2-4ebf-a760-a2f390d20804\exercises_list.txt'
mock_file = r'c:\RitmoUp\mockData.ts'

# Manual mapping for specific cases where simple slugification might fail or user specified something else
# Based on common English names for these exercises
slug_map = {
    "Supino no Chão (Floor Press)": "floor_press",
    "Flexão Declinada": "decline_pushup",
    "Flexão Inclinada": "incline_pushup",
    # ... most will be auto-generated from English name in parens
}

def get_slug(name):
    # If explicit map
    if name in slug_map:
        return slug_map[name]
    
    # Try to extract English name from parens: "Nome (English Name)"
    match = re.search(r'\(([^)]+)\)', name)
    if match:
        english_name = match.group(1)
        return english_name.lower().replace(' ', '_').replace('-', '_')
    
    # Fallback to Portuguese name slug
    return name.lower().replace(' ', '_').replace('ã', 'a').replace('ç', 'c').replace('é', 'e').replace('ó', 'o').replace('í', 'i').replace('ú', 'u').replace('â', 'a').replace('ê', 'e')

# Read exercises list
with open(list_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

exercises_to_update = []
for line in lines:
    line = line.strip()
    if not line or line in ["Costas & Bíceps", "Pernas", "Ombros", "Abdômen & Core", "Cardio & Funcional", "Mobilidade"]:
        continue
    line = re.sub(r'^\d+\.\s*', '', line)
    exercises_to_update.append(line)

# Read mockData.ts
with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update existing exercises (IDs 2000+)
updated_count = 0
for ex_name in exercises_to_update:
    slug = get_slug(ex_name)
    # Special fix for Farmer's Walk which might be just "Farmer's Walk" or with parens
    if "Farmer's Walk" in ex_name:
        slug = "farmers_walk"

    new_url = f"https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2F{slug}.png?alt=media"
    
    # escape for regex
    safe_name = re.escape(ex_name)
    
    # Regex to find the object with this name
    # We look for name: 'Name', ... imageUrl: '...'
    pattern = r"(name:\s*'" + safe_name + r"',.*?imageUrl:\s*')([^']+?)(')"
    
    match = re.search(pattern, content, re.DOTALL)
    if match:
        current_url = match.group(2)
        if current_url != new_url:
            # Replace only the URL part
            # match.group(0) is the whole block, but we want to replace safely.
            # simpler approach: replace the specific URL if we can pinpoint it
             content = re.sub(pattern, r"\1" + new_url + r"\3", content, count=1, flags=re.DOTALL)
             updated_count += 1
             print(f"Updated URL for: {ex_name} -> {slug}.png")
    else:
        # Not found? Might be the missing one
        if "Farmer's Walk" in ex_name:
            print("Detected missing Farmer's Walk, will append.")
        else:
             print(f"Warning: Could not find '{ex_name}' in mockData.ts to update.")

# 2. Append missing Farmer's Walk if not present
if "Farmer's Walk" not in content:
    print("Appending Farmer's Walk...")
    # Find the end of the array to append
    # usually ends with ];
    
    new_entry = """
  {
    id: '2088',
    name: "Farmer's Walk",
    muscleGroup: 'Cardio & Funcional',
    equipment: 'Halteres',
    type: 'Funcional',
    level: 'Intermediário',
    description: 'Caminhada segurando pesos, excelente para pegada e core.',
    instructions: ['Segure um peso pesado em cada mão', 'Mantenha a postura ereta e caminhe', 'Não deixe os pesos balançarem'],
    tips: ['Contraia o abdômen', 'Olhe para frente'],
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Ffarmers_walk.png?alt=media'
  },
"""
    # Insert before the last ];
    last_bracket_index = content.rfind("];")
    if last_bracket_index != -1:
        content = content[:last_bracket_index] + new_entry + content[last_bracket_index:]
        updated_count += 1

with open(mock_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Total updates: {updated_count}")
