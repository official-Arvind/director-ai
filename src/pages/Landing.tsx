import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex-col justify-center items-center" style={{ minHeight: '80vh', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className="hero-title">Direct Your Masterpiece.</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
          Two AIs. One Stage. Infinite Possibilities. Experience the ultimate zero-backend cinematic storytelling engine.
        </p>
        
        <button 
          className="glass-button primary" 
          style={{ fontSize: '1.2rem', padding: '16px 32px' }}
          onClick={() => navigate('/dashboard')}
        >
          <Play size={20} /> Enter the Studio
        </button>
      </motion.div>
    </div>
  );
}
