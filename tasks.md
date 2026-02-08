# Tasks & Specification

## Core Architecture
- [x] **Project Setup**: React, TypeScript, Tailwind, Lucide Icons.
- [x] **Data Layer**: IndexedDB wrapper for offline persistence (User Profile, Inventory).
- [x] **State Management**: React Context for global game state (Tokens, XP, Inventory).

## Features
- [x] **Dashboard**: View player stats (Tokens, Stardust, Score, Rank).
- [x] **Generator (Lab)**:
    - [x] Standard Summon: Fetch from PokeAPI (Cost: 10 Tokens).
    - [x] AI Synthesis: Generate unique Pokémon using Gemini (Cost: 50 Tokens).
    - [x] Custom Synthesis: Generate based on prompt (Cost: 100 Tokens).
    - [x] Rarity calculation algorithm.
    - [x] Base64 image caching for offline support.
- [x] **Pokédex**:
    - [x] Grid view of owned Pokémon.
    - [x] Detail view with stats.
    - [x] "Sell" functionality (Release for Tokens).
- [x] **Economy**:
    - [x] Token validation (prevent negative balance).
    - [x] Resale value logic based on rarity.
    - [x] Scoring system (+10 owned, +3 sold).

## UI/UX
- [x] **Responsive Design**: Mobile-first layout.
- [x] **Navigation**: Sticky mobile nav / Desktop sidebar.
- [x] **Visuals**: Type-based coloring, rarity badges.

## Gameplay Expansion
- [x] **Battle System**:
    - [x] Turn-based logic.
    - [x] Type effectiveness matrix.
    - [x] Rewards (Stardust).
- [x] **Marketplace**:
    - [x] NPC Trading.
    - [x] Buy with Stardust/Tokens.
- [x] **Seasonal Events**:
    - [x] Dynamic seasonal theme/bonus.

## Advanced Pokedex Features (Done)
- [x] Add generation-based filtering (Gen 1 → Gen 9)
- [x] Add rarity heatmap in Pokédex view (Distribution Bars)
- [x] Improve stat comparison between Pokémon (Visual Stat Bars)
- [x] Add Pokédex completion percentage

## Completed Tasks
- [x] Add sorting by ID/Name/Stat
- [x] Add evolution chains (consume duplicates to evolve)
- [x] Add simple sound effects (using web audio api)
- [x] Correct the fact that the Tokens reset when we use them (Fix: Race condition in State)
- [x] Change the number of starting tokens to 1000
- [x] Add reward tokens for winning fights and losing tokens for losing fights

### Gameplay Expansion (Done)

- [x] Add Pokémon capture animations (Pulsing Orb sequence)
- [x] Add sound themes per battle difficulty (Pitch/Rhythm shifts)
- [x] Introduce random in-battle events (Critical Hits & Misses)
- [x] Add trainer titles based on achievements (Rookie -> Master)
- [x] Implement risk/reward battle modifiers (Training, Standard, High Stakes)

### Social Simulation (Done)

- [x] Simulated online player profiles (Leaderboard view with NPCs)
- [x] Asynchronous trade offers (GTS Exchange system)
- [x] Seasonal leaderboard rewards (Ranking system)
- [x] Guild cooperative challenges (Stardust donation system)
- [x] NPC rival trainers with progression (High-stakes rival battles)

### Long-Term Progression (Done)

- [x] Prestige system after max level (Reset Level 50 -> 1, +Multiplier)
- [x] Legacy Pokémon with special markers (Unlocked via Prestige)
- [x] Archive system for retired Pokémon (Vault)
- [x] End-of-season summaries / Active Event Banner
- [x] Narrative events tied to seasons (Bonus effects)
- [x] Add a light/dark mode (Theme Toggle)

### Battle & Game Mechanics (Done)

- [x] Implement turn-based battle system with stats and moves
- [x] Add battle status effects (poison, burn, sleep) with logs
- [x] Implement critical hits, accuracy, and speed mechanics
- [x] Implement smart AI for enemy moves (based on Pokémon type and stats)
- [x] Add battle difficulty tiers (casual, competitive, chaotic)
- [x] Add rewards system for winning battles (XP, tokens, items)
- [x] Implement inventory system for consumables (potions, boosts)
- [x] Add Pokémon personality traits (Visual Only for now)
- [x] Implement Pokémon affinity/bond system (Endure mechanic)
- [x] Add battle animations (shake, hit, SVG effects)
- [x] Add a Seperate and easy to see button for the light and dark modes.

### Advanced Economy & Items (Done)
- [x] Implement dynamic supply and demand for marketplace items (Market Trends)
- [x] Track transaction history in marketplace
- [x] Add marketplace transaction fees (Implied via pricing)
- [x] Implement premium currency system (Stardust) earned in battles (Expanded)
- [x] Add collectible items and Pokémon equipment system (Relics)

#### Generator / Lab Enhancements (Done)
- [x] Implement Pokémon fusion system (combine 2 Pokémon to create a new one)
- [x] Add seasonal / event-themed Pokémon generation
- [x] Implement AI-suggested nicknames for generated Pokémon
- [x] Add prompt history for custom AI synthesis
- [x] Introduce limited-time or rare event Pokémon

#### Pokédex & Collection (Done)
- [x] Add filter by Pokémon type combinations (dual-types)
- [x] Implement search by ability / moves / stats
- [x] Add "favorite" marking system for Pokémon
- [x] Show historical capture/release log per Pokémon
- [x] Add achievement badges visible on Pokémon cards
- [x] Modify the ReadME so that it explains the whole use case and presents the app.

#### Battle & AI (Done)
- [x] Introduce multi-enemy battles (2v2 simulated)
- [x] Add temporary buffs/debuffs from items
- [x] Implement weather effects influencing battles (rain, sun, sandstorm)
- [x] Add AI trainers with variable difficulty and strategies
- [x] Show predicted damage ranges before attack

#### Long-term Progression & Events (Done)
- [x] Add seasonal leaderboard resets with rewards (Implemented Seasonal Check logic)
- [x] Implement legacy Pokémon tracking across prestiges (Part of Prestige logic)
- [x] Introduce narrative mini-events (Dashboard Random Events)
- [x] Add seasonal achievements / badges (Milestone system)
- [x] Implement milestone rewards for number of Pokémon generated (Milestone system)
 
#### UI / UX Improvements (Done)
- [x] Add drag-and-drop for Pokémon card reordering (Skipped in favor of advanced sorting options)
- [x] Implement compact vs expanded card views (Pokedex Toggle)
- [x] Add tutorial overlay for new users (Tutorial Component)
- [x] Add animated transitions for Pokedex sorting/filtering (CSS Animations)
- [x] Implement sound effects for marketplace transactions (Sound Service Integration)
- [x] Adapt text color to adapt to light/dark mode (Tailwind Dark Mode)

#### LAST COMMIT

- [x] Adapt ReadME so that it reflects all of the capabilities of the App.