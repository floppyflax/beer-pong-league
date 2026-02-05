# Story 8.1: Tournament Join Flow - QR Scan, Manual Entry & Deep Link

Status: ready-for-dev

## Story

As a user (authenticated or anonymous),
I want to join an existing tournament by scanning a QR code (in-app or native), entering a code manually, or clicking a deep link,
so that I can participate in beer pong tournaments quickly and seamlessly.

## Context

This story implements the complete tournament join flow with three entry methods:
1. **Manual code entry** - User types tournament code (e.g., "ABC123")
2. **In-app QR scan** - User scans QR code with integrated camera component
3. **Native QR scan (deep link)** - User scans QR code with phone's native camera, opens URL in browser

**Key requirement:** Support both authenticated users (direct join with existing profile) and anonymous users (join with display_name, can authenticate later).

**Why this matters:**
- Low friction for party/social contexts
- Anonymous users can participate immediately
- Identity merge later preserves tournament history

## Acceptance Criteria

### AC1: Manual Code Entry
1. **Given** user on `/tournament/join`
   **When** user types a tournament code in input field (e.g., "ABC123")
   **Then** real-time validation checks if code exists
   **And** if valid, display tournament details (name, player count, date/time)
   **And** "Rejoindre" button becomes enabled
   **When** code is invalid
   **Then** display error message "Tournoi introuvable"

### AC2: In-App QR Code Scanner
2. **Given** user on `/tournament/join`
   **When** user clicks "📷 Scanner QR Code" button
   **Then** camera permission requested (if not already granted)
   **And** camera view opens with QR code scanner overlay
   **When** valid tournament QR code detected
   **Then** code automatically populated in input field
   **And** tournament details displayed
   **And** scanner closes automatically

### AC3: Deep Link via Native QR Scan
3. **Given** tournament QR code contains URL `https://app.com/tournament/join?code=ABC123`
   **When** user scans with phone's native camera app
   **Then** browser/app opens with URL
   **And** code extracted from query parameter `?code=ABC123`
   **And** code pre-filled in input field
   **And** tournament details auto-loaded and displayed

### AC4: Join as Authenticated User
4. **Given** user is logged in (hasIdentity = true)
   **When** user clicks "REJOINDRE LE TOURNOI" button
   **Then** user's authenticated profile is used directly
   **And** user added to `tournament_players` table
   **And** no display_name prompt shown
   **And** navigation to `/tournament/[id]/dashboard`

### AC5: Join as Anonymous User
5. **Given** user is NOT logged in (hasIdentity = false)
   **When** user clicks "REJOINDRE LE TOURNOI" button
   **Then** prompt displayed: "Comment veux-tu apparaître ?"
   **And** input field for display_name with placeholder "Ton pseudo"
   **When** user enters display_name and confirms
   **Then** check uniqueness within THIS tournament only
   **And** if unique, create anonymous identity (via AnonymousUserService)
   **And** add user to tournament with display_name
   **And** navigation to `/tournament/[id]/dashboard`

### AC6: Display Name Uniqueness Validation
6. **Given** anonymous user entering display_name
   **When** name already exists in tournament
   **Then** display error "Ce pseudo est déjà pris dans ce tournoi"
   **And** suggest alternatives (e.g., "Florian2", "Florian_BP")
   **When** name is unique within tournament
   **Then** validation passes, allow join

### AC7: Tournament Details Display
7. **Given** valid tournament code entered/scanned
   **When** tournament found in database
   **Then** display card with:
   - Tournament name (e.g., "🏆 Summer Cup 2026")
   - Player count (e.g., "👥 8/16 joueurs")
   - Date/time if available (e.g., "📅 Aujourd'hui à 20h00")
   - Format info (e.g., "Format: 2v2" or "Format: Libre")
   - Tournament status (e.g., "En cours", "À venir")

## Tasks / Subtasks

- [ ] Task 1: Create TournamentJoin page component (AC: 1, 2, 3, 7)
  - [ ] Setup route `/tournament/join` in router
  - [ ] Create `TournamentJoin.tsx` component
  - [ ] Add state management for code, tournament, loading, errors
  - [ ] Implement deep link support (useSearchParams to extract `?code=`)
  - [ ] Auto-load tournament if code in URL on mount

- [ ] Task 2: Implement manual code entry (AC: 1)
  - [ ] Add input field with label "Code du tournoi"
  - [ ] Implement real-time validation (debounced, 500ms)
  - [ ] Call DatabaseService to check if tournament exists
  - [ ] Display tournament details card if found
  - [ ] Display error message if not found
  - [ ] Enable/disable "Rejoindre" button based on validity

