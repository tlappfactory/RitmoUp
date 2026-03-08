
// Mock Data (Simplified from mockData.ts)
const catalog = [
    { id: '1', name: 'Supino Reto', muscleGroup: 'Peito', description: 'Peito e ombros' },
    { id: '2', name: 'Agachamento', muscleGroup: 'Pernas', description: 'Pernas e glúteos' },
    { id: '3', name: 'Leg Press', muscleGroup: 'Pernas', description: 'Pernas' },
    { id: '4', name: 'Desenvolvimento', muscleGroup: 'Ombros', description: 'Ombros' },
    { id: '5', name: 'Rosca Direta', muscleGroup: 'Bíceps', description: 'Bíceps' },
    { id: '17', name: 'Afundo', muscleGroup: 'Pernas', description: 'Glúteos e pernas' },
    { id: '19', name: 'Mesa Flexora', muscleGroup: 'Pernas', description: 'Posterior' },
    { id: '21', name: 'Agachamento Búlgaro', muscleGroup: 'Pernas', description: 'Glúteo' },
    { id: '8', name: 'Elevação Lateral', muscleGroup: 'Ombros', description: 'Ombros' },
    { id: '27', name: 'Face Pull', muscleGroup: 'Ombros', description: 'Ombros' },
    // Add enough "Perna/Gluteo" items to potentially push Ombros out if limit is small
    { id: '99', name: 'Extensora', muscleGroup: 'Pernas', description: 'Quadriceps' },
    { id: '98', name: 'Stiff', muscleGroup: 'Pernas', description: 'Posterior e gluteo' },
];

const generateWorkout = (prompt) => {
    // 1. Preprocessing (Updated logic)
    const normalize = (str) => str.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "");

    // Manually mocking the tokens logic
    const tokens = normalize(prompt).split(/\s+/).filter(t => t.length > 2);

    console.log("Tokens:", tokens);

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

    // 3. Selection
    const relevant = scored.filter(ex => ex.score > 0).sort((a, b) => b.score - a.score);

    console.log("\n--- Ranked Results ---");
    relevant.forEach(r => console.log(`${r.name} (${r.muscleGroup}): ${r.score}`));

    const selected = relevant.slice(0, 8);
    console.log("\n--- Selected (Top 8) ---");
    selected.forEach(s => console.log(`${s.name} (${s.muscleGroup})`));
};

generateWorkout("treino de gluteo, perna e ombro");
