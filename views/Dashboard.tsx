import React, { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Wallet, Zap, Star, Activity, Medal, Crown, Flame, AlertCircle, Gift, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import { XP_PER_LEVEL, LEVEL_CAP, NARRATIVE_EVENTS, MILESTONES } from '../constants';
import { NarrativeEvent } from '../types';

const Dashboard: React.FC = () => {
  const { user, inventory, setView, activeEvent, prestigeUser, updateTokens, updateStardust, claimMilestone, season } = useGame();
  
  const [activeNarrative, setActiveNarrative] = useState<NarrativeEvent | null>(null);
  const [narrativeResult, setNarrativeResult] = useState<string | null>(null);

  // Trigger Narrative Event on Mount (10% Chance)
  useEffect(() => {
      const chance = Math.random();
      if (chance < 0.1 && !activeNarrative && !narrativeResult) {
          const event = NARRATIVE_EVENTS[Math.floor(Math.random() * NARRATIVE_EVENTS.length)];
          // Only trigger if not in battle or something critical
          const timer = setTimeout(() => setActiveNarrative(event), 1000);
          return () => clearTimeout(timer);
      }
  }, []);

  const handleNarrativeChoice = async (choice: NarrativeEvent['choices'][0]) => {
      setNarrativeResult(choice.outcomeText);
      
      if (choice.action === 'reward' && choice.value) {
          await updateTokens(choice.value); // Assume mostly tokens for simplicity, or handle specific item logic
      } else if (choice.action === 'loss' && choice.value) {
          await updateTokens(-choice.value);
      }
      // Battle could route to a battle view, but keeping it simple text for now
      
      setTimeout(() => {
          setActiveNarrative(null);
          setNarrativeResult(null);
      }, 3000);
  };

  const StatCard = ({ label, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl flex items-center gap-4 shadow-lg hover:shadow-xl transition-all">
      <div className={`p-4 rounded-full ${color} bg-opacity-10`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide">{label}</p>
        <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  const recentAcquisitions = inventory.filter(p => !p.isArchived).slice(0, 3);
  const xpProgress = (user.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;

  // Calculate Milestone Progress
  const getMilestoneProgress = (m: typeof MILESTONES[0]) => {
      if (m.type === 'catch') return Math.min(100, (inventory.length / m.target) * 100);
      if (m.type === 'level') return Math.min(100, (user.level / m.target) * 100);
      return 0;
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Narrative Modal */}
      {(activeNarrative || narrativeResult) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 text-center">
                  {narrativeResult ? (
                      <div className="py-8">
                          <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">{narrativeResult}</p>
                      </div>
                  ) : (
                      <>
                        <div className="text-4xl mb-4">{activeNarrative!.image}</div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{activeNarrative!.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{activeNarrative!.description}</p>
                        <div className="space-y-3">
                            {activeNarrative!.choices.map((choice, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleNarrativeChoice(choice)}
                                    className="w-full p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white transition-colors border border-slate-200 dark:border-slate-700"
                                >
                                    {choice.text}
                                </button>
                            ))}
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {/* Event Banner */}
      {activeEvent && (
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 border border-indigo-700 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Flame size={120} />
              </div>
              <div className="relative z-10">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold uppercase text-xs tracking-wider mb-1">
                      <span className="bg-indigo-500/20 px-2 py-1 rounded">Active Event</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">{activeEvent.name}</h2>
                  <p className="text-indigo-100 max-w-lg">{activeEvent.description}</p>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Medal size={20} className="text-accent" />
                <span className="text-accent font-bold uppercase tracking-widest text-sm">{user.title}</span>
                {user.prestige > 0 && (
                    <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 flex items-center gap-1">
                        <Crown size={10} /> Prestige {user.prestige}
                    </span>
                )}
            </div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome Trainer</h2>
            
            {/* Level Progress */}
            <div className="mt-4 w-full md:w-96">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-bold">Level {user.level}</span>
                    <span className="text-slate-400">{Math.floor(user.xp % XP_PER_LEVEL)} / {XP_PER_LEVEL} XP</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${user.level >= LEVEL_CAP ? 100 : xpProgress}%` }}></div>
                </div>
                {user.level >= LEVEL_CAP && (
                    <Button 
                        onClick={prestigeUser} 
                        className="mt-2 w-full text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 border-none hover:from-yellow-500 hover:to-yellow-400"
                    >
                        <Crown size={14} /> Prestige (Reset Level for Bonus)
                    </Button>
                )}
            </div>
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
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Catches</h3>
                    <Button variant="ghost" onClick={() => setView('pokedex')} className="text-xs">View All</Button>
                </div>
                
                {recentAcquisitions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        <p className="text-slate-500 mb-4">No active Pokémon found.</p>
                        <Button onClick={() => setView('generator')}>Go to Lab</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {recentAcquisitions.map(p => (
                            <div key={p.id} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                                <img src={p.sprite} alt={p.name} className="w-12 h-12 object-contain" />
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-white capitalize text-sm">{p.name}</p>
                                    <p className="text-xs text-slate-500 capitalize">{p.rarity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Milestones */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Trophy size={20} className="text-yellow-500" /> Milestones
                </h3>
                <div className="space-y-4">
                    {MILESTONES.map(m => {
                        const progress = getMilestoneProgress(m);
                        const isCompleted = progress >= 100;
                        const isClaimed = user.milestonesClaimed.includes(m.id);

                        return (
                            <div key={m.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className={`p-2 rounded-full ${isClaimed ? 'bg-green-500/10 text-green-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                    {isClaimed ? <Gift size={20} /> : <TargetIcon type={m.type}/>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm text-slate-800 dark:text-white">{m.label}</span>
                                        <span className="text-xs text-slate-500">{isClaimed ? 'Claimed' : `${m.reward} ${m.currency === 'tokens' ? 'T' : 'Dust'}`}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                                {isCompleted && !isClaimed && (
                                    <Button size="sm" onClick={() => claimMilestone(m.id)} className="animate-pulse">Claim</Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-primary"/> 
                    Quick Actions
                </h3>
                <div className="space-y-3">
                    <Button onClick={() => setView('generator')} className="w-full justify-between group">
                        <span>Summon Pokémon</span>
                        <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 text-xs px-2 py-1 rounded group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">10 T</span>
                    </Button>
                    <Button onClick={() => setView('pokedex')} variant="secondary" className="w-full justify-between">
                        <span>Manage Inventory</span>
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded">{inventory.length}</span>
                    </Button>
                </div>
                
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tip</h4>
                    <p className="text-xs text-slate-500">
                        Prestige grants a permanent +10% bonus to all resource gains and unlocks rare Legacy Pokémon!
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const TargetIcon = ({ type }: { type: string }) => {
    if (type === 'catch') return <Zap size={20} />;
    if (type === 'level') return <Activity size={20} />;
    return <Star size={20} />;
};

export default Dashboard;