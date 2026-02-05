# Story 10.4: Join Page with QR Scanner & Code Input

Status: ready-for-dev

## Story

As a user (authenticated or anonymous),
I want to join a tournament by scanning a QR code or entering a join code,
so that I can quickly participate without manual navigation.

## Context

The Join page (`/join`) is a public-access page that allows anyone to join tournaments. It provides two methods: QR code scanning (camera) and manual code entry.

**Key Features:**
- QR code scanner (camera access)
- Manual code input field
- Bottom menu with 2 actions: "SCANNER QR" and "CODE"
- Works for both authenticated and anonymous users
- Validates tournament code before joining

**Dependencies:**
- Story 9.2 (Infrastructure)
- Story 9.4 (Bottom Menu Spécifique)

## Acceptance Criteria

### AC1: Page Layout
1. **Given** user visits `/join`
   **When** page loads
   **Then** display join page layout:
   - Header with title "Rejoindre un Tournoi"
   - Instructions: "Scannez le QR code ou saisissez le code du tournoi"
   - Large placeholder area (for scanner or input)
   - Bottom menu with 2 buttons: "📷 SCANNER QR" | "🔢 CODE"

### AC2: QR Scanner Modal (Mobile)
2. **Given** user on `/join` page
   **When** user taps "SCANNER QR" button
   **Then** open full-screen camera scanner modal
   **And** request camera permission if not granted
   **When** camera permission denied
   **Then** show error message "Accès caméra requis"
   **When** QR code detected
   **Then** extract tournament code
   **And** validate code
   **And** navigate to tournament if valid
   **And** show error if invalid

### AC3: Code Input Modal
3. **Given** user on `/join` page
   **When** user taps "CODE" button
   **Then** open code input modal (full-screen on mobile)
   **And** display input field (6-8 characters, uppercase)
   **And** "REJOINDRE" button
   **When** user enters code and submits
   **Then** validate code format (alphanumeric)
   **And** fetch tournament by code
   **When** code valid
   **Then** navigate to `/tournament/:id`
   **When** code invalid
   **Then** show error "Code invalide ou tournoi introuvable"

### AC4: Code Validation
4. **Given** user submits join code
   **When** code is processed
   **Then** validate format (6-8 chars, alphanumeric)
   **And** query database for tournament with matching code
   **When** tournament found
   **Then** navigate to `/tournament/:id`
   **When** tournament not found
   **Then** show error message
   **When** tournament finished
   **Then** show warning "Ce tournoi est terminé"

### AC5: Anonymous User Support
5. **Given** anonymous user (not authenticated)
   **When** joins tournament
   **Then** allow join without authentication
   **And** create anonymous user identity
   **And** navigate to tournament page

### AC6: Desktop Experience
6. **Given** user on desktop (>= 1024px)
   **When** viewing `/join` page
   **Then** show code input inline (not modal)
   **And** show "Scanner QR" button with tooltip "Utilisez votre mobile"
   **Or** allow webcam scanning if available

### AC7: Empty State (Default View)
7. **Given** user just arrived on `/join`
   **When** no action taken yet
   **Then** display centered empty state:
   - Large QR icon
   - Title: "Rejoindre un Tournoi"
   - Instructions: "Scannez le QR code affiché par l'organisateur ou saisissez le code manuellement"
   - Two prominent action buttons below

## Tasks / Subtasks

### Task 1: Create Join page (3h)
- [ ] Create `src/pages/Join.tsx` (or update existing)
- [ ] Implement layout with header and instructions
- [ ] Add empty state with large icons
- [ ] Handle modal states (scanner, code input)
- [ ] Apply responsive design

### Task 2: QR Scanner component (4h)
- [ ] Create `src/components/join/QRScanner.tsx`
- [ ] Integrate QR scanning library (e.g., `react-qr-scanner`, `html5-qrcode`)
- [ ] Request camera permissions
- [ ] Handle permission denied error
- [ ] Parse scanned QR data (extract tournament code)
- [ ] Validate and process code
- [ ] Full-screen modal on mobile

### Task 3: Code Input Modal (2h)
- [ ] Create `src/components/join/CodeInputModal.tsx`
- [ ] Input field with validation (6-8 chars, alphanumeric)
- [ ] Auto-uppercase transformation
- [ ] "REJOINDRE" button (disabled until valid format)
- [ ] Handle submission
- [ ] Display error messages

