# PokéGen Dex

**PokéGen Dex** is an offline-first Pokémon collection RPG web application built with React, Tailwind CSS, and Google Gemini API. It features a rich gameplay loop including AI-powered Pokémon generation, strategic battling with weather and status effects, a dynamic marketplace, and social simulation.

![App Icon](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/gamepad-2.svg)

## 🌟 Key Features

### 🧬 Genetic Lab (AI Generation)
- **Standard Summon**: Fetch classic Pokémon from PokeAPI (Gen 1-9).
- **AI Synthesis**: Generate completely unique, never-before-seen Pokémon using Google Gemini.
- **Fusion Protocol**: Combine two existing Pokémon to create a hybrid with mixed types, stats, and visuals.
- **Event Summon**: Generate seasonal-themed Pokémon (e.g., Winter Ice-types, Summer Fire-types).
- **Custom Prompts**: Describe your dream Pokémon using natural language and let AI build it.

### ⚔️ Battle Arena
- **Turn-Based Combat**: Robust RPG system with type effectiveness (Super Effective/Resistant).
- **Double Battles**: Unlocked at higher difficulties, allowing 2v2 tactical fights.
- **Weather Systems**: Dynamic weather (Rain, Sun, Sandstorm) that affects move power and stats.
- **Smart AI**: Enemy trainers adapt their strategy based on health and type matchups.
- **Combat Prediction**: View estimated damage ranges and effectiveness before committing to a move.
- **Status Effects**: Strategic depth with Burn, Poison, Paralysis, Sleep, and Freeze mechanics.

### 📈 Progression & Events
- **Prestige System**: Reset your level after hitting the cap (Lvl 50) to gain permanent multipliers and unlock **Legacy Pokémon**.
- **Milestones**: Earn rewards for collecting specific amounts of Pokémon or reaching level thresholds.
- **Narrative Events**: Random text-based encounters on the Dashboard that offer choices with risks and rewards.
- **Seasonal Seasons**: Rotating seasons (Spring, Summer, Autumn, Winter) that provide passive bonuses and specific events.

### 💰 Economy & Marketplace
- **Dynamic Market**: Buy and sell Pokémon and items. Prices fluctuate based on a global "Market Trend".
- **Dual Currency**: 
  - **Tokens**: Earned by selling Pokémon and winning battles.
  - **Stardust**: Premium currency for high-tier items and Guild contributions.
- **Inventory System**: Manage consumables (Potions, Stat Boosters) and distinct Battle Relics.

### 📊 Pokédex & Management
- **Detailed Tracking**: View stats, history logs, personalities, and badges for every Pokémon.
- **Advanced Filtering**: Sort by Generation, Rarity, Type, and more.
- **Evolution**: Merge 3 duplicate Pokémon to discover stronger evolutionary forms.
- **Relic Equipment**: Equip items like *Leftovers*, *Muscle Band*, or *Scope Lens* to customize stats.
- **Compact Mode**: Toggle between card grids and dense list views for easier management.

### 🌐 Social Simulation
- **Global Leaderboard**: Compete against simulated NPC trainers with fluctuating scores.
- **GTS Trade Offers**: Receive and accept trade offers from NPCs with specific requirements.
- **Guild System**: Contribute Stardust to a guild to level it up and unlock collective rewards.
- **Rival Battles**: Challenge specific high-ranking NPCs to high-stakes duels.

## 🛠️ Technical Highlights
- **Offline First**: All game data is persisted locally using **IndexedDB**, allowing full gameplay without an internet connection (cached assets).
- **React Context**: Centralized state management for complex game logic (Inventory, User, Battle State).
- **PWA Ready**: Responsive design optimized for both mobile and desktop experiences.
- **Dark/Light Mode**: Full theme support with persistent user preference.

## Getting Started

1.  **Clone the repository**.
2.  **Install dependencies** (if applicable, currently self-contained via ESM imports).
3.  **Set API Key**: Ensure `process.env.API_KEY` is available for Google Gemini integration.
4.  **Run**: Open `index.html` via a local server (e.g., `npx serve` or `vite`).

## Gameplay Tips
- **Prestige Early**: Reaching Level 50 allows you to Prestige. Do this to increase your XP and Token gain rates permanently.
- **Watch the Market**: Buy Consumables and Relics when the Market Trend is low (Bear Market) and sell caught Pokémon when it's high (Bull Market).
- **Synergy**: In Double Battles, try pairing a Rain-inducing weather effect with Water-type Pokémon for massive damage.

---
*Built with ❤️ and AI.*