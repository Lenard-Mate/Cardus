# Game Design Document & Technical Rules Matrix: Aether Forge

## 1. Executive Summary
**Aether Forge** is a tactical, single-player, turn-based roguelike card battler. The player assumes the role of a Tech-Mage descending through a corrupted digital vault. The core loop revolves around managing a tight pool of volatile Energy tokens to deploy offensive "Attacks", defensive "Shields", and utility "Overdrives" to counter explicit, transparent enemy intentions.

---

## 2. Core Game State Variables
The global state engine must track and update the following variables continuously across rounds:

### Player State
*   `playerHealth`: Integer (Default Max: 50, Min: 0). If 0, trigger Game Over.
*   `playerShield`: Integer (Default: 0). Temporary health buffer. Resets to 0 at the start of the player's turn.
*   `currentEnergy`: Integer (Default Turn Start: 3, Max: 6). Resource spent to play cards.
*   `maxEnergy`: Integer (Default: 3). The default baseline energy refreshed each turn.

### Enemy State
*   `enemyHealth`: Integer (Varies by floor, e.g., Floor 1: 40). If 0, trigger Victory/Floor Progression.
*   `enemyIntent`: Object containing `type` ('attack', 'defend', 'buff') and `value` (Integer). Visible to the player at all times.

### Deck State
*   `drawPile`: Array of Card Objects (Shuffled at start).
*   `hand`: Array of Card Objects (Max capacity: 8).
*   `discardPile`: Array of Card Objects (Face up, unplayed or spent cards).

---

## 3. The Structural Turn Loop
Each combat round executes precisely along the following state lifecycle phases:



### Turn Phase Breakdowns

#### Phase 1: Intent Generation
*   Before the player can act, the enemy randomly rolls an action from its pool.
*   *Example Intent:* "Attack for 10" or "Gain 8 Shield". This intent is rendered UI-side as a warning element so the player can calculate their optimal play.

#### Phase 2: Draw & Resource Reset
*   The `playerShield` value is wiped clean (reduced to 0).
*   The `currentEnergy` pool is reset to match `maxEnergy` (3).
*   The engine evaluates `drawPile`. If it contains fewer than 5 cards, the entire `discardPile` is immediately shuffled into the `drawPile`.
*   5 cards are moved from the top of the `drawPile` into the `hand`.

#### Phase 3: Player Action Window
*   The player selects a card from their `hand`.
*   **Validation Check:** If `card.energyCost <= currentEnergy`, the card is valid. If not, the UI rejects the play.
*   **Resolution:**
  1. `currentEnergy` is reduced by `card.energyCost`.
  2. The card’s payload effect mutates the target state (`enemyHealth`, `playerShield`, or engine states).
  3. The card object is popped out of the `hand` array and pushed into the `discardPile` array.
*   This phase repeats until the player clicks the "End Turn" button or runs out of energy.

#### Phase 4: Discard Cleanout
*   All remaining unplayed cards in the `hand` are moved directly into the `discardPile`. The `hand` array is cleared to empty.

#### Phase 5: Enemy Execution
*   The enemy’s calculated intent is executed.
*   **Damage Resolution Formula:**
  *   If `enemyIntent.type === 'attack'`:
    *   `incomingDamage = enemyIntent.value`
    *   If `playerShield >= incomingDamage`:
      *   `playerShield = playerShield - incomingDamage`
    *   If `playerShield < incomingDamage`:
      *   `netDamage = incomingDamage - playerShield`
      *   `playerShield = 0`
      *   `playerHealth = playerHealth - netDamage`

---

## 4. Card Design Architecture & Core Archetypes
Cards are JSON objects consisting of structural definitions. The game uses a 15-card starter deck split into three primary classifications:

```json
{
  "id": "plasma_strike_01",
  "name": "Plasma Strike",
  "type": "Attack",
  "cost": 1,
  "value": 6,
  "description": "Deal 6 damage to the enemy target.",
  "imagePath": "/assets/plasma_strike.jpg"
}
```

### The Three Archetypes

#### A. Attack (Red Theme)
*   **Primary Objective:** Deplete `enemyHealth`.
*   **Mechanic:** Modifies `enemyHealth` downwards immediately upon deployment.

#### B. Defend (Blue Theme)
*   **Primary Objective:** Mitigate incoming damage for the active turn phase.
*   **Mechanic:** Modifies `playerShield` upwards. This value acts as temporary mitigation that vanishes when Phase 2 triggers next turn.

#### C. Overdrive (Purple Theme)
*   **Primary Objective:** State manipulation, combo acceleration, resource economy editing.
*   **Mechanic:** Manipulates metadata pools (e.g., `currentEnergy`, card draws, force-discarding elements, or status multipliers).

---

## 5. Starter Deck Manifest (15 Cards Total)

To ensure game balance and smooth operational loops right out of the gate, populate your game state array with the following quantitative matrix:

| Count | Card Name | Type | Cost | Mechanics / State Mutations |
| :--- | :--- | :--- | :--- | :--- |
| **4x** | **Plasma Strike** | Attack | 1 | `enemyHealth -= 6` |
| **4x** | **Aegis Grid** | Defend | 1 | `playerShield += 5` |
| **2x** | **Shatter Core** | Attack | 2 | `enemyHealth -= 12` |
| **2x** | **Iron Wall** | Defend | 2 | `playerShield += 10` |
| **2x** | **Amplifier Loop** | Overdrive | 0 | `currentEnergy += 1`, Draw 1 card |
| **1x** | **Aether Overload**| Overdrive | 3 | `enemyHealth -= 20`, Draw 2 cards |

---

## 6. Frontend UI Layout Wireframe Guidelines
When coding the UI layer with Claude, ensure the component elements obey this spatial design:

1.  **Top Ribbon (Enemy Vault):** Contains enemy portrait, an absolute centered `enemyHealth` progress bar, and a glowing, high-contrast container showing the upcoming `enemyIntent` icon and value.
2.  **Center Arena Grid:** Neutral field backdrop utilizing dark, rainy ambient textures. Houses central kinetic visual strike animations when cards resolve.
3.  **Bottom Status Bar (Player Dashboard):** Left-aligned `playerHealth` and `playerShield` metrics. Right-aligned glowing energy nodes representing `currentEnergy` / `maxEnergy` values.
4.  **Bottom Interactive Arc (The Deck Interface):** A responsive CSS flex container housing the `hand` array. Hovering over cards triggers a dynamic vertical translation (`transform: translateY(-20px) scale(1.05)`) to focus the Artlist AI graphics smoothly.

