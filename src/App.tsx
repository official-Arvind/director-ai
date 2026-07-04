import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import StoryConfig from './pages/StoryConfig';
import StoryFlow from './pages/StoryFlow';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/config" element={<StoryConfig />} />
        <Route path="/story/:storyId" element={<StoryFlow />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
