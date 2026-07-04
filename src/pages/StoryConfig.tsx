import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCharacters, type Character, saveStory, type Story } from '../lib/db';
import { parseRelationshipDynamics } from '../lib/gemini';
import { motion } from 'framer-motion';
import { ArrowLeft, Play } from 'lucide-react';

export default function StoryConfig() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [name, setName] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [charA, setCharA] = useState<string>('');
  const [charB, setCharB] = useState<string>('');
  const [dynamics, setDynamics] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadChars();
  }, []);

  const loadChars = async () => {
    const c = await getCharacters();
    setCharacters(c);
    if (c.length >= 2) {
      setCharA(c[0].id);
      setCharB(c[1].id);
    }
  };

  const handleStart = async () => {
    if (!name || !startingPoint || !charA || !charB || charA === charB || !dynamics) {
      alert("Please fill all fields and select two different characters.");
      return;
    }

    setIsParsing(true);
    try {
      // Background NLP parsing to weave deep system prompts
      const parsedPrompts = await parseRelationshipDynamics(dynamics);
      
      const charAObj = characters.find(c => c.id === charA);
      const charBObj = characters.find(c => c.id === charB);
      
      const basePromptA = `You are ${charAObj?.name}, age ${charAObj?.age}. ${charAObj?.description}.
Your current relationship dynamic: ${parsedPrompts.promptA}
Keep responses to 2-3 sentences max. Do NOT write dialogue for the other character. Drive the story forward playfully, intensely, or dramatically based on your persona.`;
      
      const basePromptB = `You are ${charBObj?.name}, age ${charBObj?.age}. ${charBObj?.description}.
Your current relationship dynamic: ${parsedPrompts.promptB}
Keep responses to 2-3 sentences max. Do NOT write dialogue for the other character. Drive the story forward playfully, intensely, or dramatically based on your persona.`;

      const newStory: Story = {
        id: crypto.randomUUID(),
        name,
        startingPoint,
        characterIds: [charA, charB],
        relationshipDynamics: dynamics,
        createdAt: Date.now(),
        systemPromptA: basePromptA,
        systemPromptB: basePromptB,
      };

      await saveStory(newStory);
      navigate(`/story/${newStory.id}`);

    } catch (e) {
      alert("Failed to parse dynamics. Check API keys.");
      console.error(e);
      setIsParsing(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '4rem 2rem' }}>
      <button className="glass-button mb-4" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '3rem' }}>
        <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Director's Cut Configuration</h1>
        
        <div className="flex-col gap-4">
          <div>
            <label>Story Name</label>
            <input className="glass-input mt-4" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Midnight Heist" />
          </div>

          <div>
            <label>Starting Point & Opening Scene</label>
            <textarea 
              className="glass-input mt-4" 
              value={startingPoint} 
              onChange={e => setStartingPoint(e.target.value)} 
              placeholder="e.g. A rainy night in an abandoned warehouse..."
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="grid-2">
            <div>
              <label>Character A (POV 1)</label>
              <select className="glass-input mt-4" value={charA} onChange={e => setCharA(e.target.value)}>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label>Character B (POV 2)</label>
              <select className="glass-input mt-4" value={charB} onChange={e => setCharB(e.target.value)}>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label>Relationship Dynamics</label>
            <textarea 
              className="glass-input mt-4" 
              value={dynamics} 
              onChange={e => setDynamics(e.target.value)} 
              placeholder="e.g. Amit secretly loves Neha, but Neha is obsessed with revenge; they meet during a storm."
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>* This will be parsed by the AI to create deep psychological system prompts.</p>
          </div>

          <button 
            className="glass-button primary w-full" 
            style={{ marginTop: '1rem', padding: '15px' }} 
            onClick={handleStart}
            disabled={isParsing}
          >
            {isParsing ? 'Parsing Story Matrix...' : <><Play size={18} /> Action!</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
