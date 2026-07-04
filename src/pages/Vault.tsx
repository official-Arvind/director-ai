import { useEffect, useState } from 'react';
import { type Character, getCharacters, saveCharacter, deleteCharacter } from '../lib/db';
import { polishCharacterNotes } from '../lib/gemini';
import { Plus, Trash2, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VaultPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const c = await getCharacters();
    setCharacters(c);
  };

  const handleSaveCharacter = async () => {
    if (editingChar && editingChar.name) {
      const charToSave: Character = {
        id: editingChar.id || crypto.randomUUID(),
        name: editingChar.name,
        age: editingChar.age || 30,
        description: editingChar.description || '',
        createdAt: editingChar.createdAt || Date.now(),
      };
      await saveCharacter(charToSave);
      setEditingChar(null);
      loadData();
    }
  };

  const handleDeleteCharacter = async (id: string) => {
    if (window.confirm("Delete character?")) {
      await deleteCharacter(id);
      loadData();
    }
  };

  const handleAIPolish = async () => {
    if (!editingChar?.description) return;
    try {
      setIsPolishing(true);
      const polished = await polishCharacterNotes(editingChar.description);
      setEditingChar({ ...editingChar, description: polished });
    } catch (e) {
      alert("Failed to polish. Ensure API keys are set and valid.");
      console.error(e);
    } finally {
      setIsPolishing(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1>Character Vault</h1>
          <p>Create and persist your cast of AI characters.</p>
        </div>
        <button className="glass-button primary" onClick={() => setEditingChar({})}>
          <Plus size={18} /> New Character
        </button>
      </div>

      <div className="grid-2">
        <div className="flex-col gap-4">
          <AnimatePresence>
            {characters.map(char => (
              <motion.div 
                layout 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={char.id} 
                className="vault-item"
              >
                <div style={{ flex: 1, paddingRight: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{char.name} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({char.age})</span></h3>
                  <p style={{ margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{char.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="glass-button" onClick={() => setEditingChar(char)}>Edit</button>
                  <button className="glass-button danger" style={{ padding: '12px' }} onClick={() => handleDeleteCharacter(char.id)}><Trash2 size={16}/></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {characters.length === 0 && (
            <div className="glass-panel text-center" style={{ padding: '3rem' }}>
              <p>Your vault is empty. Time to create someone interesting.</p>
            </div>
          )}
        </div>

        <div>
          {editingChar && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
              <h2>{editingChar.id ? 'Edit Character' : 'New Character'}</h2>
              <div className="flex gap-4 mb-4">
                <div className="w-full">
                  <label>Name</label>
                  <input className="glass-input" placeholder="e.g. Arthur Shelby" value={editingChar.name || ''} onChange={e => setEditingChar({...editingChar, name: e.target.value})} />
                </div>
                <div>
                  <label>Age</label>
                  <input className="glass-input" type="number" placeholder="Age" style={{ width: '100px' }} value={editingChar.age || ''} onChange={e => setEditingChar({...editingChar, age: parseInt(e.target.value)})} />
                </div>
              </div>
              
              <div style={{ position: 'relative', marginTop: '1.5rem' }}>
                <label>Structural Description</label>
                <textarea 
                  className="glass-input" 
                  placeholder="Rough structural description... e.g. He is a retired assassin trying to bake cakes." 
                  style={{ minHeight: '300px', resize: 'vertical' }}
                  value={editingChar.description || ''}
                  onChange={e => setEditingChar({...editingChar, description: e.target.value})}
                />
                <button 
                  className="glass-button primary" 
                  style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem' }}
                  onClick={handleAIPolish}
                  disabled={isPolishing}
                >
                  <Wand2 size={16} /> {isPolishing ? 'Polishing...' : 'AI Polish'}
                </button>
              </div>

              <div className="flex justify-between mt-6">
                <button className="glass-button" onClick={() => setEditingChar(null)}>Cancel</button>
                <button className="glass-button primary" onClick={handleSaveCharacter}>Save to Vault</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
