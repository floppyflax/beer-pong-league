# Story 4.1: QR Code Scanning and Tournament Join

Status: review

## Story

As a player,
I want to join a tournament by scanning a QR code,
So that I can participate quickly without typing URLs or creating accounts.

## Acceptance Criteria

**Given** a player scans a tournament QR code
**When** QR code is scanned on mobile
**Then** tournament join page opens automatically
**And** player can enter their name (no account required)
**And** player joins tournament in < 30 seconds
**And** player is added to tournament_players
**And** anonymous user is created if needed
**And** player is redirected to tournament dashboard
**And** success message confirms participation

## Tasks / Subtasks

- [x] Review TournamentJoin page (AC: Page opens)
  - [x] Check src/pages/TournamentJoin.tsx exists
  - [x] Verify page loads from QR code URL
  - [x] Test tournament data is fetched
  - [x] Ensure page renders correctly

- [x] Implement join form (AC: Enter name)
  - [x] Display simple name input form
  - [x] Validate name (min 1 char, max 100 chars)
  - [x] No account creation required
  - [x] Large, clear "Join" button
  - [x] Test form is mobile-friendly

- [x] Create anonymous user if needed (AC: Anonymous user created)
  - [x] Check if user has identity
  - [x] If not, create anonymous user
  - [x] Generate device fingerprint
  - [x] Store in localStorage
  - [x] Test anonymous user creation works

- [x] Add player to tournament (AC: Added to tournament_players)
  - [x] Insert into tournament_players table
  - [x] Link to tournament_id
  - [x] Set user_id or anonymous_user_id
  - [x] Record joined_at timestamp
  - [x] Test insertion works

- [x] Optimize join flow for speed (AC: Join in < 30s)
  - [x] Minimize form fields (name only)
  - [x] Use optimistic updates
  - [x] Reduce network requests
  - [x] Test join completes quickly
  - [x] Measure time from scan to dashboard

- [x] Implement redirect and confirmation (AC: Redirect, success message)
  - [x] Redirect to tournament dashboard
  - [x] Display success toast notification
  - [x] Show "You've joined [Tournament Name]!"
  - [x] Test redirect works correctly

- [ ] Add camera QR scanning (optional enhancement)
  - [ ] Install QR scanner library (optional)
  - [ ] Add camera permission request
  - [ ] Implement QR code scanning
  - [ ] Fallback to manual URL entry

## Dev Notes

### Existing Components

**TournamentJoin.tsx:**
- Already exists in `src/pages/TournamentJoin.tsx`
- Needs completion of join logic
- Review TODOs in the file

**Join Flow:**
```typescript
// URL: /tournament/join/:tournamentId

function TournamentJoin() {
  const { tournamentId } = useParams();
  const [name, setName] = useState('');
  const { identity, createAnonymousUser } = useIdentity();
  const navigate = useNavigate();
  
  const handleJoin = async () => {
    try {
      // 1. Ensure user has identity
      let userId = null;
      let anonymousUserId = null;
      
      if (identity) {
        if (identity.type === 'authenticated') {
          userId = identity.userId;
        } else {
          anonymousUserId = identity.anonymousUserId;
        }
      } else {
        // Create anonymous user
        const newAnonymousUser = await createAnonymousUser(name);
        anonymousUserId = newAnonymousUser.id;
      }
      
      // 2. Join tournament
      await DatabaseService.joinTournament({
        tournament_id: tournamentId,
        user_id: userId,
        anonymous_user_id: anonymousUserId
      });
      
      // 3. Success feedback
      toast.success(`Vous avez rejoint le tournament !`);
      
      // 4. Redirect to tournament dashboard
      navigate(`/tournament/${tournamentId}`);
      
    } catch (error) {
      toast.error('Erreur lors de la participation au tournament');
      console.error(error);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Rejoindre le Tournament
        </h1>
        
        <p className="text-slate-400 mb-6">
          Entrez votre nom pour participer
        </p>
        
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
          className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg mb-4 text-lg"
        />
        
        <button
          onClick={handleJoin}
          disabled={!name.trim()}
          className="w-full px-6 py-4 bg-amber-500 text-slate-900 rounded-lg font-bold text-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Rejoindre
        </button>
      </div>
    </div>
  );
}
```

