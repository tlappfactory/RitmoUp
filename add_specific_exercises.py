mock_file = r'c:\RitmoUp\mockData.ts'

new_exercises = [
    {
        "id": "2089",
        "name": "Butt Kicks",
        "muscleGroup": "Cardio",
        "equipment": "Peso do Corpo",
        "type": "Cardio",
        "level": "Iniciante",
        "description": "Exercício de aquecimento e cardio que foca nos isquiotibiais.",
        "instructions": ["Corra no lugar", "Tente encostar o calcanhar no glúteo a cada passo", "Mantenha o tronco reto"],
        "tips": ["Mantenha o ritmo constante", "Use os braços para equilíbrio"],
        "imageUrl": "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Fbutt_kicks.png?alt=media"
    },
    {
        "id": "2090",
        "name": "Mesa Flexora Unilateral",
        "muscleGroup": "Pernas",
        "equipment": "Máquina",
        "type": "Força",
        "level": "Intermediário",
        "description": "Isolamento de posteriores de coxa, executado uma perna de cada vez.",
        "instructions": ["Deite-se na mesa flexora", "Ajuste o rolo no tornozelo", "Flexione o joelho levando o calcanhar ao glúteo", "Retorne controlando o movimento"],
        "tips": ["Não tire o quadril do banco", "Mantenha o tronco estável"],
        "imageUrl": "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Fmesa_flexora_unilateral.png?alt=media"
    },
    {
        "id": "2091",
        "name": "Tríceps Corda Unilateral",
        "muscleGroup": "Tríceps",
        "equipment": "Polia",
        "type": "Força",
        "level": "Intermediário",
        "description": "Exercício isolado para tríceps usando a polia alta, unilateral para corrigir assimetrias.",
        "instructions": ["Segure a corda/puxador com uma mão", "Cotovelo fixo ao lado do corpo", "Estenda o braço para baixo", "Retorne até 90 graus"],
        "tips": ["Não mexa o ombro", "Foco na contração do tríceps"],
        "imageUrl": "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Ftriceps_corda_unilateral.png?alt=media"
    },
    {
        "id": "2092",
        "name": "Remada Cavalinho (Barra T)",
        "muscleGroup": "Costas",
        "equipment": "Barra T ou Máquina",
        "type": "Força",
        "level": "Avançado",
        "description": "Exercício composto potente para espessura das costas.",
        "instructions": ["Posicione-se sobre a barra T", "Mantenha a coluna neutra e inclinada", "Puxe a barra em direção ao peito/abdômen", "Retorne alongando as dorsais"],
        "tips": ["Use as pernas para estabilizar", "Não arredonde a lombar"],
        "imageUrl": "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Fremada_cavalinho_T.jpeg?alt=media"
    }
]

with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Insert before the last ];
last_bracket_index = content.rfind("];")

if last_bracket_index != -1:
    entries_str = ""
    for ex in new_exercises:
        entries_str += "  {\n"
        entries_str += f"    id: '{ex['id']}',\n"
        entries_str += f"    name: '{ex['name']}',\n"
        entries_str += f"    muscleGroup: '{ex['muscleGroup']}',\n"
        entries_str += f"    equipment: '{ex['equipment']}',\n"
        entries_str += f"    type: '{ex['type']}',\n"
        entries_str += f"    level: '{ex['level']}',\n"
        entries_str += f"    description: '{ex['description']}',\n"
        
        # Instructions array formatting
        inst_str = "', '".join(ex['instructions'])
        entries_str += f"    instructions: ['{inst_str}'],\n"
        
        # Tips array formatting
        tips_str = "', '".join(ex['tips'])
        entries_str += f"    tips: ['{tips_str}'],\n"
        
        entries_str += f"    imageUrl: '{ex['imageUrl']}'\n"
        entries_str += "  },\n"

    new_content = content[:last_bracket_index] + entries_str + content[last_bracket_index:]
    
    with open(mock_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Appended {len(new_exercises)} new exercises.")
else:
    print("Could not find end of array '];'")
