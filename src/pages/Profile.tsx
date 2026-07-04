import { useEffect, useState } from 'react';
import { getProfile, saveProfile, type Profile } from '../lib/db';
import { Shield, Key, Save, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ id: 'default', name: '', apiKeys: ['', ''] });
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    getProfile().then(p => { if(p) setProfile(p) });
  }, []);

  const handleSave = async () => {
    await saveProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-col gap-6">
      <div>
        <h1>Director Profile</h1>
        <p>Manage your identity and API credentials.</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="text-primary" />
            <h2 style={{ margin: 0 }}>Bring Your Own Key (BYOK)</h2>
          </div>
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-button"
            style={{ fontSize: '0.85rem', padding: '8px 16px', color: 'var(--secondary)' }}
          >
            Get Free Gemini API Key <ExternalLink size={14} />
          </a>
        </div>
        
        <p>Director.ai runs 100% on your client. Your API keys are securely stored in your browser's IndexedDB and never sent to our servers. We use a dual-slot load balancer to prevent rate-limiting during rapid generation.</p>
        
        <div className="mt-6 flex-col gap-4">
          <div>
            <label>Director Name</label>
            <input 
              className="glass-input" 
              placeholder="Your Stage Name (e.g., Christopher Nolan)" 
              value={profile.name} 
              onChange={e => setProfile({...profile, name: e.target.value})} 
            />
          </div>
          <div>
            <label><Key size={14} style={{ display: 'inline', marginRight: '4px' }}/> Gemini API Key 1 (Primary)</label>
            <input 
              className="glass-input" 
              type="password" 
              placeholder="AIzaSy..." 
              value={profile.apiKeys[0] || ''} 
              onChange={e => {
                const newKeys = [...profile.apiKeys];
                newKeys[0] = e.target.value;
                setProfile({...profile, apiKeys: newKeys});
              }} 
            />
          </div>
          <div>
            <label><Key size={14} style={{ display: 'inline', marginRight: '4px' }}/> Gemini API Key 2 (Rotation/Load Balancer)</label>
            <input 
              className="glass-input" 
              type="password" 
              placeholder="AIzaSy... (Optional but recommended)" 
              value={profile.apiKeys[1] || ''} 
              onChange={e => {
                const newKeys = [...profile.apiKeys];
                newKeys[1] = e.target.value;
                setProfile({...profile, apiKeys: newKeys});
              }} 
            />
          </div>
          <div>
            <label><Key size={14} style={{ display: 'inline', marginRight: '4px' }}/> Pollinations Image API Key (Optional)</label>
            <input 
              className="glass-input" 
              type="password" 
              placeholder="sk_..." 
              value={profile.pollinationsKey || ''} 
              onChange={e => setProfile({...profile, pollinationsKey: e.target.value})} 
            />
          </div>
        </div>

        <button className="glass-button primary mt-6" onClick={handleSave}>
          <Save size={18} /> {isSaved ? 'Saved Securely!' : 'Save Profile Config'}
        </button>
      </div>
    </motion.div>
  );
}
