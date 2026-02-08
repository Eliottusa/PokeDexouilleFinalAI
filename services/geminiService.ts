import { GoogleGenAI, Type } from "@google/genai";
import { Pokemon, Rarity } from '../types';

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
`;

export const generateAiPokemon = async (userPrompt?: string): Promise<Pokemon> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const finalPrompt = userPrompt 
    ? `${BASE_PROMPT}\n\nThe user specifically requests: "${userPrompt}". Ensure the Pokemon matches this description.`
    : BASE_PROMPT;

  try {
    // 1. Generate Metadata
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: finalPrompt,
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
            visualPrompt: { type: Type.STRING }
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
      // Fallback placeholder
      base64Image = 'https://picsum.photos/200/200'; 
    }

    return {
      id: `ai-${Date.now()}`,
      apiId: 0,
      name: metadata.name,
      types: metadata.types,
      sprite: base64Image,
      rarity: Rarity.MYTHICAL, // AI mons are always Mythical or Special
      stats: metadata.stats,
      isAiGenerated: true,
      acquiredAt: Date.now(),
      description: metadata.description
    };

  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};