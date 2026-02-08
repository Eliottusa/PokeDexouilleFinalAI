import React from 'react';
import { useGame } from '../context/GameContext';
import { COSTS } from '../constants';
import Button from '../components/Button';
import PokemonCard from '../components/PokemonCard';
import { ShoppingBag, RefreshCw, Lock } from 'lucide-react';

const Marketplace: React.FC = () => {
  const { user, marketListings, refreshMarket, buyMarketItem } = useGame();

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                <ShoppingBag className="text-accent" />
                Black Market
            </h2>
            <p className="text-slate-400">Rare specimens available for purchase.</p>
        </div>
        
        <Button onClick={refreshMarket} variant="ghost" className="text-xs flex items-center gap-2 border border-slate-700">
            <RefreshCw size={14} />
            Refresh ({COSTS.MARKET_REFRESH} T)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
      <div className="bg-slate-800 rounded-xl p-6 mt-8 border border-slate-700">
        <h3 className="font-bold text-white mb-2">Trader's Tip</h3>
        <p className="text-slate-400 text-sm">
            Check back often! The market receives shipments of rare AI-generated specimens that you can't find in the standard summoning lab.
            Use Stardust earned from battles to purchase Legendary items.
        </p>
      </div>
    </div>
  );
};

export default Marketplace;