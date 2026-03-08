import re
import os

list_file = r'C:\Users\leofe\.gemini\antigravity\brain\758126b3-4dd2-4ebf-a760-a2f390d20804\exercises_list.txt'
storage_file = r'c:\RitmoUp\storage_files_list.txt'

# Same slug logic as before
slug_map = {
    "Supino no Chão (Floor Press)": "floor_press",
    "Flexão Declinada": "decline_pushup",
    "Flexão Inclinada": "incline_pushup",
}

def get_slug(name):
    if name in slug_map:
        return slug_map[name]
    
    match = re.search(r'\(([^)]+)\)', name)
    if match:
        english_name = match.group(1)
        return english_name.lower().replace(' ', '_').replace('-', '_')
    
    return name.lower().replace(' ', '_').replace('ã', 'a').replace('ç', 'c').replace('é', 'e').replace('ó', 'o').replace('í', 'i').replace('ú', 'u').replace('â', 'a').replace('ê', 'e')

# Read exercises
with open(list_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

exercises = []
for line in lines:
    line = line.strip()
    if not line or line in ["Costas & Bíceps", "Pernas", "Ombros", "Abdômen & Core", "Cardio & Funcional", "Mobilidade"]:
        continue
    line = re.sub(r'^\d+\.\s*', '', line)
    exercises.append(line)

# Read storage files
with open(storage_file, 'r', encoding='utf-8') as f:
    storage_files = [line.strip().replace('exercises/', '') for line in f.readlines()]

print(f"Total exercises to check: {len(exercises)}")
print(f"Total storage files: {len(storage_files)}")

missing = []
found = []

print("\n--- CHECKING ---")
for ex in exercises:
    slug = get_slug(ex)
    if "Farmer's Walk" in ex:
        slug = "farmers_walk"
        
    expected_png = f"{slug}.png"
    expected_jpg = f"{slug}.jpg"
    expected_jpeg = f"{slug}.jpeg"
    
    if expected_png in storage_files:
        found.append(f"{ex} -> {expected_png}")
    elif expected_jpg in storage_files:
        found.append(f"{ex} -> {expected_jpg}")
    elif expected_jpeg in storage_files:
        found.append(f"{ex} -> {expected_jpeg}")
    else:
        # Check for partial matches or other extensions
        partial = [f for f in storage_files if slug in f]
        if partial:
             missing.append(f"{ex} -> {slug} NOT FOUND EXACTLY, but found similar: {partial}")
        else:
             missing.append(f"{ex} -> {slug} NOT FOUND")

print(f"\nFound: {len(found)}")
print(f"Missing/Mismatch: {len(missing)}")

if missing:
    print("\n--- MISSING ITEMS ---")
    for m in missing:
        print(m)
