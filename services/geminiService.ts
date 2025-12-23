
import { GoogleGenAI, Type } from "@google/genai";
import { VerificationResult, BoundingBox } from "../types";

// Initialized lazily to prevent crash if API key is missing on load
let ai: GoogleGenAI | null = null;

export async function verifyWithGemini(
  imageBase64: string,
  description: string,
  timestamp?: string
): Promise<VerificationResult> {
  if (!ai) {
    const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const storedKey = localStorage.getItem('gemini_api_key');
    const apiKey = envKey || storedKey;

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable. Please configure your API key.");
    }
    ai = new GoogleGenAI({ apiKey });
  }

  // Fix: Updated to gemini-2.5-flash as 1.5 is reported retired
  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are a Crisis Validator for an emergency response app. Analyze the provided image and user description.
  1. Determine if there is a visible hazard (Fire, Flood, Accident, Roadblock, etc.).
  2. Check if the image matches the user's description.
  3. Analyze the lighting and shadows in the image to determine if it is Day, Night, Dawn, or Dusk.
  4. Compare this visual time of day with the provided timestamp: ${timestamp || 'Not Provided'}. 
     - If the visual evidence contradicts the timestamp (e.g. Image is bright sunlight but timestamp is 11:00 PM), flag this as 'inconsistent'.
  5. Rate the severity from 1 to 10.
  6. Categorize the hazard.
  
  Return strictly JSON in this format: 
  { 
    "verified": boolean, 
    "severity": number, 
    "category": "Fire" | "Flood" | "Accident" | "Roadblock" | "Other", 
    "timeCheck": "consistent" | "inconsistent" | "uncertain",
    "summary": "Short 1-sentence summary of the hazard and time consistency." 
  }`;

  const prompt = `User Description: ${description}`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64.split(',')[1] || imageBase64,
          }
        },
        { text: prompt }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verified: {
            type: Type.BOOLEAN,
            description: "Whether the AI confirms the presence of a hazard."
          },
          severity: {
            type: Type.NUMBER,
            description: "Impact level from 1 (low) to 10 (catastrophic)."
          },
          category: {
            type: Type.STRING,
            description: "Type of hazard identified.",
            enum: ['Fire', 'Flood', 'Accident', 'Roadblock', 'Other']
          },
          timeCheck: {
            type: Type.STRING,
            description: "Consistency between visual time of day and timestamp.",
            enum: ['consistent', 'inconsistent', 'uncertain']
          },
          summary: {
            type: Type.STRING,
            description: "A concise summary of the visual evidence."
          }
        },
        required: ['verified', 'severity', 'category', 'summary', 'timeCheck']
      }
    }
  });

  // Fix: Access response.text property directly (not as a method) and handle undefined
  const text = response.text;
  if (!text) {
    throw new Error("AI verification failed: No response content received from the model.");
  }

  try {
    const data = JSON.parse(text);
    return data as VerificationResult;
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("AI verification failed to produce valid JSON data.");
  }
}

export async function detectSensitiveContent(
  imageBase64: string
): Promise<BoundingBox[]> {
  if (!ai) {
    const envKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    const storedKey = localStorage.getItem('gemini_api_key');
    const apiKey = envKey || storedKey;

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable. Please configure your API key.");
    }
    ai = new GoogleGenAI({ apiKey });
  }

  const model = 'gemini-2.5-flash';

  const systemInstruction = `You are a Privacy Guard AI. Analyze the image and identify sensitive areas to be redacted.
  Specifically look for:
  1. Human faces
  2. Blood or injuries
  3. Visible phone numbers or ID cards

  Return a JSON list of bounding boxes.
  Coordinates must be normalized [ymin, xmin, ymax, xmax] (0 to 1).
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64.split(',')[1] || imageBase64,
          }
        },
        { text: "Find all faces and blood spots." }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            box_2d: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: "ymin, xmin, ymax, xmax"
            },
            label: {
              type: Type.STRING,
              enum: ['face', 'blood', 'phone_number', 'id_card', 'other']
            }
          },
          required: ['box_2d', 'label']
        }
      }
    }
  });

  const text = response.text;
  if (!text) {
    return [];
  }

  try {
    const data = JSON.parse(text);
    return data as BoundingBox[];
  } catch (error) {
    console.error("Failed to parse Gemini bbox response", error);
    return [];
  }
}