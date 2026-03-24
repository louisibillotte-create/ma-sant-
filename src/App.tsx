import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Saisie from './pages/Saisie';
import Coach from './pages/Coach';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen" style={{ backgroundColor: '#f5f0e8', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <Sidebar />
        <main className="flex-1 ml-56 min-h-screen">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/saisie" element={<Saisie />} />
            <Route path="/coach" element={<Coach />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
