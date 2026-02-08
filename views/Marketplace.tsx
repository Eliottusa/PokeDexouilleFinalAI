import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSTS, ITEMS } from '../constants';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { ShoppingBag, RefreshCw, Lock, Briefcase, Tag } from 'lucide-react';

const Marketplace: React.FC = () => {
  const { user, marketListings, refreshMarket, buyMarketItem, buyItem } = useGame();
  const [activeTab, setActiveTab] = useState<'pokemon' | 'items'>('pokemon');

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingBag className="text-accent" />
                Marketplace
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Rare specimens and supplies.</p>
        </div>
        
        {activeTab === 'pokemon' && (
            <Button onClick={refreshMarket} variant="ghost" className="text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <RefreshCw size={14} />
                Refresh ({COSTS.MARKET_REFRESH} T)
            </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
          <button 
            onClick={() => setActiveTab('pokemon')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'pokemon' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
              <Tag size={16}/> Pokémon
          </button>
          <button 
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'items' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
              <Briefcase size={16}/> Supplies
          </button>
      </div>

      {/* Pokemon List */}
      {activeTab === 'pokemon' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
            {marketListings.map(listing => (
                <div key={listing.id} className="relative group">
                    <PokemonCard pokemon={listing.pokemon} readonly />
                    
                    {/* Overlay for Purchase */}
                    <div className={`absolute inset-0 bg-slate-900/80 rounded-xl flex flex-col items-center justify-center p-4 transition-opacity ${listing.sold ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {listing.sold ? (
                            <div className="flex flex-col items-center text-slate-500">
                                <Lock size={32} className="mb-2" />
                                <span className="font-bold">SOLD OUT</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 w-full">
                                <div className="text-center">
                                    <span className="text-slate-300 text-sm">Price</span>
                                    <div className={`text-2xl font-bold ${listing.currency === 'tokens' ? 'text-accent' : 'text-purple-400'}`}>
                                        {listing.price} {listing.currency === 'tokens' ? 'Tokens' : 'Stardust'}
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={() => buyMarketItem(listing.id)}
                                    disabled={(listing.currency === 'tokens' ? user.tokens : user.stardust) < listing.price}
                                    className="w-full"
                                    variant={listing.currency === 'tokens' ? 'primary' : 'secondary'}
                                >
                                    Buy Now
                                </Button>
                                
                                {(listing.currency === 'tokens' ? user.tokens : user.stardust) < listing.price && (
                                    <p className="text-red-400 text-xs text-center">Insufficient Funds</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Items List */}
      {activeTab === 'items' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-in">
              {Object.values(ITEMS).map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center shadow-sm">
                      <div className="text-4xl mb-3">{item.icon}</div>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-1">{item.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 h-10 mb-2">{item.description}</p>
                      
                      <div className="mt-auto w-full">
                         <p className="text-accent font-bold mb-2">{item.price} Tokens</p>
                         <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                            <span>Owned:</span>
                            <span className="text-white">{user.items?.[item.id] || 0}</span>
                         </div>
                         <Button 
                            onClick={() => buyItem(item.id)} 
                            disabled={user.tokens < item.price}
                            size="sm" 
                            className="w-full"
                        >
                            Purchase
                         </Button>
                      </div>
                  </div>
              ))}
          </div>
      )}
      
      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 mt-8 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Trader's Tip</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
            Check back often! The market receives shipments of rare AI-generated specimens that you can't find in the standard summoning lab.
            Use Stardust earned from battles to purchase Legendary items.
        </p>
      </div>
    </div>
  );
};

export default Marketplace;