### QR Code Scanning (Optional Enhancement)

**Install Scanner Library:**
```bash
npm install @yudiel/react-qr-scanner
```

**Implement Scanning:**
```typescript
import { QrScanner } from '@yudiel/react-qr-scanner';

function QRCodeScanner() {
  const navigate = useNavigate();
  
  const handleScan = (result: string) => {
    // Extract tournament ID from URL
    const match = result.match(/\/tournament\/join\/([a-f0-9-]+)/);
    if (match) {
      navigate(`/tournament/join/${match[1]}`);
    }
  };
  
  return (
    <QrScanner
      onDecode={handleScan}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Performance Optimization

**Target: < 30 seconds from scan to dashboard**
1. Scan QR code → Open URL (instant)
2. Load page → Fetch tournament (< 1s)
3. Enter name (user input, 5-10s)
4. Submit form → Create user + join (< 2s)
5. Redirect to dashboard (< 1s)
6. **Total: 10-15 seconds**

### Testing Checklist

**Manual Testing:**
1. Scan QR code → Page opens
2. Enter name → Form validates
3. Click Join → Success message
4. Redirected to dashboard → Tournament loaded
5. Verify participant appears in list
6. Test without account → Anonymous user created
7. Measure join time → Should be < 30s

**Edge Cases:**
- Invalid tournament ID
- Tournament already joined
- Tournament is finished
- Network offline
- Name validation errors

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Process Patterns - User Onboarding]
- [Source: _bmad-output/planning-artifacts/architecture.md#Decision 1.4: Form Management]
- [Source: _bmad-output/planning-artifacts/prd.md#FR1.2: Rejoindre un Championnat]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: Tournament Participation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.5

### Debug Log References

- Added name validation (min 1, max 100 chars) with character counter
- Added joined_at timestamp to tournament_players insert
- Optimized form for mobile (full-width, large touch targets, text-base to prevent iOS zoom)
- Improved success message to include tournament name

### Completion Notes List

✅ **Task 1: Review TournamentJoin page**
- Page exists and loads from `/tournament/:id/join` route (works with QR code URLs)
- Tournament data is fetched from LeagueContext
- Page renders correctly with loading states and error handling

✅ **Task 2: Implement join form**
- Simple name input form displayed
- Name validation: min 1 char, max 100 chars with character counter
- No account creation required (uses anonymous user flow)
- Large, clear "Join" button (min-height 44px for touch targets)
- Mobile-friendly: full-width inputs, text-base to prevent iOS zoom

✅ **Task 3: Create anonymous user if needed**
- Uses `useRequireIdentity` hook which handles identity creation
- Checks if user has identity via `ensureIdentity()`
- Creates anonymous user if needed (handled by `addAnonymousPlayerToTournament`)
- Device fingerprint generated via `getDeviceFingerprint()`
- Stored in localStorage via LocalUserService

✅ **Task 4: Add player to tournament**
- Inserts into tournament_players table via `addAnonymousPlayerToTournament`
- Links to tournament_id
- Sets anonymous_user_id
- Records joined_at timestamp (explicitly set in DatabaseService)

✅ **Task 5: Optimize join flow for speed**
- Form has only name field (minimal fields)
- Uses optimistic updates (local state updated immediately)
- Single network request for join operation
- Flow completes in well under 30 seconds

✅ **Task 6: Implement redirect and confirmation**
- Redirects to `/tournament/:id` dashboard after successful join
- Displays success toast with tournament name: "Tu as rejoint le tournoi \"[Tournament Name]\" !"
- All redirects and confirmations working correctly

### File List

**Files Modified:**
- src/pages/TournamentJoin.tsx (added name validation, improved mobile UX, optimized flow)
- src/services/DatabaseService.ts (added joined_at timestamp to tournament_players insert)
- tests/unit/pages/TournamentJoin.test.tsx (comprehensive test suite covering all acceptance criteria)
