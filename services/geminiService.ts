
import { GoogleGenAI, Type } from "@google/genai";
import { Level2Challenge, SphinxRiddle } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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

        const newRecipe = JSON.parse(response.text.trim());

        if (previousRecipe && newRecipe.green === previousRecipe.green && newRecipe.purple === previousRecipe.purple) {
            console.warn("AI returned the same recipe. Using fallback logic.");
            return getFallback();
        }

        return newRecipe;
    } catch (error) {
        console.error("Error fetching new recipe:", error);
        return getFallback();
    }
};

export const getLevel1Hint = async (actualGreen: number, actualPurple: number, expectedGreen: number, expectedPurple: number): Promise<string> => {
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

export const getNewLevel2Challenge = async (): Promise<Level2Challenge | null> => {
    try {
        const prompt = `You are a ratio logic engine for a potion game. Create a new challenge for scaling a recipe with "Fire Salts" and "Frost Dew".
        Provide a JSON response with:
        1. "potionName": A creative name for a large potion (e.g. "Giant's Growth Elixir").
        2. "baseRatio1": A number between 1 and 5 for the "Fire Salts".
        3. "baseRatio2": A number between 1 and 5 for the "Frost Dew". Ensure it's different from baseRatio1 and the ratio is simplified.
        4. "scaleFactor": A whole number between 2 and 5.
        5. "givenPart1": The value of baseRatio1 * scaleFactor.
        6. "scaled_part_2": The correct answer, which is baseRatio2 * scaleFactor.
        7. "total_units": The total drops in the new recipe (givenPart1 + scaled_part_2).
        8. "hint": A simple hint, like "You're making the batch X times bigger, so you'll need X times as much Frost Dew!"`;

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

        const jsonText = response.text.trim();
        const challengeData = JSON.parse(jsonText);

        return {
            ...challengeData,
            ingredient1Name: "Fire Salts",
            ingredient2Name: "Frost Dew",
        };
    } catch (error) {
        console.error("Error fetching new level 2 challenge:", error);
        return {
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
    }
};

export const getSphinxRiddle = async (): Promise<SphinxRiddle | null> => {
    try {
        const prompt = `Generate a very simple ratio word problem for a child (ages 7-10).
        
        Logic:
        1. Pick two simple, fun items (e.g. "Red Apples", "Blue Berries", "Magic Stars", "Gold Coins", "Frogs"). Avoid complex fantasy jargon.
        2. Establish a simple ratio between them (e.g., 2:3).
        3. Determine a 'given amount' for the first ingredient that is a multiple of its ratio part (e.g., if ratio is 2:3, given might be 6).
        4. Calculate the 'required amount' for the second ingredient.
        5. Create a short, clear riddle text spoken by a friendly Sphinx asking for the required amount. Keep sentences short and simple.
        
        Example Riddle Text: "For every 2 Red Apples, I need 3 Blue Berries. I have 6 Red Apples. How many Blue Berries do I need?"
        
        Response JSON format:
        {
           "riddleText": "The text of the riddle...",
           "ingredient1Name": "Name of first item",
           "ingredient2Name": "Name of second item",
           "ratio1": integer,
           "ratio2": integer,
           "givenAmount": integer,
           "requiredAmount": integer,
           "explanation": "A very simple explanation (e.g. 'Since you have 3 times the apples, you need 3 times the berries!')"
        }`;

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

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching sphinx riddle:", error);
        // Fallback riddle
        return {
            riddleText: "For every 2 Red Gems, you need 3 Blue Gems. I have 4 Red Gems here. How many Blue Gems do I need to match?",
            ingredient1Name: "Red Gems",
            ingredient2Name: "Blue Gems",
            ratio1: 2,
            ratio2: 3,
            givenAmount: 4,
            requiredAmount: 6,
            explanation: "4 Red Gems is double the amount of 2. So you need double the Blue Gems (3 + 3 = 6)."
        };
    }
};
