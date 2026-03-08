
/**
 * Service for content moderation and safety.
 * Filters profanity, hate speech, and other harmful content in PT-BR.
 */

// Banned words list (Base64 or obfuscated in production usually, but plain here for maintenance)
// Categories: Profanity, Racism, Homophobia, Violence, Self-harm
const BANNED_TERMS = [
    // Profanity / Insults (Common PT-BR)
    'merda', 'porra', 'caralho', 'bosta', 'pinto', 'buceta', 'cuzão', 'cuzao', 'otario', 'otário',
    'idiota', 'imbecil', 'retardado', 'estupido', 'estúpido', 'fdp', 'puta', 'vagabunda', 'arrombado',
    'babaca', 'corno', 'vadia', 'piranha', 'safada', 'safado',

    // Hate Speech / Discrimination
    'preto encardido', 'macaco', 'tiziu', // Racism context
    'viado', 'bicha', 'sapatão', 'sapatao', 'traveco', 'boiola', // Homophobia
    'aleijado', 'mongol', // Ableism

    // Violence / Harm
    'se matar', 'suicidio', 'suicídio', 'morra', 'matar voce', 'matar você', 'te matar',
    'bater em', 'socaa', 'chutar sua cara'
];

// Regex patterns for more complex matching (e.g., trying to bypass with spaces)
const PATTERNS = [
    /p\s*[o0]\s*r\s*r\s*a/i,
    /c\s*a\s*r\s*a\s*l\s*h\s*o/i,
    /b\s*u\s*c\s*e\s*t\s*a/i,
    /m\s*e\s*r\s*d\s*a/i,
    /v\s*i\s*a\s*d\s*o/i
];

export const moderationService = {
    /**
     * Analyzes text for unsafe content.
     * @param text The text to analyze
     * @returns Object containing safety status and reason
     */
    analyzeText: (text: string): { safe: boolean; flaggedTerms: string[]; reason?: string } => {
        if (!text) return { safe: true, flaggedTerms: [] };

        const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const flagged: string[] = [];

        // 1. Check direct word usage
        BANNED_TERMS.forEach(term => {
            const normalizedTerm = term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            // Use word boundary check to avoid false positives (e.g., 'computador' containing 'puta')
            // Simple approach: check if text contains the term with surrounding spaces or start/end
            const regex = new RegExp(`\\b${normalizedTerm}\\b`, 'i');
            if (regex.test(normalizedText) || normalizedText.includes(normalizedTerm)) {
                // .includes is aggressive but safer for compound insults. 
                // Let's rely on regex for short words, includes for phrases.
                if (term.includes(' ')) {
                    if (normalizedText.includes(normalizedTerm)) flagged.push(term);
                } else {
                    if (regex.test(normalizedText)) flagged.push(term);
                }
            }
        });

        // 2. Check Regex Patterns (Bypass attempts)
        PATTERNS.forEach(pattern => {
            if (pattern.test(normalizedText)) {
                flagged.push("suspicious_pattern");
            }
        });

        if (flagged.length > 0) {
            return {
                safe: false,
                flaggedTerms: flagged,
                reason: "Conteúdo contém termos ofensivos ou inadequados."
            };
        }

        return { safe: true, flaggedTerms: [] };
    },

    /**
     * Sanitizes text by replacing banned words with asterisks (Optional usage)
     */
    sanitize: (text: string): string => {
        let cleanText = text;
        const result = moderationService.analyzeText(text);

        result.flaggedTerms.forEach(term => {
            // Simple replace for now, regex ideal but complex to reconstruct original casing
            // This is a basic implementation
            const regex = new RegExp(term, 'gi');
            cleanText = cleanText.replace(regex, '*'.repeat(term.length));
        });

        return cleanText;
    }
};
