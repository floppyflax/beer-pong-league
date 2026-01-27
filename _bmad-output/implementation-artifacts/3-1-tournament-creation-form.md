# Story 3.1: Tournament Creation Form

Status: ready-for-dev

## Story

As an organizer,
I want to create a tournament with minimal fields,
So that I can set up an event quickly without friction.

## Acceptance Criteria

**Given** an authenticated user
**When** they navigate to create tournament page
**Then** simple form is displayed with required fields (name, date, format)
**And** form has maximum 3-5 fields
**And** form supports 1v1, 2v2, 3v3 formats
**And** form validates input using Zod schemas
**And** form submits tournament to Supabase
**And** tournament is created with creator_user_id
**And** tournament is saved to localStorage as fallback
**And** user is redirected to tournament dashboard after creation
**And** success message is displayed

## Tasks / Subtasks

- [ ] Review CreateTournament component (AC: Form displayed)
  - [ ] Check src/pages/CreateTournament.tsx exists
  - [ ] Verify form shows name, date, format fields
  - [ ] Ensure form is simple (3-5 fields max)
  - [ ] Test form renders correctly

- [ ] Integrate Zod validation (AC: Form validates)
  - [ ] Import tournamentSchema from validation.ts
  - [ ] Apply validation to form fields
  - [ ] Display field-specific error messages
  - [ ] Test validation catches invalid inputs

- [ ] Test format selection (AC: Supports formats)
  - [ ] Verify dropdown/radio shows 1v1, 2v2, 3v3
  - [ ] Ensure default is 2v2
  - [ ] Test format selection persists
  - [ ] Verify format is saved correctly

- [ ] Test form submission (AC: Submits to Supabase)
  - [ ] Verify form calls DatabaseService.createTournament()
  - [ ] Test tournament is inserted into Supabase
  - [ ] Ensure creator_user_id is set
  - [ ] Verify created_at timestamp is correct

- [ ] Test localStorage fallback (AC: Saved to localStorage)
  - [ ] Test tournament saves to localStorage
  - [ ] Verify offline mode works
  - [ ] Ensure sync happens when online
  - [ ] Test no data loss in offline mode

- [ ] Test redirect and success message (AC: Redirect, success message)
  - [ ] Verify redirect to tournament dashboard
  - [ ] Test success toast/message appears
  - [ ] Ensure tournament ID is in URL
  - [ ] Verify dashboard loads tournament data

## Dev Notes

### Existing Components

**CreateTournament.tsx:**
- Already exists in `src/pages/CreateTournament.tsx`
- Should be reviewed and updated with Zod validation
- Ensure form is simplified to 3-5 fields max

**Required Form Fields:**
1. **Tournament Name** (text input, required)
   - Max 200 characters
   - Validation: min 1 char, max 200 chars

2. **Date** (date picker, required)
   - Default: today
   - Validation: must be valid date

3. **Format** (dropdown/radio, required)
   - Options: 1v1, 2v2, 3v3
   - Default: 2v2
   - Validation: must be one of the options

4. **Location** (text input, optional)
   - Max 200 characters
   - Optional field for context

5. **Anti-Cheat** (checkbox, optional)
   - Default: false
   - Optional feature for match verification

### Form Validation

**Using Zod Schema:**
```typescript
import { tournamentSchema } from '@/utils/validation';

const form = useForm({
  resolver: zodResolver(tournamentSchema),
  defaultValues: {
    name: '',
    date: new Date().toISOString(),
    format: '2v2',
    location: '',
    anti_cheat_enabled: false
  }
});

const onSubmit = async (data: TournamentInput) => {
  try {
    // Validate with Zod
    const validated = tournamentSchema.parse(data);
    
    // Create tournament
    const tournament = await DatabaseService.createTournament(validated);
    
    // Show success
    toast.success('Tournament créé avec succès !');
    
    // Redirect
    navigate(`/tournament/${tournament.id}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Show validation errors
      error.errors.forEach(err => {
        toast.error(err.message);
      });
    } else {
      toast.error('Erreur lors de la création du tournament');
    }
  }
};
```

### Offline Support

**localStorage Strategy:**
```typescript
// Save to localStorage first (optimistic)
const localTournament = {
  ...tournamentData,
  id: generateLocalId(),
  synced: false
};
localStorage.setItem(`tournament_${localTournament.id}`, JSON.stringify(localTournament));

// Then sync to Supabase
try {
  const supabaseTournament = await supabase
    .from('tournaments')
    .insert(tournamentData)
    .select()
    .single();
  
  // Update localStorage with Supabase ID
  localStorage.setItem(`tournament_${supabaseTournament.id}`, JSON.stringify({
    ...supabaseTournament,
    synced: true
  }));
  
  // Remove temporary local entry
  localStorage.removeItem(`tournament_${localTournament.id}`);
} catch (error) {
  // Keep in localStorage for later sync
  console.error('Failed to sync tournament:', error);
}
```

### Testing Checklist

**Manual Testing:**
1. Navigate to /create-tournament
2. Fill form with valid data → Success
3. Submit with invalid data → Validation errors
4. Select different formats → Format persists
5. Create offline → Saved to localStorage
6. Come online → Syncs to Supabase
7. After creation → Redirected to dashboard

**Edge Cases:**
- Very long tournament name (> 200 chars)
- Invalid date format
- Network fails during submission
- Duplicate tournament names
- Missing required fields

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 1.4: Form Management]
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns - Form Validation]
- [Source: _bmad-output/planning-artifacts/prd.md#FR1.1: Création de Championnat]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Tournament Creation & Management]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- src/pages/CreateTournament.tsx (add Zod validation)
- src/services/DatabaseService.ts (verify createTournament method)
- src/utils/validation.ts (ensure tournamentSchema exists)
