import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Users, Globe, Shield, User, RefreshCw, Star, Sword, Gift } from 'lucide-react';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';

const SocialHub: React.FC = () => {
  const { social, user, inventory, acceptTrade, contributeToGuild, startRivalBattle } = useGame();
  const [activeTab, setActiveTab] = useState<'network' | 'trades' | 'guild'>('network');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  const renderNetwork = () => (
    <div className="space-y-4 animate-slide-in">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
            <h3 className="text-xl font-bold text-white mb-2">Global Leaderboard</h3>
            <p className="text-slate-400 text-sm">Season Rankings - Top 10</p>
        </div>

        <div className="space-y-2">
            {social.leaderboard.map((entry) => (
                <div key={entry.rank} className={`flex items-center p-3 rounded-lg border ${entry.isUser ? 'bg-primary/20 border-primary' : 'bg-slate-900 border-slate-800'}`}>
                    <div className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 mr-4">
                        #{entry.rank}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-4">
                        <User size={20} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className={`font-bold ${entry.isUser ? 'text-primary' : 'text-white'}`}>{entry.name}</h4>
                            {entry.isRival && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded uppercase font-bold">Rival</span>}
                        </div>
                        <p className="text-xs text-slate-400">{entry.title} • {entry.score} pts</p>
                    </div>
                    {entry.isRival && (
                        <Button 
                            variant="danger" 
                            className="text-xs py-1 px-3"
                            onClick={() => startRivalBattle(entry.name)}
                        >
                            <Sword size={12} className="mr-1" /> Battle
                        </Button>
                    )}
                </div>
            ))}
        </div>
    </div>
  );

  const renderTrades = () => (
    <div className="space-y-6 animate-slide-in">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold text-white">GTS Exchange</h3>
                <p className="text-slate-400 text-sm">Global Trade Station</p>
            </div>
            <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                LIVE
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {social.trades.map(offer => (
                <div key={offer.id} className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                    <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-400">Offer from {offer.traderName}</span>
                        <span className="text-xs text-slate-500">Expires in 23h</span>
                    </div>
                    
                    <div className="p-4 flex flex-col items-center">
                        <div className="w-full mb-4">
                            <PokemonCard pokemon={offer.offeredPokemon} readonly />
                        </div>
                        
                        <div className="w-full bg-slate-800 p-3 rounded-lg border border-slate-700 mb-4">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Requesting</p>
                            <div className="flex flex-wrap gap-2">
                                {offer.requestedType && (
                                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs border border-blue-500/30 capitalize">
                                        Type: {offer.requestedType}
                                    </span>
                                )}
                                {offer.requestedRarity && (
                                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs border border-purple-500/30 capitalize">
                                        {offer.requestedRarity}
                                    </span>
                                )}
                                {!offer.requestedType && !offer.requestedRarity && (
                                    <span className="text-slate-400 text-xs">Any Pokémon</span>
                                )}
                            </div>
                        </div>

                        {selectedOfferId === offer.id ? (
                            <div className="w-full space-y-2">
                                <p className="text-xs text-slate-400 text-center">Select Pokemon to trade:</p>
                                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {inventory.filter(p => {
                                        if (offer.requestedType && !p.types.includes(offer.requestedType)) return false;
                                        if (offer.requestedRarity && p.rarity !== offer.requestedRarity) return false;
                                        return true;
                                    }).map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => { acceptTrade(offer.id, p.id); setSelectedOfferId(null); }}
                                            className="w-full text-left text-xs p-2 bg-slate-800 hover:bg-slate-700 rounded flex justify-between items-center"
                                        >
                                            <span>{p.name}</span>
                                            <span className="text-slate-500">CP {p.stats.attack + p.stats.defense}</span>
                                        </button>
                                    ))}
                                    {inventory.filter(p => {
                                        if (offer.requestedType && !p.types.includes(offer.requestedType)) return false;
                                        if (offer.requestedRarity && p.rarity !== offer.requestedRarity) return false;
                                        return true;
                                    }).length === 0 && <p className="text-red-400 text-xs text-center py-2">No matching Pokémon</p>}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedOfferId(null)} className="w-full text-xs">Cancel</Button>
                            </div>
                        ) : (
                            <Button onClick={() => setSelectedOfferId(offer.id)} className="w-full flex items-center justify-center gap-2">
                                <RefreshCw size={14} /> Trade
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderGuild = () => (
    <div className="space-y-8 animate-slide-in">
        <div className="text-center py-8 bg-slate-800 rounded-2xl border border-slate-700 bg-[url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5980?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center relative overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/80"></div>
            <div className="relative z-10">
                <Shield size={48} className="mx-auto text-primary mb-4" />
                <h2 className="text-3xl font-bold text-white mb-1">{social.guild.name}</h2>
                <p className="text-slate-300">Level {social.guild.level} Guild</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Star className="text-yellow-400" size={20} /> Guild Progress
                </h3>
                
                <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">Level Goal</span>
                    <span className="text-white font-mono">{social.guild.totalProgress} / {social.guild.currentGoal}</span>
                </div>
                <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden mb-6">
                    <div 
                        className="bg-gradient-to-r from-primary to-purple-500 h-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (social.guild.totalProgress / social.guild.currentGoal) * 100)}%` }}
                    ></div>
                </div>

                <div className="bg-slate-900 p-4 rounded-lg">
                    <p className="text-sm text-slate-300 mb-3">Contribute Stardust to level up the guild and unlock collective buffs.</p>
                    <div className="grid grid-cols-3 gap-2">
                        <Button variant="secondary" onClick={() => contributeToGuild(50)} disabled={user.stardust < 50} className="text-xs">
                            Donate 50
                        </Button>
                        <Button variant="secondary" onClick={() => contributeToGuild(100)} disabled={user.stardust < 100} className="text-xs">
                            Donate 100
                        </Button>
                        <Button variant="secondary" onClick={() => contributeToGuild(500)} disabled={user.stardust < 500} className="text-xs">
                            Donate 500
                        </Button>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-2">Your Stardust: {user.stardust}</p>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Gift className="text-pink-400" size={20} /> My Contribution
                </h3>
                <div className="text-center py-6">
                    <div className="text-4xl font-bold text-white mb-2">{social.guild.contribution}</div>
                    <p className="text-slate-400 text-sm">Total Stardust Donated</p>
                </div>
                <div className="border-t border-slate-700 pt-4 mt-2">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-400">Next Reward</span>
                        <span className="text-green-400">500 Tokens</span>
                    </div>
                    <p className="text-xs text-slate-500">Reach 1000 contribution to claim.</p>
                </div>
            </div>
        </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <button 
            onClick={() => setActiveTab('network')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'network' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
            <Users size={18} /> Network
        </button>
        <button 
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'trades' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
            <Globe size={18} /> GTS Trades
        </button>
        <button 
            onClick={() => setActiveTab('guild')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'guild' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
        >
            <Shield size={18} /> My Guild
        </button>
      </div>

      {activeTab === 'network' && renderNetwork()}
      {activeTab === 'trades' && renderTrades()}
      {activeTab === 'guild' && renderGuild()}
    </div>
  );
};

export default SocialHub;