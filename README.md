# PokéGen Dex

**PokéGen Dex** is an offline-first Pokémon collection RPG web application built with React, Tailwind CSS, and Google Gemini API. It features a rich gameplay loop including AI-powered Pokémon generation, strategic battling, a dynamic marketplace, and social simulation.

![App Icon](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/gamepad-2.svg)

## Features

### 🧬 Genetic Lab (Generation)
- **Standard Summon**: Fetch classic Pokémon from PokeAPI.
- **AI Synthesis**: Generate completely unique, never-before-seen Pokémon using Google Gemini.
- **Fusion**: Combine two existing Pokémon to create a hybrid with mixed types and stats.
- **Event Summon**: Generate seasonal-themed Pokémon (e.g., Winter, Spring).
- **Custom Prompts**: Describe your dream Pokémon and let AI build it.

### ⚔️ Battle Arena
- **Turn-Based Combat**: Classic RPG battle system with types, stats, and RNG.
- **Status Effects**: Burn, Poison, Paralysis, Sleep, Freeze mechanics.
- **Smart AI**: Enemy AI adapts based on moves and health.
- **Items & Relics**: Use potions in battle or equip items like Leftovers and Muscle Band for passive bonuses.

### 💰 Economy & Marketplace
- **Dynamic Market**: Buy and sell Pokémon and items. Prices fluctuate based on a global "Market Trend" (Bull/Bear markets).
- **Dual Currency**: Earn **Tokens** from selling Pokémon and **Stardust** from winning battles.
- **Supply & Demand**: Stock rotates every time you refresh.

### 📊 Pokédex & Management
- **Detailed Tracking**: View stats, history logs, and badges for every Pokémon.
- **Filters**: Advanced filtering by type, rarity, generation, and favorites.
- **Evolution**: Merge duplicate Pokémon to discover stronger evolutionary forms.
- **Badges**: Earn badges for high stats (Titan), battle wins (Veteran), and more.

### 🌐 Social Simulation
- **Leaderboard**: Compete against simulated NPC trainers.
- **Trade Offers**: Receive and accept trade offers from NPCs.
- **Guilds**: Contribute Stardust to a guild to level up and unlock potential rewards.
- **Rivals**: Challenge specific NPCs on the leaderboard to high-stakes battles.

### 🛠️ Technical Highlights
- **Offline First**: All game data is persisted locally using IndexedDB.
- **PWA Ready**: designed to work seamlessly on mobile and desktop.
- **React Context**: Centralized state management for complex game logic.

## Getting Started

1.  **Clone the repository**.
2.  **Install dependencies** (if applicable, currently self-contained via ESM imports).
3.  **Set API Key**: Ensure `process.env.API_KEY` is available for Google Gemini integration.
4.  **Run**: Open `index.html` via a local server (e.g., `npx serve` or `vite`).

## Gameplay Tips
- **Prestige**: Reaching Level 50 allows you to Prestige, resetting your level but granting a permanent resource bonus and unlocking "Legacy" Pokémon chances.
- **Relics**: Don't forget to equip your best Pokémon with Relics bought from the Marketplace to gain an edge in Hard Mode battles.
- **Market Trends**: Buy low, sell high! Watch the market trend indicator in the Marketplace.

---
*Built with ❤️ and AI.*
