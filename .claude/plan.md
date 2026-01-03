# Game UI Components - XState Integration Plan

## Overview
Integrate the fully-tested XState game state machine into the UI to enable complete game flow visualization and interaction. The machine exists but is currently unused - we'll activate it in GrimoirePage and build phase-specific UI components.

## Critical Finding
**XState gameMachine (121 passing tests) is NOT integrated into UI.** Current UI directly manipulates Supabase without state machine validation.

## Architecture Strategy

### Dual-Sync Pattern
```
Storyteller: XState → Supabase (broadcast)
Players: Supabase → UI (passive receive)
```

### State Management
- **XState**: Game flow control (setup/night/day/execution/gameOver)
- **Zustand**: UI state (selection, zoom, modals)
- **Supabase Realtime**: Cross-client sync

## Implementation Phases

### Phase 1: Core Integration (Priority)
**Goal**: Activate XState in GrimoirePage

**Files to modify**:
1. `src/pages/GrimoirePage.tsx`
   - Import: `import { useMachine } from '@xstate/react'`
   - Replace local state: `const [state, send] = useMachine(gameMachine)`
   - Add Supabase sync: Send events → update DB → broadcast to players
   - Conditional rendering by `state.value` (setup/night/day/etc)

2. `src/logic/stores/uiStore.ts`
   - Add fields: `assignmentMode`, `nightActionInProgress`, `votesCollected`
   - Remove redundant state now managed by XState

3. `src/components/ui/layout/PhaseIndicator.tsx` (enhance existing)
   - Accept `machineState` prop from GrimoirePage
   - Display current phase with visual feedback
   - Show day/night counter from `state.context`

### Phase 2: Role Assignment Component
**Goal**: Enable storyteller to assign roles to players

**New component**: `src/components/game/phases/RoleAssignment.tsx`
- Drag-drop interface (React DnD or Konva native)
- Character pool from `TROUBLE_BREWING_CHARACTERS`
- Send `ASSIGN_ROLE` events to state machine
- Random/balanced allocation helpers
- Visual: Cards with character art, team colors

**Integration**: Render when `state.matches('setup')`

### Phase 3: Night Phase System
**Goal**: Display night action queue and execute abilities

**New components**:
1. `src/components/game/phases/NightPhase.tsx`
   - Display `state.context.nightQueue` from buildNightQueue
   - Current action highlighted
   - Ability execution UI (select targets)
   - Send: `USE_ABILITY`, `SKIP_NIGHT_ACTION`, `END_NIGHT`

2. `src/components/game/ui/NightOrderDisplay.tsx`
   - List characters in night order
   - Show completed/current/pending states
   - Use `getFirstNightOrder()`/`getOtherNightOrder()` from trouble-brewing.ts

**Integration**: Render when `state.matches('gameLoop.night')`

### Phase 4: Day Phase System
**Goal**: Handle discussion, nominations, voting

**New components**:
1. `src/components/game/phases/DayPhase.tsx`
   - Container for discussion/nomination/vote substates
   - Send: `NOMINATE`, `END_DAY`

2. `src/components/game/phases/NominationPanel.tsx`
   - Nominator/nominee selection (only if not in `nominatorsToday`/`nominatedToday`)
   - Validation via `isValidNomination` guard
   - Send: `NOMINATE`, `CANCEL_NOMINATION`, `START_VOTE`

3. `src/components/game/phases/VotingPanel.tsx`
   - Player voting interface
   - Real-time vote count display
   - Ghost vote tracking (`hasUsedGhostVote`)
   - Send: `CAST_VOTE`, `FINISH_VOTE`

4. `src/components/game/ui/VoteCounter.tsx`
   - Display: votes for/required (from `getVotesRequired`)
   - Visual: Progress bar, player avatars

**Integration**: Render when `state.matches('gameLoop.day')`

### Phase 5: Execution & Game Over
**Goal**: Handle execution phase and victory screen

