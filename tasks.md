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

### Future
- [ ] Implement Pokémon personality traits that influence battle AI (Currently Visual)
- [ ] Add SVG Battle Animations
