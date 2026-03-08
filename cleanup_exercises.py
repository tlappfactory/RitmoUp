import os

path = r"c:\RitmoUp\public\images\exercises"

renames = {
    "abdominal bicicleta.png": "bicycle_crunch.png",
    "abdominal na máquina.png": "machine_crunch_v3.png",
    "afundo no smith.png": "smith_lunge.png",
    "agachamento no smith.png": "smith_squat.png",
    "agachamento pistol.png": "pistol_squat.png",
    "agachamento sumô.png": "sumo_squat.png",
    "bom dia.png": "good_morning.png",
    "cadeira flexora.png": "seated_leg_curl_v2.png",
    "desenvolvimento militar.png": "military_press.png",
    "desenvolvimento no smith.png": "smith_shoulder_press_v2.png",
    "elevação lateral na polia.png": "cable_lateral_raise.png",
    "elevação pélvica.png": "hip_thrust.png",
    "elíptico.png": "elliptical_v2.png",
    "escalada.png": "mountain_climber.png",
    "flexão diamante.png": "diamond_push_up.png",
    "glúteo máquina.png": "glute_kickback_machine.png",
    "graviton.png": "assisted_pull_up_machine.png",
    "panturrilha sentado.png": "seated_calf_raise_v2.png",
    "passada.png": "walking_lunges_v2.png",
    "ponte de glúteos.png": "glute_bridge.png",
    "prancha lateral.png": "side_plank.png",
    "remada cavalinho.png": "t_bar_row.png",
    "rosca 21.png": "bicep_curl_21.png",
    "rosca concentrada.png": "concentration_curl.png",
    "rosca direta na polia.png": "cable_bicep_curl.png",
    "rosca martelo.png": "hammer_curl_v2.png",
    "rosca scott (máquina).png": "machine_preacher_curl.png",
    "salta na caixa.png": "box_jump.png",
    "simulador de escada.png": "stair_climber_machine.png",
    "supino fechado.png": "close_grip_bench_press.png",
    "supino inclinado.png": "incline_bench_press_v2.png",
    "supino máquina.png": "machine_chest_press_v2.png",
    "triceps pulley.png": "triceps_pushdown_v2.png",
    "tríceps banco.png": "bench_dips_v2.png"
}

for old, new in renames.items():
    old_path = os.path.join(path, old)
    new_path = os.path.join(path, new)
    
    if os.path.exists(old_path):
        if os.path.exists(new_path):
            print(f"Overwriting {new_path}")
            os.remove(new_path)
        os.rename(old_path, new_path)
        print(f"Renamed {old} to {new}")
    else:
        print(f"Skipping {old} (not found)")
