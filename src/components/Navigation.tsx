import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, LayoutDashboard, UserCircle, BookOpen, Wand2 } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/vault', label: 'Character Vault', icon: BookOpen },
    { to: '/config', label: 'New Story', icon: Wand2 },
    { to: '/profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <nav className="glass-panel main-nav">
      <div className="nav-logo">
        Director.ai
      </div>
      <div className="nav-links">
        {links.map(link => {
          const isActive = location.pathname === link.to;
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to} className={`nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span className="nav-label">{link.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-indicator" 
                  className="active-indicator" 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} 
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
