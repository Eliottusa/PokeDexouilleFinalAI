import React from 'react';
import { useGame } from '../context/GameContext';
import { Home, Zap, List, ShoppingBag, Sword, Award, Sun, CloudRain, Snowflake, Leaf } from 'lucide-react';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { activeView, setView, user, season } = useGame();

  const SeasonIcon = {
    'Spring': Leaf,
    'Summer': Sun,
    'Autumn': CloudRain,
    'Winter': Snowflake
  }[season];

  const SeasonColor = {
    'Spring': 'text-green-400',
    'Summer': 'text-yellow-400',
    'Autumn': 'text-orange-400',
    'Winter': 'text-cyan-400'
  }[season];

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => setView(view)}
      className={`flex flex-col items-center justify-center p-2 flex-1 md:flex-none md:w-full md:flex-row md:justify-start md:px-4 md:py-3 md:gap-3 rounded-xl transition-all ${
        activeView === view 
          ? 'text-primary bg-primary/10' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      <Icon size={24} className={activeView === view ? 'animate-bounce-slow' : ''} />
      <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          PokéGen Dex
        </h1>
        <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-sm font-mono text-accent">{user.tokens} T</span>
        </div>
      </div>

      {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 w-full md:relative md:w-64 bg-slate-900 md:border-r border-t md:border-t-0 border-slate-800 z-30 flex md:flex-col justify-around md:justify-start p-2 md:p-4 gap-1 md:gap-2 overflow-x-auto md:overflow-visible">
        
        <div className="hidden md:flex flex-col items-center mb-8 mt-4">
             <div className="p-3 bg-slate-800 rounded-full mb-3 border border-slate-700 shadow-lg shadow-primary/20">
                <Award size={32} className="text-primary" />
             </div>
             <h1 className="text-xl font-bold text-white">PokéGen Dex</h1>
             <p className="text-xs text-slate-500">Offline RPG</p>
        </div>

        <NavItem view="dashboard" icon={Home} label="Home" />
        <NavItem view="generator" icon={Zap} label="Lab" />
        <NavItem view="pokedex" icon={List} label="Dex" />
        <NavItem view="battle" icon={Sword} label="Battle" />
        <NavItem view="marketplace" icon={ShoppingBag} label="Market" />
        
        {/* User Stats in Sidebar (Desktop) */}
        <div className="hidden md:block mt-auto bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">TOKENS</span>
                <span className="text-accent font-mono font-bold">{user.tokens}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">STARDUST</span>
                <span className="text-purple-400 font-mono font-bold">{user.stardust}</span>
            </div>
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">SEASON</span>
                <span className={`text-xs font-bold flex items-center gap-1 ${SeasonColor}`}>
                    <SeasonIcon size={12}/> {season}
                </span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-primary h-full" style={{ width: `${Math.min(100, (user.pokedexScore / 1000) * 100)}%` }}></div>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mb-16 md:mb-0 max-w-7xl mx-auto w-full">
        {/* Seasonal Banner */}
        <div className="mb-6 bg-slate-900/50 border-b border-slate-800 pb-2 flex items-center gap-2">
            <SeasonIcon size={16} className={SeasonColor} />
            <span className={`text-xs font-bold uppercase tracking-wider ${SeasonColor}`}>Current Event: {season} Season</span>
        </div>
        {children}
      </main>
    </div>
  );
};

export default Layout;