**New components**:
1. `src/components/game/phases/ExecutionPhase.tsx`
   - Display execution target from `state.context.executionTarget`
   - Confirmation UI
   - Send: `EXECUTE`, `SKIP_EXECUTION`

2. `src/components/game/phases/GameOver.tsx`
   - Victory announcement (from `state.context.winner`)
   - End reason (from `state.context.endReason`)
   - Role reveals for all players
   - Statistics: days survived, votes cast

**Integration**: Render when `state.matches('gameOver')`

### Phase 6: Supporting UI
**Goal**: Information display and helper components

**New components**:
1. `src/components/game/ui/GameInfo.tsx`
   - Sidebar with current phase, day/night count
   - Alive/dead player stats
   - Game danger indicators (from `isGameInDanger`)

2. `src/components/game/ui/RoleCard.tsx`
   - Character card display
   - Ability text, team, night order

**Modals** (use existing modal patterns):
- Ability prompts (select targets)
- Confirmation dialogs (execute/skip)
- Role reveals (first night)

## Key Technical Details

### XState Event Handling Pattern
```typescript
// In GrimoirePage storyteller view
const handleNominate = (nominatorId: PlayerId, nomineeId: PlayerId) => {
  send({ type: 'NOMINATE', nominatorId, nomineeId });

  // Sync to Supabase for players
  await supabase
    .from('game_sessions')
    .update({
      current_nominee: nomineeId,
      nominators_today: [...state.context.nominatorsToday, nominatorId]
    })
    .eq('id', sessionId);
};
```

### Permission-Based Rendering
```typescript
// Only storyteller can send events
{role === 'storyteller' && (
  <button onClick={() => send({ type: 'END_NIGHT' })}>
    End Night
  </button>
)}

// Players see read-only state
{role === 'player' && (
  <div>Current Phase: {state.value}</div>
)}
```

### Supabase Schema Updates Needed
```sql
-- Add to game_sessions table
ALTER TABLE game_sessions ADD COLUMN machine_state JSONB;
ALTER TABLE game_sessions ADD COLUMN current_phase TEXT;
ALTER TABLE game_sessions ADD COLUMN current_day INTEGER DEFAULT 0;
ALTER TABLE game_sessions ADD COLUMN current_night INTEGER DEFAULT 0;
```

## Files Reference

### Existing (to modify):
- `src/pages/GrimoirePage.tsx` - Main integration
- `src/logic/stores/uiStore.ts` - UI state extension
- `src/components/ui/layout/PhaseIndicator.tsx` - Enhancement

### Existing (to use):
- `src/logic/machines/gameMachine.ts` - State machine (34 tests)
- `src/logic/night/nightActions.ts` - Night queue logic (27 tests)
- `src/logic/game/gameEnd.ts` - End detection (35 tests)
- `src/data/characters/trouble-brewing.ts` - Character data (25 tests)
- `src/components/game/board/SeatingChart.tsx` - Player layout
- `src/components/game/tokens/PlayerToken.tsx` - Token rendering

### New (to create):
**phases/** (6 components)
- RoleAssignment.tsx
- NightPhase.tsx
- DayPhase.tsx
- NominationPanel.tsx
- VotingPanel.tsx
- GameOver.tsx

**ui/** (3+ components)
- NightOrderDisplay.tsx
- VoteCounter.tsx
- GameInfo.tsx
- RoleCard.tsx

## Success Criteria
1. ✅ XState useMachine active in GrimoirePage
2. ✅ Storyteller can assign roles (setup phase)
3. ✅ Night actions display and execute correctly
4. ✅ Day phase: discuss → nominate → vote flow works
5. ✅ Execution phase functions with game end detection
6. ✅ Game over screen displays correctly
7. ✅ Supabase sync works for multiplayer (storyteller → players)
8. ✅ All 121 existing tests still pass

## Execution Order
Start with **Phase 1** (Core Integration) - this is the foundation. Once XState is active in the UI, subsequent phases can be developed iteratively while the game remains functional at each step.