- [ ] Task 3: Implement in-app QR scanner (AC: 2)
  - [ ] Add "📷 Scanner QR" button next to input
  - [ ] Integrate QR scanner library (react-qr-reader or html5-qrcode)
  - [ ] Request camera permissions
  - [ ] Display camera view with scanner overlay
  - [ ] On successful scan, populate input field with code
  - [ ] Auto-close scanner on success
  - [ ] Handle camera permission denied gracefully

- [ ] Task 4: Generate QR codes with deep links (AC: 3)
  - [ ] Update tournament creation to generate QR code
  - [ ] QR code content = full URL: `https://[domain]/tournament/join?code=[CODE]`
  - [ ] Use QRCode library (qrcode.react or similar)
  - [ ] Store QR code URL or display dynamically
  - [ ] Add "Partager QR Code" button on tournament dashboard

- [ ] Task 5: Implement authenticated user join flow (AC: 4)
  - [ ] Use useAuth hook to check authentication status
  - [ ] If authenticated, show direct "REJOINDRE LE TOURNOI" button
  - [ ] On click, call DatabaseService.joinTournament(tournamentId, userId)
  - [ ] Insert into `tournament_players` with user_id
  - [ ] Navigate to `/tournament/[id]/dashboard`
  - [ ] Show success toast "Tu as rejoint le tournoi !"

- [ ] Task 6: Implement anonymous user join flow (AC: 5, 6)
  - [ ] If NOT authenticated, show "REJOINDRE" button
  - [ ] On click, display modal/inline form for display_name
  - [ ] Add input with placeholder "Ton pseudo" (e.g., "Florian")
  - [ ] Validate display_name uniqueness within tournament
  - [ ] Call AnonymousUserService.createAnonymousIdentity()
  - [ ] Insert into `tournament_players` with local_identity_id + display_name
  - [ ] Store display_name in tournament_players table
  - [ ] Navigate to tournament dashboard
  - [ ] Show info toast "Tu peux créer un compte plus tard pour garder ton historique"

- [ ] Task 7: Add display name uniqueness check (AC: 6)
  - [ ] Query `tournament_players` for existing display_name in tournament
  - [ ] If exists, show error with suggestions
  - [ ] Generate suggestions: append number or suffix
  - [ ] Re-validate on input change (debounced)

- [ ] Task 8: Create tournament details card component (AC: 7)
  - [ ] Create `TournamentDetailsCard.tsx`
  - [ ] Display tournament name, player count, date, format
  - [ ] Add icons for visual clarity (🏆, 👥, 📅)
  - [ ] Style with gradient border and card shadow
  - [ ] Make responsive for mobile

- [ ] Task 9: Add database methods for tournament join (AC: 4, 5)
  - [ ] DatabaseService.getTournamentByCode(code)
  - [ ] DatabaseService.joinTournament(tournamentId, userId, displayName?)
  - [ ] DatabaseService.checkDisplayNameUnique(tournamentId, displayName)
  - [ ] Handle errors (tournament full, already joined, etc.)

## Dev Notes

### Relevant Architecture Patterns and Constraints

**Three Entry Points Converging:**
- Manual entry → input validation → tournament details
- In-app scan → code detected → input populated → tournament details
- Deep link → query param → code pre-filled → tournament details
- **All paths lead to same tournament details display + join flow**

**Authentication State Management:**
- Use `useAuth()` for authentication status
- Use `useIdentity()` for local identity detection
- Use `AnonymousUserService` for anonymous identity creation
- Use `IdentityMergeService` later if user authenticates

**QR Code Generation:**
- Generate during tournament creation
- Content = full deep link URL: `https://[DOMAIN]/tournament/join?code=[CODE]`
- Use `qrcode.react` or `react-qr-code` library
- Store QR code as data URL or generate on-demand

**Display Name Scoping:**
- Display names are unique PER TOURNAMENT, not globally
- Stored in `tournament_players.display_name` column
- Check uniqueness: `WHERE tournament_id = ? AND display_name = ?`

**Camera Permissions:**
- Request permission via browser API
- Handle denied gracefully (show manual entry fallback)
- Test on both iOS and Android browsers

### Source Tree Components to Touch

**Files to Create:**
- `src/pages/TournamentJoin.tsx` - Main join page
- `src/components/TournamentDetailsCard.tsx` - Tournament info display
- `src/components/QRScanner.tsx` - In-app QR scanner wrapper

**Files to Modify:**
- `src/services/DatabaseService.ts` - Add tournament join methods
- `src/services/AnonymousUserService.ts` - May need display_name support
- `src/App.tsx` - Add `/tournament/join` route

