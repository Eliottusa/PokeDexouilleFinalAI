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

## Planned Tasks
- [ ] Add sorting by ID/Name/Stat
- [ ] Add evolution chains (consume duplicates to evolve)
- [ ] Add simple sound effects (using web audio api)
- [ ] Correct the fact that the Tokens reset when we use them
- [ ] Change the number of starting tokens to 1000
- [ ] Add reward tokens for winning fights and losing tokens for losing fights