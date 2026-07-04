import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCharacters, type Character, saveStory, type Story } from '../lib/db';
import { buildOrchestratorPrompt } from '../lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Plus, X } from 'lucide-react';

export default function StoryConfig() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [name, setName] = useState('');
  const [startingPoint, setStartingPoint] = useState('');
  const [selectedChars, setSelectedChars] = useState<string[]>(['', '']); // Start with 2 required
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
      setSelectedChars([c[0].id, c[1].id]);
    }
  };

  const updateSelectedChar = (index: number, val: string) => {
    const newArr = [...selectedChars];
    newArr[index] = val;
    setSelectedChars(newArr);
  };

  const removeChar = (index: number) => {
    const newArr = [...selectedChars];
    newArr.splice(index, 1);
    setSelectedChars(newArr);
  };

  const handleStart = async () => {
    const uniqueChars = new Set(selectedChars.filter(c => c !== ''));
    if (!name || !startingPoint || !dynamics || uniqueChars.size < 2) {
      alert("Please fill all fields and select at least two different characters.");
      return;
    }

    setIsParsing(true);
    try {
      const activeCharIds = Array.from(uniqueChars);
      const activeCharObjs = activeCharIds.map(id => characters.find(c => c.id === id)!).filter(Boolean);
      
      const orchestratorPrompt = await buildOrchestratorPrompt(dynamics, activeCharObjs);
      
      const newStory: Story = {
        id: crypto.randomUUID(),
        name,
        startingPoint,
        characterIds: activeCharIds,
        relationshipDynamics: dynamics,
        createdAt: Date.now(),
        orchestratorPrompt: orchestratorPrompt,
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

          <div>
            <div className="flex justify-between items-center mb-4">
              <label>Cast (Min 2)</label>
              {selectedChars.length < Math.min(4, characters.length) && (
                <button 
                  className="glass-button" 
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedChars([...selectedChars, characters[0]?.id || ''])}
                >
                  <Plus size={14} /> Add Character
                </button>
              )}
            </div>
            
            <AnimatePresence>
              {selectedChars.map((charId, idx) => (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  key={idx} 
                  className="flex items-center gap-2 mb-2"
                >
                  <select 
                    className="glass-input" 
                    value={charId} 
                    onChange={e => updateSelectedChar(idx, e.target.value)}
                  >
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {idx >= 2 && (
                    <button className="glass-button danger" style={{ padding: '12px' }} onClick={() => removeChar(idx)}>
                      <X size={16} />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div>
            <label>Relationship Dynamics & Story Premise</label>
            <textarea 
              className="glass-input mt-4" 
              value={dynamics} 
              onChange={e => setDynamics(e.target.value)} 
              placeholder="e.g. Amit secretly loves Neha, but Neha is obsessed with revenge. Raj is the wild card..."
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>* This will be woven into the AI Orchestrator's core memory.</p>
          </div>

          <button 
            className="glass-button primary w-full" 
            style={{ marginTop: '1rem', padding: '15px' }} 
            onClick={handleStart}
            disabled={isParsing}
          >
            {isParsing ? 'Assembling Cast & Initializing Memory...' : <><Play size={18} /> Action!</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
