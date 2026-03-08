
// Mock Data
const catalog = [
    { id: '1', name: 'Supino Reto', muscleGroup: 'Peito', description: 'Peito e ombros' },
    { id: '2', name: 'Agachamento', muscleGroup: 'Pernas', description: 'Pernas e glúteos' },
    { id: '3', name: 'Leg Press', muscleGroup: 'Pernas', description: 'Pernas' },
    { id: '4', name: 'Desenvolvimento', muscleGroup: 'Ombros', description: 'Ombros' },
    { id: '17', name: 'Afundo', muscleGroup: 'Pernas', description: 'Glúteos e pernas' },
    { id: '19', name: 'Mesa Flexora', muscleGroup: 'Pernas', description: 'Posterior' },
    { id: '21', name: 'Agachamento Búlgaro', muscleGroup: 'Pernas', description: 'Glúteo' },
    { id: '8', name: 'Elevação Lateral', muscleGroup: 'Ombros', description: 'Ombros' },
    { id: '27', name: 'Face Pull', muscleGroup: 'Ombros', description: 'Ombros' },
    { id: '99', name: 'Extensora', muscleGroup: 'Pernas', description: 'Quadriceps' },
    { id: '98', name: 'Stiff', muscleGroup: 'Pernas', description: 'Posterior e gluteo' },
];

const generateWorkout = (prompt) => {
    const normalize = (str) => str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "");

    const tokens = normalize(prompt).split(/\s+/).filter(t => t.length > 2);

    // 1. Identify Target Muscle Groups
    const allMuscleGroups = [...new Set(catalog.map(e => e.muscleGroup))];
    const detectedGroups = new Set();

    // Naively check if token matches a muscle group
    tokens.forEach(t => {
        allMuscleGroups.forEach(mg => {
            if (normalize(mg).includes(t)) detectedGroups.add(mg);
        });
    });

    console.log("Detected Groups:", Array.from(detectedGroups));

    // 2. Scoring
    const scored = catalog.map(ex => {
        let score = 0;
        const normName = normalize(ex.name);
        const normMuscle = normalize(ex.muscleGroup);
        const normDesc = ex.description ? normalize(ex.description) : "";

        tokens.forEach(token => {
            if (normMuscle.includes(token)) score += 10;
            if (normName.includes(token)) score += 8;
            if (normDesc.includes(token)) score += 3;
        });

        return { ...ex, score };
    });

    // 3. Balanced Selection
    const relevant = scored.filter(ex => ex.score > 0).sort((a, b) => b.score - a.score);
    const selected = [];
    const selectedIds = new Set();

    // A. Priority Pass: Pick top 2 from each detected group
    detectedGroups.forEach(group => {
        const groupExercises = relevant.filter(e => e.muscleGroup === group);
        // Take top 2
        for (let i = 0; i < Math.min(2, groupExercises.length); i++) {
            const ex = groupExercises[i];
            if (!selectedIds.has(ex.id)) {
                selected.push(ex);
                selectedIds.add(ex.id);
            }
        }
    });

    // B. Fill remainder with highest score
    let i = 0;
    while (selected.length < 8 && i < relevant.length) {
        const ex = relevant[i];
        if (!selectedIds.has(ex.id)) {
            selected.push(ex);
            selectedIds.add(ex.id);
        }
        i++;
    }

    console.log("\n--- Selected (Balanced) ---");
    selected.forEach(s => console.log(`${s.name} (${s.muscleGroup}) - Score: ${s.score}`));
};

generateWorkout("treino de gluteo, perna e ombro");
