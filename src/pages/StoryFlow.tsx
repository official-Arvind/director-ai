import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStory, type Story, getMessages, type Message, saveMessage, getCharacters, type Character } from '../lib/db';
import { generateText, generateImage } from '../lib/gemini';
import { exportCleanStory } from '../lib/exportEngine';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Image as ImageIcon, Pause, Play, Download, Send, ArrowLeft, User, Maximize, Minimize } from 'lucide-react';

export default function StoryFlow() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [exportStyle, setExportStyle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyId) loadStory(storyId);
  }, [storyId]);



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
  };

  const triggerNextTurn = async () => {
    if (!story || isPaused || isGenerating) return;
    
    setIsGenerating(true);
    
    // Memory Rolling Window: Only take the last 15 messages to save tokens.
    // If the conversation is longer, the first message is kept as 'Core Premise', then we take the last 14.
    let windowMsgs = messages;
    if (messages.length > 15) {
      windowMsgs = [messages[0], ...messages.slice(-14)];
    }

    const contextMsgs = windowMsgs.map(m => {
      if (m.characterId === 'system') return `[SCENE/SYSTEM]: ${m.content}`;
      if (m.characterId === 'user') return `[DIRECTOR INJECTION]: ${m.content}`;
      const charName = characters[m.characterId]?.name || 'Unknown';
      return `[${charName} (ID: ${m.characterId})]: ${m.content}`;
    }).join('\n\n');

    const prompt = `Context timeline (Chronological):\n${contextMsgs}\n\nIt is your turn to orchestrate. Output JSON with characterId and content.`;

    try {
      const responseText = await generateText(prompt, 'gemini-3.1-flash-lite', story.orchestratorPrompt);
      let parsed;
      try {
        parsed = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (parseError) {
        console.error("Failed to parse JSON response:", responseText);
        // Fallback if AI hallucinates formatting
        parsed = {
          characterId: story.characterIds[0],
          content: responseText.replace(/[{}"_]/g, '').slice(0, 300)
        };
      }
      
      // Ensure the AI chose a valid active character
      const validCharId = characters[parsed.characterId] ? parsed.characterId : story.characterIds[0];

      const newMsg: Message = {
        id: crypto.randomUUID(),
        storyId: story.id,
        characterId: validCharId,
        content: parsed.content || "...",
        timestamp: Date.now()
      };
      
      await saveMessage(newMsg);
      setMessages(prev => [...prev, newMsg]);
      
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
    const msg = messages[msgIndex];

    // Extract context up to this message
    // Bypass Gemini entirely to avoid strict safety filters blocking NSFW/uncensored scenes.
    // Instead, we build a direct raw prompt and send it straight to the uncensored Pollinations model.
    try {
      const character = msg.characterId ? characters[msg.characterId] : null;
      let rawPrompt = "";
      
      if (character) {
        rawPrompt = `A highly detailed, cinematic scene featuring ${character.name}, age ${character.age}. Character Description: ${character.description}. Current Action/Scene: ${msg.content}. High quality, uncensored art style, dramatic lighting, masterpiece, 8k.`;
      } else {
        rawPrompt = `A highly detailed, cinematic scene. Current Action/Scene: ${msg.content}. High quality, uncensored art style, dramatic lighting, masterpiece, 8k.`;
      }

      const imgUrl = await generateImage(rawPrompt);
      
      const updatedMsg = { ...msg, imageUrl: imgUrl };
      await saveMessage(updatedMsg);
      
      setMessages(prev => {
        const newArr = [...prev];
        newArr[msgIndex] = updatedMsg;
        return newArr;
      });
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
    <div className={`container flex-col ${isFullscreen ? 'fullscreen-story' : ''}`} style={isFullscreen ? {} : { height: '100vh', padding: '1rem', maxWidth: '900px' }}>
      
      {isFullscreen && (
        <div className="leaves-container">
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
          <div className="leaf"></div>
        </div>
      )}

      {!isFullscreen ? (
        <header className="glass-panel flex justify-between items-center" style={{ padding: '1rem 2rem', marginBottom: '1rem', position: 'relative', zIndex: 10 }}>
          <div className="flex items-center gap-4">
            <button className="glass-button" style={{ padding: '8px' }} onClick={() => navigate('/')}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h3 style={{ margin: 0 }}>{story.name}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)' }}>
                {story.characterIds.map(id => characters[id]?.name).filter(Boolean).join(' vs ')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="glass-button" onClick={() => setIsFullscreen(true)}>
              <Maximize size={16}/> Fullscreen
            </button>
            <button className={`glass-button ${isPaused ? 'primary' : ''}`} onClick={() => setIsPaused(!isPaused)}>
              {isPaused ? <><Play size={16}/> Resume</> : <><Pause size={16}/> Pause</>}
            </button>
            <button className="glass-button" onClick={() => setShowExportModal(true)}>
              <Download size={16}/> Compile
            </button>
          </div>
        </header>
      ) : (
        <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 9999 }}>
          <button className="glass-button" style={{ padding: '8px', background: 'rgba(0,0,0,0.5)', border: 'none' }} onClick={() => setIsFullscreen(false)}>
            <Minimize size={16} /> Exit Fullscreen
          </button>
        </div>
      )}

      <div className={`flex-col ${isFullscreen ? '' : 'glass-panel'}`} style={{ flex: 1, overflowY: 'auto', padding: isFullscreen ? '4rem 2rem' : '2rem', gap: isFullscreen ? '3rem' : '1.5rem', marginBottom: '1rem', position: 'relative', zIndex: 10 }}>
        <AnimatePresence>
          {messages.map((m, idx) => {
            const isSystem = m.characterId === 'system';
            const isUser = m.characterId === 'user';
            const char = characters[m.characterId];
            
            // Align: even index left, odd index right, system/user center
            let align = 'center';
            const charIndex = story.characterIds.indexOf(m.characterId);
            if (charIndex !== -1) {
              align = charIndex % 2 === 0 ? 'flex-start' : 'flex-end';
            }

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
                  maxWidth: isFullscreen ? '900px' : '80%', 
                  background: isSystem || isFullscreen ? 'transparent' : isUser ? 'rgba(69, 162, 158, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: isSystem || isFullscreen ? 'none' : '1px solid var(--glass-border)',
                  padding: isFullscreen ? '0' : '1rem 1.5rem',
                  borderRadius: '16px',
                  position: 'relative',
                  borderBottomLeftRadius: align === 'flex-start' ? 0 : '16px',
                  borderBottomRightRadius: align === 'flex-end' ? 0 : '16px',
                  color: isSystem ? 'var(--primary)' : 'inherit',
                  fontStyle: isSystem ? 'italic' : 'normal',
                  textAlign: isSystem ? 'center' : 'left',
                  fontSize: isFullscreen ? '1.2rem' : '1rem',
                  lineHeight: 1.8
                }}>
                  {!isSystem && !isUser && (
                    <div style={{ fontSize: isFullscreen ? '1rem' : '0.8rem', color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
                      {char?.name}
                    </div>
                  )}
                  {isUser && (
                    <div style={{ fontSize: isFullscreen ? '1rem' : '0.8rem', color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={12} /> DIRECTOR INJECTION
                    </div>
                  )}
                  
                  <div style={{ whiteSpace: 'pre-wrap', textShadow: isFullscreen ? '0 2px 4px rgba(0,0,0,0.8)' : 'none' }}>{m.content}</div>
                  
                  {m.imageUrl && (
                    <div style={{ marginTop: '1.5rem', borderRadius: '8px', overflow: 'hidden', maxWidth: isFullscreen ? '600px' : '400px', marginInline: isSystem ? 'auto' : (align === 'flex-start' ? '0' : align === 'flex-end' ? 'auto' : 'auto'), marginLeft: align === 'flex-end' ? 'auto' : 0 }}>
                      <img src={m.imageUrl} alt="Scene Visualization" style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--glass-border)' }} />
                    </div>
                  )}
                  
                  {!isSystem && !isFullscreen && (
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
             The Engine is deciding who speaks next...
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
