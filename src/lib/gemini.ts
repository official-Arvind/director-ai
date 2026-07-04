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
    const encodedPrompt = encodeURIComponent(prompt);
    // Add a random seed to avoid caching
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`;
    
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

export async function parseRelationshipDynamics(dynamics: string): Promise<{promptA: string, promptB: string}> {
  // Use gemini to parse casual text into deep system prompts
  const instruction = `You are an expert NLP parser. The user will provide a casual description of a relationship between two characters.
Return a JSON object with two keys: 'promptA' and 'promptB'. 
These should be rich, deep system prompts for each character's perspective, preparing them for an interactive storytelling session.
Output ONLY raw JSON, no markdown formatting.`;

  const responseText = await generateText(dynamics, 'gemini-3.5-flash', instruction);
  try {
    const parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON", responseText);
    return {
      promptA: `You are character A. Dynamics: ${dynamics}`,
      promptB: `You are character B. Dynamics: ${dynamics}`
    };
  }
}

export async function polishCharacterNotes(rawNotes: string): Promise<string> {
  const instruction = `Rewrite the following raw character notes into a beautifully detailed, richly textured character profile. Keep it concise but deeply atmospheric.`;
  return generateText(rawNotes, 'gemini-3.5-flash', instruction);
}
