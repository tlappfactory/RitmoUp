$path = "c:\RitmoUp\public\images\exercises"

$renames = @{
    "abdominal bicicleta.png" = "bicycle_crunch.png"
    "abdominal na máquina.png" = "machine_crunch.png"
    "afundo no smith.png" = "smith_lunge.png"
    "agachamento no smith.png" = "smith_squat.png"
    "agachamento pistol.png" = "pistol_squat.png"
    "agachamento sumô.png" = "sumo_squat.png"
    "abdutora.png" = "abductor_machine.png"
    "adutora.png" = "adductor_machine.png"
    "bom dia.png" = "good_morning.png"
    "cadeira flexora.png" = "seated_leg_curl.png"
    "desenvolvimento militar.png" = "military_press.png"
    "desenvolvimento no smith.png" = "smith_shoulder_press.png"
    "elevação lateral na polia.png" = "cable_lateral_raise.png"
    "elevação pélvica.png" = "hip_thrust.png"
    "elíptico.png" = "elliptical.png"
    "escalada.png" = "mountain_climber.png"
    "flexão diamante.png" = "diamond_push_up.png"
    "glúteo máquina.png" = "glute_kickback_machine.png"
    "graviton.png" = "assisted_pull_up_machine.png"
    "panturrilha sentado.png" = "seated_calf_raise.png"
    "passada.png" = "walking_lunges.png"
    "ponte de glúteos.png" = "glute_bridge.png"
    "prancha lateral.png" = "side_plank.png"
    "remada cavalinho.png" = "t_bar_row.png"
    "rosca 21.png" = "bicep_curl_21.png"
    "rosca concentrada.png" = "concentration_curl.png"
    "rosca direta na polia.png" = "cable_bicep_curl.png"
    "rosca martelo.png" = "hammer_curl.png"
    "rosca scott (máquina).png" = "machine_preacher_curl.png"
    "salta na caixa.png" = "box_jump.png"
    "simulador de escada.png" = "stair_climber_machine.png"
    "supino fechado.png" = "close_grip_bench_press.png"
    "supino inclinado.png" = "incline_bench_press.png"
    "supino máquina.png" = "machine_chest_press.png"
    "triceps pulley.png" = "triceps_pushdown.png"
    "tríceps banco.png" = "bench_dips.png"
}

foreach ($key in $renames.Keys) {
    if (Test-Path "$path\$key") {
        $target = "$path\$($renames[$key])"
        if (Test-Path $target) {
            Write-Host "Overwriting $target..."
            Remove-Item $target -Force
        }
        Rename-Item -Path "$path\$key" -NewName $renames[$key]
        Write-Host "Renamed $key to $($renames[$key])"
    }
}
