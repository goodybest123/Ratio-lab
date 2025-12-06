import { GoogleGenAI, Type } from "@google/genai";
import { Level2Challenge, SphinxRiddle } from "../types";

// Helper to safely initialize the AI client
const getAiClient = () => {
    // Per guidelines, API key must be obtained exclusively from process.env.API_KEY
    try {
        // Check for process.env (Node/Standard)
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            return new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        // Fallback: check if window.process was polyfilled (e.g. by index.html script for Vercel)
        if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
             return new GoogleGenAI({ apiKey: (window as any).process.env.API_KEY });
        }
    } catch (e) {
        console.error("Error accessing process.env.API_KEY", e);
    }
    
    console.warn("API_KEY not found. Using offline fallback mode.");
    return null;
};

// Helper to strip Markdown code blocks from JSON response
const parseJson = (text: string) => {
    try {
        // Remove ```json and ``` wrapper if present
        const cleanText = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw e;
    }
};

export const getNewRecipe = async (previousRecipe?: { green: number; purple: number }): Promise<{ potionName: string; green: number; purple: number }> => {
    const fallbackRecipes = [
        { potionName: "Classic Bouncing Potion", green: 2, purple: 3 },
        { potionName: "Glimmering Growth Elixir", green: 1, purple: 4 },
        { potionName: "Whirling Wonder Tonic", green: 3, purple: 5 },
        { potionName: "Sunbeam Soother", green: 2, purple: 5 },
        { potionName: "Swiftness Draught", green: 1, purple: 3 },
        { potionName: "Stone Skin Brew", green: 4, purple: 5 },
    ];

    const getFallback = () => {
        const availableRecipes = previousRecipe
            ? fallbackRecipes.filter(r => r.green !== previousRecipe.green || r.purple !== previousRecipe.purple)
            : fallbackRecipes;
        return availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
    };

    const ai = getAiClient();
    if (!ai) return getFallback();

    try {
        let prompt = `Act as a Potion Master. Generate a new, simple potion recipe. The recipe involves 'Green Slime' and 'Purple Goo'. Keep the ratio numbers for each part between 1 and 9. Ensure the two numbers are different and the ratio is in its simplest form (e.g., use 2:3, not 4:6). Provide a fun, creative name for the potion.`;

        if (previousRecipe) {
            prompt += ` The previous recipe ratio was ${previousRecipe.green}:${previousRecipe.purple}. Please provide a different ratio.`;
        }

        prompt += ` Respond ONLY in JSON format with keys: "potionName", "green", "purple".`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        potionName: { type: Type.STRING },
                        green: { type: Type.INTEGER },
                        purple: { type: Type.INTEGER }
                    },
                    required: ["potionName", "green", "purple"]
                },
            },
        });

        const newRecipe = parseJson(response.text.trim());

        if (previousRecipe && newRecipe.green === previousRecipe.green && newRecipe.purple === previousRecipe.purple) {
            return getFallback();
        }

        return newRecipe;
    } catch (error) {
        console.error("Error fetching new recipe:", error);
        return getFallback();
    }
};

