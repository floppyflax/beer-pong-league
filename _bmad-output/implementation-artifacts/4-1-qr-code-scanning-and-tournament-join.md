# Story 4.1: QR Code Scanning and Tournament Join

Status: ready-for-dev

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

- [ ] Review TournamentJoin page (AC: Page opens)
  - [ ] Check src/pages/TournamentJoin.tsx exists
  - [ ] Verify page loads from QR code URL
  - [ ] Test tournament data is fetched
  - [ ] Ensure page renders correctly

- [ ] Implement join form (AC: Enter name)
  - [ ] Display simple name input form
  - [ ] Validate name (min 1 char, max 100 chars)
  - [ ] No account creation required
  - [ ] Large, clear "Join" button
  - [ ] Test form is mobile-friendly

- [ ] Create anonymous user if needed (AC: Anonymous user created)
  - [ ] Check if user has identity
  - [ ] If not, create anonymous user
  - [ ] Generate device fingerprint
  - [ ] Store in localStorage
  - [ ] Test anonymous user creation works

- [ ] Add player to tournament (AC: Added to tournament_players)
  - [ ] Insert into tournament_players table
  - [ ] Link to tournament_id
  - [ ] Set user_id or anonymous_user_id
  - [ ] Record joined_at timestamp
  - [ ] Test insertion works

- [ ] Optimize join flow for speed (AC: Join in < 30s)
  - [ ] Minimize form fields (name only)
  - [ ] Use optimistic updates
  - [ ] Reduce network requests
  - [ ] Test join completes quickly
  - [ ] Measure time from scan to dashboard

- [ ] Implement redirect and confirmation (AC: Redirect, success message)
  - [ ] Redirect to tournament dashboard
  - [ ] Display success toast notification
  - [ ] Show "You've joined [Tournament Name]!"
  - [ ] Test redirect works correctly

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

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- src/pages/TournamentJoin.tsx (complete join logic)
- src/services/DatabaseService.ts (add joinTournament method)
- src/context/IdentityContext.tsx (ensure createAnonymousUser works)
