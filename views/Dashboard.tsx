import React from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Wallet, Zap, Star, Activity, Medal } from 'lucide-react';
import Button from '../components/Button';

const Dashboard: React.FC = () => {
  const { user, inventory, setView } = useGame();

  const StatCard = ({ label, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center gap-4 shadow-lg hover:bg-slate-750 transition-colors">
      <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wide">{label}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  const recentAcquisitions = inventory.slice(0, 3);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Medal size={20} className="text-accent" />
                <span className="text-accent font-bold uppercase tracking-widest text-sm">{user.title}</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Welcome Trainer</h2>
            <p className="text-slate-400">Here is your current status and progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            label="Tokens" 
            value={user.tokens} 
            icon={Wallet} 
            color="bg-accent text-accent" 
            subtext="Currency"
        />
        <StatCard 
            label="Dex Score" 
            value={user.pokedexScore} 
            icon={Trophy} 
            color="bg-secondary text-secondary"
            subtext="Rank Points"
        />
        <StatCard 
            label="Caught" 
            value={inventory.length} 
            icon={Zap} 
            color="bg-primary text-primary"
            subtext="Total Pokémon"
        />
         <StatCard 
            label="Stardust" 
            value={user.stardust} 
            icon={Star} 
            color="bg-purple-500 text-purple-500"
            subtext="Premium Dust"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 lg:col-span-1">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity size={20} className="text-primary"/> 
                Quick Actions
            </h3>
            <div className="space-y-3">
                <Button onClick={() => setView('generator')} className="w-full justify-between group">
                    <span>Summon Pokémon</span>
                    <span className="bg-slate-900 text-slate-300 text-xs px-2 py-1 rounded group-hover:bg-slate-700 transition-colors">10 T</span>
                </Button>
                <Button onClick={() => setView('pokedex')} variant="secondary" className="w-full justify-between">
                    <span>Manage Inventory</span>
                    <span className="bg-slate-900/20 text-white text-xs px-2 py-1 rounded">{inventory.length}</span>
                </Button>
            </div>
            
            <div className="mt-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Tip</h4>
                <p className="text-xs text-slate-500">
                    Battling at "High Stakes" grants 2x rewards but enemies are 30% stronger!
                </p>
            </div>
        </div>

        {/* Recent Activity / Showcase */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white">Recent Catches</h3>
                 <Button variant="ghost" onClick={() => setView('pokedex')} className="text-xs">View All</Button>
            </div>
            
            {recentAcquisitions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
                    <p className="text-slate-500 mb-4">No Pokémon found.</p>
                    <Button onClick={() => setView('generator')}>Go to Lab</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {recentAcquisitions.map(p => (
                         <div key={p.id} className="bg-slate-900 p-3 rounded-xl flex items-center gap-3 border border-slate-700">
                             <img src={p.sprite} alt={p.name} className="w-12 h-12 object-contain" />
                             <div>
                                 <p className="font-bold text-white capitalize text-sm">{p.name}</p>
                                 <p className="text-xs text-slate-500 capitalize">{p.rarity}</p>
                             </div>
                         </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;