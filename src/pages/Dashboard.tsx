import { useEffect, useState } from 'react';
import { getProfile, type Profile, type Character, getCharacters, getStories, type Story } from '../lib/db';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, BookOpen, Clock } from 'lucide-react';

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile>({ id: 'default', name: '', apiKeys: ['', ''] });
  const [characters, setCharacters] = useState<Character[]>([]);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const p = await getProfile();
    if (p) setProfile(p);
    
    const c = await getCharacters();
    setCharacters(c);

    const s = await getStories();
    // Sort by most recent
    setRecentStories(s.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-col gap-6">
      <header className="dashboard-header">
        <h1>{profile.name ? `Welcome, ${profile.name}` : 'Welcome, Director'}</h1>
        <p>The studio is ready for your next scene.</p>
      </header>

      <div className="grid-2">
        <div className="glass-panel p-6 flex-col justify-center items-center text-center" style={{ padding: '4rem 2rem' }}>
          <Play size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
          <h2>Start a Story</h2>
          <p style={{ marginBottom: '2rem' }}>Ready to direct a new scene?</p>
          <button className="glass-button primary" onClick={() => navigate('/config')} disabled={characters.length < 2}>
            Configure New Story
          </button>
          {characters.length < 2 && <p style={{ color: 'var(--danger)', marginTop: '1rem', fontSize: '0.9rem' }}>You need at least 2 characters in your vault.</p>}
        </div>

        <div className="flex-col gap-4">
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-primary" />
              <h3 style={{ margin: 0 }}>Vault Overview</h3>
            </div>
            <p style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 1rem 0' }}>{characters.length}</p>
            <p style={{ margin: 0 }}>Characters saved in your local vault.</p>
            <button className="glass-button mt-4" onClick={() => navigate('/vault')}>Manage Vault</button>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-secondary" />
              <h3 style={{ margin: 0 }}>Recent Stories</h3>
            </div>
            
            {recentStories.length === 0 ? (
              <p>No stories yet. Time to create one.</p>
            ) : (
              <div className="flex-col gap-2">
                {recentStories.map(story => (
                  <div key={story.id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <span style={{ fontWeight: 600 }}>{story.name}</span>
                    <button className="glass-button" style={{ padding: '8px 16px', fontSize: '0.8rem' }} onClick={() => navigate(`/story/${story.id}`)}>Continue</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
