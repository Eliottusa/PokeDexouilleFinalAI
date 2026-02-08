import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { COSTS, ITEMS, RELICS } from '../constants';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { ShoppingBag, RefreshCw, Lock, Briefcase, Tag, History, TrendingUp, TrendingDown, Shield } from 'lucide-react';

const Marketplace: React.FC = () => {
  const { user, marketListings, refreshMarket, buyMarketItem, buyItem, buyRelic, marketTrend } = useGame();
  const [activeTab, setActiveTab] = useState<'pokemon' | 'items' | 'history'>('pokemon');

  const getTrendIcon = () => {
      if (marketTrend > 1.05) return <TrendingUp className="text-red-500" />;
      if (marketTrend < 0.95) return <TrendingDown className="text-green-500" />;
      return <span className="text-slate-400">-</span>;
  };

  const getTrendText = () => {
    if (marketTrend > 1.05) return "Prices are high (Seller's Market)";
    if (marketTrend < 0.95) return "Prices are low (Buyer's Market)";
    return "Market is stable";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <ShoppingBag className="text-accent" />
                Marketplace
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Rare specimens and supplies.</p>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs border border-slate-200 dark:border-slate-700">
                    {getTrendIcon()}
                    <span className="font-mono">{Math.round(marketTrend * 100)}%</span>
                </div>
            </div>
        </div>
        
        {activeTab === 'pokemon' && (
            <Button onClick={refreshMarket} variant="ghost" className="text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700">
                <RefreshCw size={14} />
                Refresh ({COSTS.MARKET_REFRESH} T)
            </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('pokemon')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'pokemon' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
              <Tag size={16}/> Pokémon
          </button>
          <button 
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'items' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
              <Briefcase size={16}/> Supplies & Relics
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
          >
              <History size={16}/> History
          </button>
      </div>

      {/* Pokemon List */}
      {activeTab === 'pokemon' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in">
            {marketListings.map(listing => {
                const finalPrice = Math.floor(listing.price * marketTrend);
                return (
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
                                        {finalPrice} {listing.currency === 'tokens' ? 'Tokens' : 'Stardust'}
                                    </div>
                                    {marketTrend !== 1 && <span className="text-xs text-slate-400">(Adjusted)</span>}
                                </div>
                                
                                <Button 
                                    onClick={() => buyMarketItem(listing.id)}
                                    disabled={(listing.currency === 'tokens' ? user.tokens : user.stardust) < finalPrice}
                                    className="w-full"
                                    variant={listing.currency === 'tokens' ? 'primary' : 'secondary'}
                                >
                                    Buy Now
                                </Button>
                                
                                {(listing.currency === 'tokens' ? user.tokens : user.stardust) < finalPrice && (
                                    <p className="text-red-400 text-xs text-center">Insufficient Funds</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )})}
        </div>
      )}

      {/* Items List */}
      {activeTab === 'items' && (
          <div className="space-y-8 animate-slide-in">
              {/* Consumables */}
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Consumables</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.values(ITEMS).map(item => {
                        const finalPrice = Math.floor(item.price * marketTrend);
                        return (
                        <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center shadow-sm">
                            <div className="text-4xl mb-3">{item.icon}</div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-1">{item.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 h-10 mb-2">{item.description}</p>
                            
                            <div className="mt-auto w-full">
                                <p className="text-accent font-bold mb-2">{finalPrice} Tokens</p>
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                    <span>Owned:</span>
                                    <span className="text-white">{user.items?.[item.id] || 0}</span>
                                </div>
                                <Button 
                                    onClick={() => buyItem(item.id)} 
                                    disabled={user.tokens < finalPrice}
                                    size="sm" 
                                    className="w-full"
                                >
                                    Purchase
                                </Button>
                            </div>
                        </div>
                    )})}
                </div>
              </div>

              {/* Relics */}
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Shield size={20} className="text-purple-400" /> Relics & Equipment
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.values(RELICS).map(relic => {
                        const finalPrice = Math.floor(relic.price * marketTrend);
                        return (
                        <div key={relic.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center shadow-sm">
                            <div className="text-4xl mb-3 relative">
                                {relic.icon}
                                <span className="absolute -bottom-1 -right-1 bg-purple-500 text-[8px] text-white px-1 rounded-full">RELIC</span>
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white mb-1">{relic.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 h-10 mb-2">{relic.description}</p>
                            
                            <div className="mt-auto w-full">
                                <p className={`font-bold mb-2 ${relic.currency === 'tokens' ? 'text-accent' : 'text-purple-400'}`}>
                                    {finalPrice} {relic.currency === 'tokens' ? 'Tokens' : 'Stardust'}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                                    <span>Owned:</span>
                                    <span className="text-white">{user.relics?.[relic.id] || 0}</span>
                                </div>
                                <Button 
                                    onClick={() => buyRelic(relic.id)} 
                                    disabled={(relic.currency === 'tokens' ? user.tokens : user.stardust) < finalPrice}
                                    size="sm" 
                                    variant="secondary"
                                    className="w-full"
                                >
                                    Purchase
                                </Button>
                            </div>
                        </div>
                    )})}
                </div>
              </div>
          </div>
      )}

      {/* History */}
      {activeTab === 'history' && (
          <div className="animate-slide-in">
              {(!user.transactions || user.transactions.length === 0) ? (
                  <div className="text-center py-12 text-slate-500">No transaction history found.</div>
              ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                              <tr>
                                  <th className="p-3">Type</th>
                                  <th className="p-3">Item</th>
                                  <th className="p-3 text-right">Amount</th>
                                  <th className="p-3 text-right">Time</th>
                              </tr>
                          </thead>
                          <tbody>
                              {user.transactions.map((tx) => (
                                  <tr key={tx.id} className="border-t border-slate-200 dark:border-slate-700">
                                      <td className="p-3 capitalize">
                                          <span className={`px-2 py-0.5 rounded text-xs ${
                                              tx.type === 'buy' ? 'bg-red-500/10 text-red-500' : 
                                              tx.type === 'sell' ? 'bg-green-500/10 text-green-500' :
                                              'bg-blue-500/10 text-blue-500'
                                          }`}>
                                              {tx.type}
                                          </span>
                                      </td>
                                      <td className="p-3 font-medium dark:text-white">{tx.itemName}</td>
                                      <td className={`p-3 text-right font-mono ${tx.type === 'sell' ? 'text-green-500' : 'text-red-500'}`}>
                                          {tx.type === 'sell' ? '+' : '-'}{tx.amount} {tx.currency === 'stardust' ? 'Dust' : 'T'}
                                      </td>
                                      <td className="p-3 text-right text-slate-500 text-xs">
                                          {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>
      )}
      
      <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 mt-8 border border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-slate-800 dark:text-white mb-2">Market Analysis</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
            {getTrendText()}. Market trends shift every time you refresh. Use the volatility to your advantage!
        </p>
      </div>
    </div>
  );
};

export default Marketplace;