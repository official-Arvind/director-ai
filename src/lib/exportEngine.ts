import { generateText } from './gemini';
import { type Story, type Message, type Character } from './db';

const EMBEDDED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
:root {
  --bg-color: #0b0c10;
  --panel-bg: rgba(25, 27, 33, 0.7);
  --primary: #c5a880;
  --secondary: #45a29e;
  --text-main: #e2e2e2;
  --text-muted: #888c94;
}
body {
  font-family: 'Outfit', sans-serif;
  background-color: var(--bg-color);
  color: var(--text-main);
  line-height: 1.8;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}
h1 {
  text-align: center;
  color: var(--primary);
  margin-bottom: 0.5rem;
  font-size: 3rem;
}
.subtitle {
  text-align: center;
  color: var(--secondary);
  font-size: 1.2rem;
  margin-bottom: 4rem;
  text-transform: uppercase;
  letter-spacing: 2px;
}
.narrative {
  font-size: 1.15rem;
  white-space: pre-wrap;
  margin-bottom: 2rem;
}
.footer {
  text-align: center;
  margin-top: 5rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 2rem;
}
`;

export async function exportCleanStory(
  story: Story, 
  messages: Message[], 
  characters: Record<string, Character>,
  styleBlueprint: string
): Promise<Blob> {
  
  const rawTimeline = messages.map(m => {
    if (m.characterId === 'system') return `[SCENE SETTING]: ${m.content}`;
    if (m.characterId === 'user') return `[DIRECTOR INJECTION]: ${m.content}`;
    const charName = characters[m.characterId]?.name || 'Unknown';
    return `${charName}: ${m.content}`;
  }).join('\n\n');

  const systemInstruction = `You are a master storyteller. Your job is to rewrite the raw conversational timeline into a flawless, cohesive, professional narrative masterpiece.
Do NOT use a script format (e.g. "Name: ..."). Instead, weave it into a proper novel-like format with scene descriptions, internal monologues, and dialogue tags.
Style Blueprint: ${styleBlueprint || 'Cinematic, rich, atmospheric, professional prose.'}`;

  // Use gemini-1.5-flash to avoid Free Tier Rate Limits on Pro models
  const rewrittenNarrative = await generateText(rawTimeline, 'gemini-1.5-flash', systemInstruction);

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${story.name} - Director's Cut</title>
    <style>${EMBEDDED_CSS}</style>
</head>
<body>
    <h1>${story.name}</h1>
    <div class="subtitle">A Director.ai Masterpiece</div>
    
    <div class="narrative">${rewrittenNarrative.replace(/\n/g, '<br/>')}</div>
    
    <div class="footer">
      Exported from Director.ai | A Jigar Corporation Pvt Ltd Technology
    </div>
</body>
</html>`;

  return new Blob([htmlContent], { type: 'text/html' });
}
