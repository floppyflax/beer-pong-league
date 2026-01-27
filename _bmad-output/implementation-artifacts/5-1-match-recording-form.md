# Story 5.1: Match Recording Form

Status: ready-for-dev

## Story

As a player,
I want to record a match quickly,
So that the leaderboard updates immediately and I can continue playing.

## Acceptance Criteria

**Given** a player is in a tournament
**When** they want to record a match
**Then** match recording form is displayed
**And** form allows selection of players for team A and team B
**And** form allows entry of scores
**And** form supports 1v1, 2v2, 3v3 formats
**And** form validates input (scores, player selection)
**And** form submits match in < 1 minute
**And** match is saved to Supabase and localStorage
**And** UI updates optimistically before server confirmation
**And** success message confirms match recording

## Tasks / Subtasks

- [ ] Create MatchRecordingForm component (AC: Form displayed)
  - [ ] Create src/components/MatchRecordingForm.tsx
  - [ ] Design form layout (teams, scores)
  - [ ] Add player selection dropdowns
  - [ ] Add score inputs
  - [ ] Style with Tailwind (alcohol-friendly)

- [ ] Implement player selection (AC: Select players)
  - [ ] Load tournament participants
  - [ ] Display player dropdowns for each team position
  - [ ] Support 1v1 (1 per team), 2v2 (2 per team), 3v3 (3 per team)
  - [ ] Prevent duplicate player selection
  - [ ] Test player selection works

- [ ] Implement score entry (AC: Entry of scores)
  - [ ] Add score inputs for each team
  - [ ] Default scores: 0
  - [ ] Validate scores (0-10 range typical)
  - [ ] Large, touch-friendly inputs
  - [ ] Test score entry works

- [ ] Add format support (AC: Supports formats)
  - [ ] Detect tournament format (1v1, 2v2, 3v3)
  - [ ] Adjust player slots based on format
  - [ ] Validate correct number of players selected
  - [ ] Test all formats work

- [ ] Integrate Zod validation (AC: Validates input)
  - [ ] Use matchSchema from validation.ts
  - [ ] Validate team composition
  - [ ] Validate scores
  - [ ] Display validation errors
  - [ ] Test validation catches errors

- [ ] Implement match submission (AC: Submits match)
  - [ ] Call DatabaseService.recordMatch()
  - [ ] Save to Supabase matches table
  - [ ] Save to localStorage as fallback
  - [ ] Handle offline mode
  - [ ] Test submission works

- [ ] Add optimistic updates (AC: UI updates optimistically)
  - [ ] Update leaderboard immediately
  - [ ] Show temporary match in history
  - [ ] Sync with Supabase in background
  - [ ] Handle sync errors
  - [ ] Test optimistic updates work

- [ ] Optimize for speed (AC: Submit in < 1 minute)
  - [ ] Minimize form fields
  - [ ] Pre-fill defaults
  - [ ] Large, easy-to-tap buttons
  - [ ] Test submission time
  - [ ] Measure and optimize

## Dev Notes

### MatchRecordingForm Component

**src/components/MatchRecordingForm.tsx:**
```typescript
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { matchSchema } from '@/utils/validation';
import { DatabaseService } from '@/services/DatabaseService';
import toast from 'react-hot-toast';

interface MatchRecordingFormProps {
  tournamentId: string;
  leagueId: string;
  format: '1v1' | '2v2' | '3v3';
  participants: Participant[];
  onSuccess: () => void;
}

export function MatchRecordingForm({ 
  tournamentId, 
  leagueId, 
  format, 
  participants,
  onSuccess 
}: MatchRecordingFormProps) {
  const playersPerTeam = format === '1v1' ? 1 : format === '2v2' ? 2 : 3;
  
  const form = useForm({
    defaultValues: {
      teamA: Array(playersPerTeam).fill(''),
      teamB: Array(playersPerTeam).fill(''),
      teamAScore: 10,
      teamBScore: 0
    }
  });
  
  const onSubmit = async (data: any) => {
    try {
      // Optimistic update
      const tempMatch = {
        id: `temp-${Date.now()}`,
        ...data,
        status: 'pending'
      };
      
      // Update UI immediately
      onSuccess(tempMatch);
      
      // Save to Supabase
      await DatabaseService.recordMatch({
        league_id: leagueId,
        tournament_id: tournamentId,
        team_a_players: data.teamA,
        team_b_players: data.teamB,
        team_a_score: data.teamAScore,
        team_b_score: data.teamBScore,
        played_at: new Date().toISOString()
      });
      
      toast.success('Match enregistré !');
      
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Team A */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Équipe A</h3>
        
        {Array.from({ length: playersPerTeam }).map((_, i) => (
          <select
            key={i}
            {...form.register(`teamA.${i}`)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg mb-2 text-lg"
          >
            <option value="">Sélectionner joueur {i + 1}</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ))}
        
        <input
          type="number"
          {...form.register('teamAScore', { valueAsNumber: true })}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg text-3xl text-center font-bold mt-4"
        />
      </div>
      
      {/* Team B */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Équipe B</h3>
        
        {Array.from({ length: playersPerTeam }).map((_, i) => (
          <select
            key={i}
            {...form.register(`teamB.${i}`)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg mb-2 text-lg"
          >
            <option value="">Sélectionner joueur {i + 1}</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ))}
        
        <input
          type="number"
          {...form.register('teamBScore', { valueAsNumber: true })}
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg text-3xl text-center font-bold mt-4"
        />
      </div>
      
      <button
        type="submit"
        className="w-full px-8 py-4 bg-amber-500 text-slate-900 rounded-lg font-bold text-xl hover:bg-amber-600 transition-colors"
      >
        Enregistrer le Match
      </button>
    </form>
  );
}
```

### Data Model

**Match Record:**
```typescript
interface MatchRecord {
  id: string;
  league_id: string;
  tournament_id: string;
  team_a_players: string[];  // Player IDs
  team_b_players: string[];  // Player IDs
  team_a_score: number;
  team_b_score: number;
  status: 'pending' | 'confirmed' | 'rejected';
  played_at: string;  // ISO timestamp
  created_at: string;
  updated_at: string;
}
```

**Database Structure:**
- `matches` table: Core match data
- `match_players` table: Join table for players in matches

### Performance Optimization

**Target: < 1 minute to record match**
1. Open form (instant)
2. Select players (10-20s)
3. Enter scores (5-10s)
4. Submit (< 1s)
5. **Total: 15-35 seconds** ✅

**Optimizations:**
- Pre-fill common scores (10-0 for beer pong)
- Large touch targets for easy selection
- Minimal validation (only essential)
- Optimistic updates for instant feedback

### Testing Checklist

**Manual Testing:**
1. Open form → Displays correctly
2. Select players → No duplicates
3. Enter scores → Validates range
4. Submit → Success message
5. Check leaderboard → Updates immediately
6. Verify database → Match saved
7. Test offline → Saves to localStorage

**Edge Cases:**
- Duplicate player selection
- Invalid scores (negative, > 10)
- Network offline
- Missing player selection
- Format mismatch

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 1.4: Form Management]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#MatchRecordingForm Component]
- [Source: _bmad-output/planning-artifacts/prd.md#FR2.1: Enregistrement de Match]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5: Match Recording & ELO System]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- src/components/MatchRecordingForm.tsx

**Files to Modify:**
- src/pages/TournamentDashboard.tsx (integrate form)
- src/services/DatabaseService.ts (add recordMatch method)