**Files to Reference:**
- `src/context/AuthContext.tsx` - Authentication state
- `src/hooks/useIdentity.ts` - Identity detection
- `src/services/IdentityMergeService.ts` - Future merge support

**Database Schema:**
```sql
-- Ensure tournament_players supports display_name
ALTER TABLE tournament_players 
ADD COLUMN display_name TEXT; -- For anonymous users

-- Unique constraint: (tournament_id, display_name)
CREATE UNIQUE INDEX idx_tournament_display_name 
ON tournament_players(tournament_id, display_name) 
WHERE display_name IS NOT NULL;
```

**Dependencies:**
- QR Code Library: `npm install react-qr-code` or `qrcode.react`
- QR Scanner Library: `npm install html5-qrcode` or `react-qr-reader`

### Testing Standards Summary

**Unit Testing:**
- Test manual code validation logic
- Test display_name uniqueness check
- Test deep link code extraction from URL params
- Test authenticated vs anonymous join logic paths
- Mock DatabaseService calls

**Integration Testing:**
- Test full join flow for authenticated user
- Test full join flow for anonymous user with display_name
- Test QR code generation and scanning
- Test display_name uniqueness validation with DB
- Test navigation to tournament dashboard after join

**E2E Testing:**
- Verify manual code entry → join → dashboard
- Verify in-app QR scan → join → dashboard
- Verify deep link QR scan → join → dashboard
- Verify anonymous user prompted for display_name
- Verify authenticated user joins directly (no prompt)
- Verify display_name collision shows error + suggestions
- Test camera permissions (allow/deny scenarios)

### Project Structure Notes

**Alignment with Unified Project Structure:**
- ✅ Page location: `src/pages/TournamentJoin.tsx`
- ✅ Component naming: PascalCase
- ✅ Service usage: DatabaseService, AnonymousUserService
- ✅ Context usage: AuthContext, IdentityContext
- ✅ Styling: Tailwind CSS with consistent patterns

**Responsive Design:**
- Mobile-first (primary use case is mobile at parties)
- Large touch-friendly input fields
- Camera view full-screen on mobile
- Clear error messages visible on small screens

**Error Handling:**
- Tournament not found → clear error message
- Camera permission denied → fallback to manual entry
- Display name taken → suggestions displayed
- Network errors → retry option

### UI/UX Design

**TournamentJoin Page Layout:**
```
[Logo Beer Pong League]

REJOINDRE UN TOURNOI

Code du tournoi
[Input: ABC123________] [📷 Scanner QR]

[Tournament Details Card if code valid:]
━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tournoi trouvé !

🏆 Summer Cup 2026
👥 8/16 joueurs
📅 Aujourd'hui à 20h00
Format: 2v2

[If NOT logged in:]
Comment veux-tu apparaître ?
[Input: Ton pseudo________]
💡 Tu pourras créer un compte plus tard

[GROS BOUTON ORANGE]
REJOINDRE LE TOURNOI
━━━━━━━━━━━━━━━━━━━━━━━━
```

**QR Scanner Overlay:**
```
[Full-screen camera view]

┌─────────────────┐
│                 │
│    [QR BOX]     │
│                 │
└─────────────────┘

Scanne le QR code du tournoi

[X Fermer]
```

**Display Name Prompt (Anonymous):**
```
Comment veux-tu apparaître ?

[Input: Florian________]

💡 Exemples : "Florian", "FloppyFlax", "BeerPongKing"

[Si collision:]
❌ "Florian" est déjà pris dans ce tournoi
Essaie : Florian2, Florian_BP, Florian2026

[Bouton: CONFIRMER]
```

### References

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-8] Epic 8: Tournament & League Management
- [Source: Party Mode Discussion 2026-02-03] Tournament join flow requirements

**Related Stories:**
- Story 8.2: Tournament Creation Flow (creates tournaments that can be joined)
- Story 8.5: Match Recording (used within joined tournaments)

**Architecture Decisions:**
- [Decision: Display name scoped per tournament] Prevents global name conflicts
- [Decision: Deep link QR codes] Supports native camera scanning
- [Decision: Anonymous user support] Low friction for party contexts

**External Documentation:**
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) - QR scanner library
- [react-qr-code](https://www.npmjs.com/package/react-qr-code) - QR code generation
- [Supabase Auth](https://supabase.com/docs/guides/auth) - Authentication patterns

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent_

### Completion Notes List

_To be filled by dev agent_

### File List

_To be filled by dev agent_
