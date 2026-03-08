import re

mock_file = r'c:\RitmoUp\mockData.ts'

# Map Portuguese Name (from exercises_list.txt) to proper Filename (from storage_files_list.txt)
# If filename is not in storage_files_list, I marked with ? but will use best guess or keep existing
url_map = {
    # Peito
    "Supino no Chão (Floor Press)": "floor_press.png",
    "Flexão Declinada": "decline_pushup.png",
    "Flexão Inclinada": "incline_pushup.png",
    "Svend Press": "svend_press.png",
    "Pullover com Barra": "barbell_pullover.png",
    "Crucifixo Inclinado (Cabo)": "cable_incline_fly.png",
    "Flexão Arqueiro": "archer_pushup.png",
    "Flexão Batendo Palmas": "clap_pushup.png",
    "Supino Invertido": "reverse_grip_pushdown.png", # Best guess based on available files or use generic bench
    "Flexão com Peso": "weighted_pushup.png",
    
    # Tríceps
    "Tate Press": "tate_press.png",
    "Tríceps Coice (Kickback)": "triceps_kickback.png",
    "Tríceps Banco com Peso": "wighted_bench_dips.png", # Typo in filename
    "Tríceps Francês Unilateral": "one_arm_overhead_extension.png",
    "Tríceps Corda Unilateral": "triceps_rope.png", # Reuse rope or generic
    "Tríceps Mergulho Máquina": "dip_machine.png",
    "Tríceps Supinado": "reverse_grip_pushdown.png",
    
    # Costas
    "Remada Cavalinho (Barra T)": "t_bar_row.png",
    "Remada Pendlay": "pendlay_row.png",
    "Puxada Unilateral (Polia)": "single_arm_lat_pulldown.png",
    "Barra Fixa Supinada (Chin-up)": "chin_up.png",
    "Rack Pull (Meio Terra)": "rack_pull.png",
    "Pulldown com Corda": "rope_pulldown.png",
    "Remada Invertida": "inverted_row.png",
    "Superman": "superman.png",
    "Remada Meadows": "meadows_row.png",
    "Remada Yates": "yates_row.png",
    "Crucifixo Inverso no Banco Inclinado": "chest_supported_reverse_fly.png",
    "Puxada com Braços Estendidos": "straight_arm_pulldown.png",
    
    # Bíceps
    "Rosca Zottman": "zottman_curl.png",
    "Rosca Aranha (Spider Curl)": "spider_curl.png",
    "Rosca no Banco Inclinado": "incline_dumbell_curl.png",
    "Rosca Drag": "drag_curl.png",
    "Rosca Concentrada em Pé": "standing_concentration_curl.jpeg",
    "Rosca Martelo na Corda": "hammer_curl_rope_cable.png",
    "Rosca Punho (Flexão)": "wrist_curl.jpeg",
    "Rosca Punho Inversa (Extensão)": "reverse_wrist_curl.jpeg",
    
    # Pernas
    "Agachamento Zercher": "agachamento_zercher.png", # Found in list
    "Agachamento Sissy": "sissy_squat.png",
    "Step-Up": "step_up.png",
    "Elevação Pélvica Unilateral": "single_leg_hip_thrust.jpeg",
    "Agachamento Cossaco": "cossack_squat.png",
    "Cadeira Extensora Unilateral": "leg_extension.png",
    "Mesa Flexora Unilateral": "leg_curl.png",
    "Panturrilha no Leg Press": "leg_press_calf.png",
    "Goblet Squat": "goblet_squat.png",
    "Agachamento com Salto": "jump_squat.png",
    "Afundo Lateral": "lateral_lunge.png",
    "Good Morning Sentado": "seated_good_morning.png",
    "Wall Sit (Agachamento Isométrico)": "wall_sit.png",
    "Nordic Hamstring Curl": "nordic_hamstring_curl.jpeg",
    "Panturrilha em Pé Unilateral": "single_leg_calf_raise.png",
    
    # Ombros
    "Elevação Lateral Unilateral (Cabo)": "cable_one_arm_lateral.png",
    "Elevação Frontal com Corda": "rope_front_raise.png",
    "Desenvolvimento Landmine": "landmine_press.png",
    "Elevação Y (Y-Raise)": "y_raise.png",
    "Rotação Externa (Manguito)": "external_rotation.png", # jpg?
    "Rotação Interna (Manguito)": "internal_rotation.jpg",
    "Crucifixo Inverso em Pé (Cabo)": "cable_reverse_fly.png",
    "Remada Alta Pegada Aberta": "wide_grip_upright_row.png",
    "Clean and Press": "dumbbell_clean_press.png",
    "Elevação Lateral Sentado": "seated_lateral_raise.png",
    
    # Abdômen
    "Abdominal Canivete (V-Up)": "v_up.png",
    "Abdominal Tesoura": "flutter_kicks.png",
    "Prancha Estrela": "star_plank.png",
    "Prancha com Elevação de Perna": "plank_leg_raise.png",
    "Prancha com Toque no Ombro": "plank_shoulder_tap.png",
    "Dead Bug": "dead_bug.png",
    "Hollow Body Hold": "hollow_body.png",
    "Abdominal Oblíquo Deitado": "side_crunch.png",
    "Rotação de Tronco com Bastão": "broomstick_twist.png",
    "Woodchopper (Lenhador)": "cable_woodchopper.png",
    
    # Cardio
    "Corda Naval (Battle Ropes)": "battle_ropes.png",
    "Polichinelo": "jumping_jacks.png",
    "High Knees": "high_knees.png",
    "Butt Kicks": "butt_kicks.jpeg",
    "Deslocamento Lateral": "lateral_shuffle.png",
    "Thruster (Agachamento com Arremesso)": "thruster.png",
    "Man Maker": "man_maker.png",
    "Farmer's Walk": "farmers_walk.png",
    "Sled Push": "sled_push.png",
    "Sled Pull": "sled_pull.png",
    
    # Mobilidade
    "Escorpião": "scorpion_stretch.png",
    "Rotação de Tronco Deitado": "lying_spinal_twist.jpeg",
    "Alongamento de Punhos": "wrist_stretch.jpeg",
    "Alongamento de Pescoço": "neck_stretch.jpeg",
    "Mobilidade de Tornozelo com Elástico": "banded_ankled_mobility.png"
}

# Add fallbacks for jpg/jpeg manually found
jpg_overrides = {
    "Rotação Externa (Manguito)": "external_rotation.png", # List says png
    "Rotação Interna (Manguito)": "internal_rotation.jpg",
}

with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

updates = 0

for name, filename in url_map.items():
    # Construct new URL
    # Handle files with spaces? Most don't have spaces in filename map above
    # encodeURIComponent logic: space -> %20
    safe_filename = filename.replace(' ', '%20')
    new_url = f"https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2F{safe_filename}?alt=media"
    
    # Search for this exercise in content
    # name: 'Exact Name',
    safe_name = re.escape(name)
    pattern = r"(name:\s*'" + safe_name + r"',.*?imageUrl:\s*')([^']+?)(')"
    
    match = re.search(pattern, content, re.DOTALL)
    if match:
        current_url = match.group(2)
        if current_url != new_url:
            content = re.sub(pattern, r"\1" + new_url + r"\3", content, count=1, flags=re.DOTALL)
            updates += 1
            print(f"Fixed: {name} -> {filename}")
        else:
            print(f"Skipping {name}, already correct.")
    else:
        print(f"Could not find exercise block for: {name}")

with open(mock_file, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Total fixes applied: {updates}")
