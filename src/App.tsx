import { HashRouter, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import StoryConfig from './pages/StoryConfig';
import StoryFlow from './pages/StoryFlow';
import Profile from './pages/Profile';
import Vault from './pages/Vault';

function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/config" element={<StoryConfig />} />
            <Route path="/story/:storyId" element={<StoryFlow />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
// trigger build
