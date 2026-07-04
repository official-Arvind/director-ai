import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStory, type Story, getMessages, type Message, saveMessage, getCharacters, type Character } from '../lib/db';
import { generateText, generateImage } from '../lib/gemini';
import { exportCleanStory } from '../lib/exportEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Image as ImageIcon, Pause, Play, Download, Send, ArrowLeft, User } from 'lucide-react';

export default function StoryFlow() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [activeTurn, setActiveTurn] = useState<string | null>(null);
  
  const [exportStyle, setExportStyle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyId) loadStory(storyId);
  }, [storyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isPaused && !isGenerating && story) {
      triggerNextTurn();
    }
  }, [isPaused, messages]); // trigger when unpaused or after a message is added

  const loadStory = async (id: string) => {
    const s = await getStory(id);
    if (!s) {
      navigate('/');
      return;
    }
    setStory(s);
    
    const chars = await getCharacters();
    const charMap: Record<string, Character> = {};
    chars.forEach(c => charMap[c.id] = c);
    setCharacters(charMap);

    const msgs = await getMessages(id);
    msgs.sort((a, b) => a.timestamp - b.timestamp);
    
    if (msgs.length === 0) {
      // Inject starting point
      const startMsg: Message = {
        id: crypto.randomUUID(),
        storyId: id,
        characterId: 'system',
        content: s.startingPoint,
        timestamp: Date.now()
      };
      await saveMessage(startMsg);
      setMessages([startMsg]);
    } else {
      setMessages(msgs);
    }
    
    // Determine active turn (charA if last was system or charB, charB if last was charA)
    const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
    if (!lastMsg || lastMsg.characterId === 'system' || lastMsg.characterId === s.characterIds[1]) {
      setActiveTurn(s.characterIds[0]);
    } else {
      setActiveTurn(s.characterIds[1]);
    }
  };

  const triggerNextTurn = async () => {
    if (!story || isPaused || isGenerating) return;
    
    setIsGenerating(true);
    const currentCharId = activeTurn || story.characterIds[0];
    const systemPrompt = currentCharId === story.characterIds[0] ? story.systemPromptA : story.systemPromptB;
    
    // Build context string from last 10 messages
    const contextMsgs = messages.slice(-10).map(m => {
      if (m.characterId === 'system') return `[SCENE]: ${m.content}`;
      if (m.characterId === 'user') return `[DIRECTOR INJECTION]: ${m.content}`;
      const charName = characters[m.characterId]?.name || 'Unknown';
      return `${charName}: ${m.content}`;
    }).join('\n\n');

    const prompt = `Context timeline:\n${contextMsgs}\n\nIt is your turn to respond.`;

    try {
      const response = await generateText(prompt, 'gemini-3.5-flash', systemPrompt);
      
      const newMsg: Message = {
        id: crypto.randomUUID(),
        storyId: story.id,
        characterId: currentCharId,
        content: response,
        timestamp: Date.now()
      };
      
      await saveMessage(newMsg);
      setMessages(prev => [...prev, newMsg]);
      
      // Toggle turn
      setActiveTurn(currentCharId === story.characterIds[0] ? story.characterIds[1] : story.characterIds[0]);
      
    } catch (e) {
      console.error(e);
      setIsPaused(true);
      alert("Generation failed. Check console and API limits.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUserInject = async () => {
    if (!userInput.trim() || !story) return;
    
    setIsPaused(true); // Pause auto-generation if user injects
    
    const newMsg: Message = {
      id: crypto.randomUUID(),
      storyId: story.id,
      characterId: 'user',
      content: userInput.trim(),
      timestamp: Date.now()
    };
    
    await saveMessage(newMsg);
    setMessages(prev => [...prev, newMsg]);
    setUserInput('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerateImage = async (msgIndex: number) => {
    // Extract context up to this message
    const ctx = messages.slice(0, msgIndex + 1).map(m => m.content).join(' ');
    // Use gemini to distill it into a short image prompt
    try {
      const promptToImage = await generateText("Distill this scene into a highly visual, single-sentence image generation prompt for an AI art generator. Focus on lighting, mood, characters, and environment. No dialogue. Scene: " + ctx);
      const imgUrl = await generateImage(promptToImage);
      // Open in new tab for gallery view
      window.open(imgUrl, '_blank');
    } catch (e) {
      alert("Failed to generate image.");
      console.error(e);
    }
  };

  const handleExport = async () => {
    if (!story) return;
    setIsExporting(true);
    try {
      const blob = await exportCleanStory(story, messages, characters, exportStyle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.name.replace(/\s+/g, '_')}_DirectorsCut.html`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (e) {
      alert("Export failed.");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!story) return <div className="container text-center mt-4">Loading Scene...</div>;

  return (
    <div className="container flex-col" style={{ height: '100vh', padding: '1rem', maxWidth: '900px' }}>
      
      <header className="glass-panel flex justify-between items-center" style={{ padding: '1rem 2rem', marginBottom: '1rem' }}>
        <div className="flex items-center gap-4">
          <button className="glass-button" style={{ padding: '8px' }} onClick={() => navigate('/')}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h3 style={{ margin: 0 }}>{story.name}</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)' }}>
              {characters[story.characterIds[0]]?.name} vs {characters[story.characterIds[1]]?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={`glass-button ${isPaused ? 'primary' : ''}`} onClick={() => setIsPaused(!isPaused)}>
            {isPaused ? <><Play size={16}/> Resume</> : <><Pause size={16}/> Pause</>}
          </button>
          <button className="glass-button" onClick={() => setShowExportModal(true)}>
            <Download size={16}/> Compile
          </button>
        </div>
      </header>

      <div className="glass-panel flex-col" style={{ flex: 1, overflowY: 'auto', padding: '2rem', gap: '1.5rem', marginBottom: '1rem' }}>
        <AnimatePresence>
          {messages.map((m, idx) => {
            const isSystem = m.characterId === 'system';
            const isUser = m.characterId === 'user';
            const char = characters[m.characterId];
            
            // Align: char A left, char B right, system/user center
            let align = 'center';
            if (m.characterId === story.characterIds[0]) align = 'flex-start';
            if (m.characterId === story.characterIds[1]) align = 'flex-end';

            return (
              <motion.div 
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: align,
                  width: '100%' 
                }}
              >
                <div style={{ 
                  maxWidth: '80%', 
                  background: isSystem ? 'transparent' : isUser ? 'rgba(69, 162, 158, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: isSystem ? 'none' : '1px solid var(--glass-border)',
                  padding: '1rem 1.5rem',
                  borderRadius: '16px',
                  position: 'relative',
                  borderBottomLeftRadius: align === 'flex-start' ? 0 : '16px',
                  borderBottomRightRadius: align === 'flex-end' ? 0 : '16px',
                  color: isSystem ? 'var(--primary)' : 'inherit',
                  fontStyle: isSystem ? 'italic' : 'normal',
                  textAlign: isSystem ? 'center' : 'left'
                }}>
                  {!isSystem && !isUser && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {char?.name}
                    </div>
                  )}
                  {isUser && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> DIRECTOR INJECTION
                    </div>
                  )}
                  
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  
                  {!isSystem && (
                    <div className="flex gap-2" style={{ marginTop: '0.8rem', justifyContent: 'flex-end' }}>
                      <button className="glass-button" style={{ padding: '4px 8px', fontSize: '0.8rem', border: 'none' }} onClick={() => handleCopy(m.content)}>
                        <Copy size={12} />
                      </button>
                      <button className="glass-button" style={{ padding: '4px 8px', fontSize: '0.8rem', border: 'none' }} onClick={() => handleGenerateImage(idx)}>
                        <ImageIcon size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {isGenerating && !isPaused && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontStyle: 'italic', padding: '1rem' }}
           >
             <div className="typing-indicator">
               <span className="dot"></span>
               <span className="dot"></span>
               <span className="dot"></span>
             </div>
             {characters[activeTurn || '']?.name} is thinking...
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
        <input 
          className="glass-input" 
          style={{ flex: 1 }}
          placeholder="Inject a prompt to alter the scene..." 
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUserInject()}
        />
        <button className="glass-button primary" onClick={handleUserInject}>
          <Send size={18} /> Send
        </button>
      </div>

      {showExportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', width: '100%' }}>
            <h2>Compile Director's Cut</h2>
            <p>Export the raw timeline into a professional, cohesive narrative masterpiece using Gemini 3.1 Pro.</p>
            
            <label className="mt-4" style={{ display: 'block' }}>Styling Blueprint (Natural Language)</label>
            <textarea 
              className="glass-input mt-4" 
              placeholder="e.g. Make it read like a dark, hyper-descriptive psychological thriller. Focus on visceral details."
              value={exportStyle}
              onChange={e => setExportStyle(e.target.value)}
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
            
            <div className="flex justify-between mt-4">
              <button className="glass-button" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className="glass-button primary" onClick={handleExport} disabled={isExporting}>
                {isExporting ? 'Compiling Masterpiece...' : 'Compile to HTML'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      <style>{`
        .typing-indicator .dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: var(--primary);
          border-radius: 50%;
          margin: 0 2px;
          animation: wave 1.3s linear infinite;
        }
        .typing-indicator .dot:nth-child(2) { animation-delay: -1.1s; }
        .typing-indicator .dot:nth-child(3) { animation-delay: -0.9s; }
        @keyframes wave {
          0%, 60%, 100% { transform: initial; }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
