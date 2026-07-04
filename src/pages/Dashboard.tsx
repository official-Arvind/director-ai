import { useEffect, useState } from 'react';
import { getProfile, saveProfile, type Profile, type Character, getCharacters, saveCharacter, deleteCharacter } from '../lib/db';
import { polishCharacterNotes } from '../lib/gemini';
import { Settings, Plus, Wand2, Trash2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile>({ id: 'default', name: '', apiKeys: ['', ''] });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [editingChar, setEditingChar] = useState<Partial<Character> | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await getProfile();
    if (p) setProfile(p);
    const c = await getCharacters();
    setCharacters(c);
  };

  const handleSaveProfile = async () => {
    await saveProfile(profile);
    setShowSettings(false);
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
    await deleteCharacter(id);
    loadData();
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
    <div className="container">
      <header className="flex justify-between items-center mb-4 mt-4">
        <div>
          <h1>Director.ai</h1>
          <p>By Jigar Corporation Pvt Ltd</p>
        </div>
        <button className="glass-button" onClick={() => setShowSettings(!showSettings)}>
          <Settings size={18} /> {profile.name ? `Welcome, ${profile.name}` : 'Setup Profile'}
        </button>
      </header>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel mb-4 overflow-hidden"
          >
            <div style={{ padding: '2rem' }}>
              <h2>Director Profile & BYOK</h2>
              <div className="grid-2">
                <div>
                  <label>Director Name</label>
                  <input 
                    className="glass-input mt-4" 
                    placeholder="Your Name" 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})} 
                  />
                </div>
                <div>
                  <label>Gemini API Key 1 (Primary)</label>
                  <input 
                    className="glass-input mt-4" 
                    type="password" 
                    placeholder="AIzaSy..." 
                    value={profile.apiKeys[0] || ''} 
                    onChange={e => {
                      const newKeys = [...profile.apiKeys];
                      newKeys[0] = e.target.value;
                      setProfile({...profile, apiKeys: newKeys});
                    }} 
                  />
                  <label className="mt-4" style={{display: 'block'}}>Gemini API Key 2 (Rotation/Load Balancer)</label>
                  <input 
                    className="glass-input mt-4" 
                    type="password" 
                    placeholder="AIzaSy..." 
                    value={profile.apiKeys[1] || ''} 
                    onChange={e => {
                      const newKeys = [...profile.apiKeys];
                      newKeys[1] = e.target.value;
                      setProfile({...profile, apiKeys: newKeys});
                    }} 
                  />
                </div>
              </div>
              <button className="glass-button primary mt-4" onClick={handleSaveProfile}>Save Configuration</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid-2">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2>Character Vault</h2>
            <button className="glass-button" onClick={() => setEditingChar({})}>
              <Plus size={18} /> New Character
            </button>
          </div>
          
          <div className="flex-col gap-4">
            {characters.map(char => (
              <motion.div layout key={char.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>{char.name}, {char.age}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{char.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="glass-button" onClick={() => setEditingChar(char)}>Edit</button>
                  <button className="glass-button danger" onClick={() => handleDeleteCharacter(char.id)}><Trash2 size={16}/></button>
                </div>
              </motion.div>
            ))}
            {characters.length === 0 && <p>Your vault is empty. Create a character.</p>}
          </div>
        </div>

        <div>
          {editingChar ? (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: '2rem' }}>
              <h2>{editingChar.id ? 'Edit Character' : 'New Character'}</h2>
              <div className="flex gap-4 mb-4">
                <input className="glass-input" placeholder="Name" value={editingChar.name || ''} onChange={e => setEditingChar({...editingChar, name: e.target.value})} />
                <input className="glass-input" type="number" placeholder="Age" style={{ width: '100px' }} value={editingChar.age || ''} onChange={e => setEditingChar({...editingChar, age: parseInt(e.target.value)})} />
              </div>
              
              <div style={{ position: 'relative' }}>
                <textarea 
                  className="glass-input" 
                  placeholder="Rough structural description..." 
                  style={{ minHeight: '200px', resize: 'vertical' }}
                  value={editingChar.description || ''}
                  onChange={e => setEditingChar({...editingChar, description: e.target.value})}
                />
                <button 
                  className="glass-button primary" 
                  style={{ position: 'absolute', bottom: '1rem', right: '1rem' }}
                  onClick={handleAIPolish}
                  disabled={isPolishing}
                >
                  <Wand2 size={16} /> {isPolishing ? 'Polishing...' : 'AI Polish'}
                </button>
              </div>

              <div className="flex justify-between mt-4">
                <button className="glass-button" onClick={() => setEditingChar(null)}>Cancel</button>
                <button className="glass-button primary" onClick={handleSaveCharacter}>Save to Vault</button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel flex-col items-center justify-center" style={{ padding: '4rem', textAlign: 'center', height: '100%' }}>
              <BookOpen size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
              <h2>Start a Story</h2>
              <p>Ready to direct a new scene?</p>
              <button className="glass-button primary" onClick={() => navigate('/config')} disabled={characters.length < 2}>
                Configure New Story
              </button>
              {characters.length < 2 && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem' }}>You need at least 2 characters in your vault.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
