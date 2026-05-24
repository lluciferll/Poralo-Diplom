import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProfileEdit from './pages/ProfileEdit';
import Scout from './pages/Scout';
import Tournaments from './pages/Tournaments';
import Leaderboard from './pages/Leaderboard';
import Teams from './pages/Teams';
import Matches from './pages/Matches';
import PlayerProfile from './pages/PlayerProfile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile/edit" element={<ProfileEdit />} />
            <Route path="play" element={<Navigate to="/profile/edit" replace />} />
            <Route path="scout" element={<Scout />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="teams" element={<Teams />} />
            <Route path="matches" element={<Matches />} />
            <Route path="player/:nickname" element={<PlayerProfile />} />
            <Route path="missions" element={<Navigate to="/dashboard" replace />} />
            <Route path="syndicates" element={<Navigate to="/teams" replace />} />
            <Route path="hubs" element={<Navigate to="/teams" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