### Task 4: Code validation logic (3h)
- [ ] Create `useJoinTournament()` hook
- [ ] Validate code format (regex)
- [ ] Query Supabase for tournament by code
- [ ] Handle tournament found → navigate
- [ ] Handle tournament not found → error
- [ ] Handle finished tournament → warning
- [ ] Support anonymous user join

### Task 5: Bottom Menu integration (1h)
- [ ] Import BottomMenuSpecific
- [ ] Configure 2 actions: Scanner + Code
- [ ] Handle modal open/close state
- [ ] Apply proper icons

### Task 6: Camera permissions handling (2h)
- [ ] Request camera access with `navigator.mediaDevices.getUserMedia()`
- [ ] Handle permission granted
- [ ] Handle permission denied → show error
- [ ] Handle no camera available (desktop)
- [ ] Cleanup camera stream on unmount

### Task 7: Desktop experience (2h)
- [ ] Show inline code input on desktop
- [ ] Optionally enable webcam scanning
- [ ] Add tooltip for "Scanner QR" on desktop
- [ ] Responsive layout adjustments

### Task 8: Unit tests (3h)
- [ ] Test Join page renders
- [ ] Test code validation logic
- [ ] Test modal open/close
- [ ] Test error messages
- [ ] Mock camera API
- [ ] Mock Supabase query

### Task 9: Integration tests (2h)
- [ ] Test full QR scan flow
- [ ] Test manual code entry flow
- [ ] Test invalid code handling
- [ ] Test anonymous user join

**Total Estimate:** 22 hours (3 jours)

## Dev Notes

### useJoinTournament Hook
```typescript
// src/hooks/useJoinTournament.ts
export const useJoinTournament = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { localUser, initializeAnonymousUser } = useIdentity();
  
  const joinByCode = async (code: string) => {
    // Validate format
    if (!/^[A-Z0-9]{6,8}$/.test(code)) {
      throw new Error('Code invalide (6-8 caractères alphanumériques)');
    }
    
    // Query tournament
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('id, name, is_finished, join_code')
      .eq('join_code', code)
      .single();
    
    if (error || !tournament) {
      throw new Error('Code invalide ou tournoi introuvable');
    }
    
    if (tournament.is_finished) {
      throw new Error('Ce tournoi est terminé');
    }
    
    // If anonymous, initialize identity
    if (!isAuthenticated && !localUser) {
      await initializeAnonymousUser();
    }
    
    // Navigate to tournament
    navigate(`/tournament/${tournament.id}`);
  };
  
  return { joinByCode };
};
```

### QR Scanner Component
```typescript
// src/components/join/QRScanner.tsx
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onScan, onClose }: QRScannerProps) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    scanner.render(
      (decodedText) => {
        // Extract code from QR (could be URL or direct code)
        const code = extractCodeFromQR(decodedText);
        onScan(code);
        scanner.clear();
      },
      (error) => {
        console.error('QR scan error:', error);
      }
    );
    
    scannerRef.current = scanner;
    
    return () => {
      scanner.clear();
    };
  }, [onScan]);
  
  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-white">Scanner QR Code</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>
      
      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div id="qr-reader" className="w-full max-w-md" />
      </div>
      
      {/* Instructions */}
      <div className="p-6 text-center text-slate-400 text-sm">
        Placez le QR code dans le cadre pour le scanner
      </div>
    </div>
  );
};
```

### Code Input Modal
```typescript
// src/components/join/CodeInputModal.tsx
export const CodeInputModal = ({ onSubmit, onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await onSubmit(code.toUpperCase());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isValid = /^[A-Z0-9]{6,8}$/.test(code.toUpperCase());
  
  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Saisir le Code</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Ex: ABC123"
          maxLength={8}
          className="w-full px-4 py-4 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-2xl font-bold tracking-wider uppercase focus:border-primary focus:outline-none"
          autoFocus
        />
        
        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}
        
        <button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          className="w-full mt-6 py-4 bg-primary hover:bg-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'VÉRIFICATION...' : 'REJOINDRE'}
        </button>
      </div>
    </div>
  );
};
```

## References

**UX Design Doc:** `ux-ui-design-responsive-architecture.md#page-rejoindre`  
**Epic:** Epic 10 - Connected User Experience  
**Depends on:** Story 9.2, Story 9.4

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_
