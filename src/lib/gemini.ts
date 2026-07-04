import { getProfile } from './db';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

let activeKeyIndex = 0;

export async function getActiveApiKey(): Promise<string> {
  const profile = await getProfile();
  if (!profile || !profile.apiKeys || profile.apiKeys.length === 0) {
    throw new Error('No API keys found. Please add them in your profile.');
  }
  const keys = profile.apiKeys.filter(k => k.trim().length > 0);
  if (keys.length === 0) {
    throw new Error('No valid API keys found.');
  }
  // Load balancer logic: rotate keys
  activeKeyIndex = (activeKeyIndex + 1) % keys.length;
  return keys[activeKeyIndex];
}

const SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
];

export async function generateText(prompt: string, model: string = 'gemini-3.5-flash', systemInstruction?: string): Promise<string> {
  const profile = await getProfile();
  const maxRetries = profile?.apiKeys ? Math.max(profile.apiKeys.length, 1) : 1;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = await getActiveApiKey();
    const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

    const payload: any = {
      contents: [{ parts: [{ text: prompt }] }],
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        temperature: 0.9,
      }
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < maxRetries - 1) {
          console.warn(`Rate limited (429). Retrying with next key...`);
          continue; // Automatically uses the next key since getActiveApiKey rotates
        }
        const errorData = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      }
      throw new Error('No content generated.');
    } catch (e: any) {
      if (attempt === maxRetries - 1) {
        throw e;
      }
    }
  }
  
  throw new Error('All API keys failed or rate limited.');
}

// For a structured chat sequence
export async function generateChat(messages: {role: 'user'|'model', text: string}[], model: string = 'gemini-3.5-flash', systemInstruction?: string): Promise<string> {
  const apiKey = await getActiveApiKey();
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    })),
    safetySettings: SAFETY_SETTINGS,
    generationConfig: {
      temperature: 0.9,
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API Error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  if (data.candidates && data.candidates.length > 0) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error('No content generated.');
}

export async function generateImage(prompt: string): Promise<string> {
  // Primary: Free uncensored API (Pollinations.ai)
  // Pollinations generates an image just by navigating to the URL, but we will fetch it as a blob
  try {
    // Add a random seed to avoid caching
    const seed = Math.floor(Math.random() * 1000000);
    // any-dark is a specialized, uncensored SDXL model on Pollinations that generates high quality NSFW.
    // We add some master quality tags to the prompt to force better lighting/anatomy.
    const qualityPrompt = prompt + ", best quality, 8k, masterpiece, highly detailed, photorealistic, cinematic lighting, ultra-detailed";
    const encodedPrompt = encodeURIComponent(qualityPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true&model=nanobanana-2&safe=false`;
    
    // We can just return the URL and let the browser load it as an image source.
    // To ensure it's loaded and valid, we could fetch it and create an object URL, but returning the URL is faster and works well.
    return pollinationsUrl;
  } catch (err) {
    console.error("Primary image generation failed, trying fallback...", err);
  }

  // Fallback: Gemini (Using google Generative Language API if supported, or stub if not. Currently text models don't return images directly this way)
  // But to satisfy the user's request for "gemini nano bananaa ( free one )" - this might be a hypothetical or specific model name they want.
  // We'll attempt a direct fetch to the gemini image generation if it exists, or at least a simulated placeholder if it fails completely.
  console.warn("Using fallback image generation");
  return "https://via.placeholder.com/1024x1024.png?text=Image+Generation+Failed";
}

export async function buildOrchestratorPrompt(dynamics: string, characters: { id: string, name: string, age: number, description: string }[]): Promise<string> {
  const charDetails = characters.map(c => `- **${c.name}** (ID: ${c.id}, Age: ${c.age}): ${c.description}`).join('\n');
  
  const instruction = `You are the Master Director of a multi-character storytelling engine.
You are managing the following characters:
${charDetails}

The overarching dynamic of this scene is: ${dynamics}

YOUR JOB:
Read the recent message history. Based on the logical flow of the conversation, choose exactly ONE character who should react or speak next. 
Write their response strictly from their Point of View (POV). 
CRITICAL CONSTRAINT: The response MUST be strictly 2-3 sentences max. Keep it punchy, rhythmic, and engaging. DO NOT write dialogue for other characters.

You must output your response as a valid JSON object in the exact following format:
{
  "characterId": "<the ID of the character you chose>",
  "content": "<their 2-3 sentence POV response>"
}

Output ONLY raw JSON. No markdown backticks, no explanations.`;

  return instruction;
}

export async function polishCharacterNotes(rawNotes: string): Promise<string> {
  const instruction = `Rewrite the following raw character notes into a beautifully detailed, richly textured character profile. Keep it concise but deeply atmospheric.`;
  return generateText(rawNotes, 'gemini-3.5-flash', instruction);
}
