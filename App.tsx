import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Generator from './views/Generator';
import Pokedex from './views/Pokedex';
import Battle from './views/Battle';
import Marketplace from './views/Marketplace';
import SocialHub from './views/SocialHub';
import Tutorial from './components/Tutorial';

const GameRouter: React.FC = () => {
  const { activeView, isLoading, user } = useGame();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-bold animate-pulse">Loading System...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout>
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'generator' && <Generator />}
        {activeView === 'pokedex' && <Pokedex />}
        {activeView === 'battle' && <Battle />}
        {activeView === 'marketplace' && <Marketplace />}
        {activeView === 'social' && <SocialHub />}
      </Layout>
      {!user.tutorialCompleted && <Tutorial />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
};

export default App;