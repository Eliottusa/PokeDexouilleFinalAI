import { GoogleGenAI, Type } from "@google/genai";
import { Pokemon, Rarity } from '../types';
import { PERSONALITIES } from '../constants';

// Ensure API Key is available.
const API_KEY = process.env.API_KEY || ''; 

const ai = new GoogleGenAI({ apiKey: API_KEY });

const BASE_PROMPT = `
Create a unique, invented Pokémon.
Provide a JSON object with:
- name: A creative name.
- types: Array of strings (e.g., Fire, Water, etc.). Max 2 types.
- description: A short Pokedex entry (max 20 words).
- stats: Object with hp, attack, defense, speed (values between 50 and 150).
- visualPrompt: A highly detailed, single sentence visual description of this pokemon for an image generator.
- suggestedNicknames: Array of 3 creative nicknames for this Pokemon.
`;

const FUSION_PROMPT = (p1Name: string, p1Type: string, p2Name: string, p2Type: string) => `
Create a FUSION Pokémon combining ${p1Name} (${p1Type}) and ${p2Name} (${p2Type}).
The result should be a hybrid creature.
Provide a JSON object with:
- name: A mixed name.
- types: A mix of the parents' types (Max 2).
- description: A Pokedex entry explaining the fusion (max 20 words).
- stats: Object with hp, attack, defense, speed (Averaged or combined from parents, balanced around 450 total).
- visualPrompt: A highly detailed visual description of the fused pokemon.
- suggestedNicknames: Array of 3 creative nicknames for this fusion.
`;

const EVENT_PROMPT = (season: string) => `
Create a ${season}-themed Pokémon.
It should embody the spirit of ${season} (e.g. Winter=Ice/Ghost, Summer=Fire/Sun).
Provide a JSON object with:
- name: A creative name.
- types: Array of strings relevant to ${season}. Max 2 types.
- description: A short Pokedex entry (max 20 words).
- stats: Object with hp, attack, defense, speed (values between 50 and 150).
- visualPrompt: A highly detailed, single sentence visual description of this pokemon for an image generator.
- suggestedNicknames: Array of 3 creative nicknames.
`;

const generatePokemonInternal = async (prompt: string, rarity: Rarity, parents?: [string, string]): Promise<Pokemon> => {
    if (!API_KEY) {
        throw new Error("API Key is missing. Please set process.env.API_KEY.");
    }

    try {
        // 1. Generate Metadata
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        types: { type: Type.ARRAY, items: { type: Type.STRING } },
                        description: { type: Type.STRING },
                        stats: {
                            type: Type.OBJECT,
                            properties: {
                                hp: { type: Type.INTEGER },
                                attack: { type: Type.INTEGER },
                                defense: { type: Type.INTEGER },
                                speed: { type: Type.INTEGER },
                            }
                        },
                        visualPrompt: { type: Type.STRING },
                        suggestedNicknames: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        const metadata = JSON.parse(response.text || '{}');
        if (!metadata.name) throw new Error("Failed to generate metadata");

        // 2. Generate Image
        const imageResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: `Ken Sugimori style Pokemon art, white background. ${metadata.visualPrompt}`,
            config: {
                // No schema for image model
            }
        });

        let base64Image = '';
        // Extract image
        for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }

        if (!base64Image) {
            base64Image = 'https://picsum.photos/200/200';
        }

        const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

        return {
            id: `ai-${Date.now()}`,
            apiId: 0,
            name: metadata.name,
            types: metadata.types,
            sprite: base64Image,
            rarity: rarity,
            stats: metadata.stats,
            isAiGenerated: true,
            acquiredAt: Date.now(),
            description: metadata.description,
            status: 'none',
            personality,
            friendship: 0,
            suggestedNicknames: metadata.suggestedNicknames,
            parents: parents
        };

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};

export const generateAiPokemon = async (userPrompt?: string): Promise<Pokemon> => {
    const finalPrompt = userPrompt 
        ? `${BASE_PROMPT}\n\nThe user specifically requests: "${userPrompt}". Ensure the Pokemon matches this description.`
        : BASE_PROMPT;
    return generatePokemonInternal(finalPrompt, Rarity.MYTHICAL);
};

export const generateFusionPokemon = async (p1: Pokemon, p2: Pokemon): Promise<Pokemon> => {
    const prompt = FUSION_PROMPT(p1.name, p1.types.join('/'), p2.name, p2.types.join('/'));
    return generatePokemonInternal(prompt, Rarity.LEGENDARY, [p1.name, p2.name]);
};

export const generateEventPokemon = async (season: string): Promise<Pokemon> => {
    const prompt = EVENT_PROMPT(season);
    return generatePokemonInternal(prompt, Rarity.EPIC);
};