export const getLevel1Hint = async (actualGreen: number, actualPurple: number, expectedGreen: number, expectedPurple: number): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Something went wrong! Check the recipe card and try again.";

    try {
        const prompt = `Act as a Potion Master. The student was supposed to make a ${expectedGreen}:${expectedPurple} (Green:Purple) potion but made a ${actualGreen}:${actualPurple} potion. Generate a 1-sentence hint that explains why the potion failed. Don't give the answer. Be encouraging and speak like a friendly magical creature.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching level 1 hint:", error);
        return "Something went wrong! Check the recipe card and try again.";
    }
};

export const getNewLevel2Challenge = async (previousChallenge?: Level2Challenge | null): Promise<Level2Challenge | null> => {
    const fallback = {
        potionName: "Giant's Warming Potion",
        ingredient1Name: "Fire Salts",
        ingredient2Name: "Frost Dew",
        baseRatio1: 2,
        baseRatio2: 5,
        scaleFactor: 3,
        givenPart1: 6,
        scaled_part_2: 15,
        total_units: 21,
        hint: "You're making a batch 3 times bigger! So you'll need 3 times as much Frost Dew!"
    };

    const ai = getAiClient();
    if (!ai) return fallback;

    try {
        let prompt = `You are a ratio logic engine. Create a scaling challenge with "Fire Salts" and "Frost Dew".
        Provide a JSON response with:
        1. "potionName": Creative name.
        2. "baseRatio1" (1-5), "baseRatio2" (1-5, distinct from ratio1).
        3. "scaleFactor" (2-5).
        4. "givenPart1" (baseRatio1 * scaleFactor).
        5. "scaled_part_2" (baseRatio2 * scaleFactor).
        6. "total_units" (givenPart1 + scaled_part_2).
        7. "hint": A hint about multiplying the missing part by the scale factor.
        `;

        if (previousChallenge) {
            prompt += ` The previous scale factor was ${previousChallenge.scaleFactor} and base ratio was ${previousChallenge.baseRatio1}:${previousChallenge.baseRatio2}. Generate different numbers.`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        potionName: { type: Type.STRING },
                        baseRatio1: { type: Type.INTEGER },
                        baseRatio2: { type: Type.INTEGER },
                        scaleFactor: { type: Type.INTEGER },
                        givenPart1: { type: Type.INTEGER },
                        scaled_part_2: { type: Type.INTEGER },
                        total_units: { type: Type.INTEGER },
                        hint: { type: Type.STRING },
                    },
                    required: ["potionName", "baseRatio1", "baseRatio2", "scaleFactor", "givenPart1", "scaled_part_2", "total_units", "hint"]
                },
            },
        });

        const challengeData = parseJson(response.text.trim());

        // Safety check: Ensure the math is correct (AI sometimes hallucinates numbers)
        const calculatedGiven = challengeData.baseRatio1 * challengeData.scaleFactor;
        const calculatedAnswer = challengeData.baseRatio2 * challengeData.scaleFactor;
        
        // Overwrite potentially incorrect AI math with strict JS math
        const correctedChallenge = {
            ...challengeData,
            givenPart1: calculatedGiven,
            scaled_part_2: calculatedAnswer,
            total_units: calculatedGiven + calculatedAnswer,
            ingredient1Name: "Fire Salts",
            ingredient2Name: "Frost Dew",
        };

        if (previousChallenge && correctedChallenge.baseRatio1 === previousChallenge.baseRatio1 && correctedChallenge.scaleFactor === previousChallenge.scaleFactor) {
            return fallback; // Return fallback to force variety if AI repeats
        }

        return correctedChallenge;

    } catch (error) {
        console.error("Error fetching new level 2 challenge:", error);
        return fallback;
    }
};

export const getSphinxRiddle = async (previousRiddle?: SphinxRiddle | null): Promise<SphinxRiddle | null> => {
    const fallback = {
        riddleText: "For every 2 Red Gems, you need 3 Blue Gems. I have 4 Red Gems here. How many Blue Gems do I need to match?",
        ingredient1Name: "Red Gems",
        ingredient2Name: "Blue Gems",
        ratio1: 2,
        ratio2: 3,
        givenAmount: 4,
        requiredAmount: 6,
        explanation: "4 Red Gems is double the amount of 2. So you need double the Blue Gems (3 + 3 = 6)."
    };

    const ai = getAiClient();
    if (!ai) return fallback;

    try {
        let prompt = `Generate a very simple ratio word problem for a child (ages 7-10).
        Logic:
        1. Pick two simple items (e.g. Apples/Berries, Stars/Moons).
        2. Set a ratio (e.g. 2:3).
        3. Set 'given amount' (multiple of first ratio part).
        4. Calculate 'required amount'.
        5. Create 'riddleText' asking for the required amount.
        `;

        if (previousRiddle) {
            prompt += ` PREVIOUS RIDDLE ITEM: ${previousRiddle.ingredient1Name}. DO NOT USE ${previousRiddle.ingredient1Name} again. Pick completely different items.`;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        riddleText: { type: Type.STRING },
                        ingredient1Name: { type: Type.STRING },
                        ingredient2Name: { type: Type.STRING },
                        ratio1: { type: Type.INTEGER },
                        ratio2: { type: Type.INTEGER },
                        givenAmount: { type: Type.INTEGER },
                        requiredAmount: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                    },
                    required: ["riddleText", "ingredient1Name", "ingredient2Name", "ratio1", "ratio2", "givenAmount", "requiredAmount", "explanation"]
                },
            },
        });

        const data = parseJson(response.text.trim());
        
        if (previousRiddle && data.ingredient1Name === previousRiddle.ingredient1Name) {
            return fallback;
        }

        return data;
    } catch (error) {
        console.error("Error fetching sphinx riddle:", error);
        return fallback;
    }
};