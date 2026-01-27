# Story 3.2: QR Code Generation and Display

Status: ready-for-dev

## Story

As an organizer,
I want a QR code for my tournament,
So that participants can join easily by scanning it.

## Acceptance Criteria

**Given** a tournament is created
**When** organizer views the tournament
**Then** QR code is automatically generated for the tournament
**And** QR code contains tournament join URL
**And** QR code is displayed prominently
**And** QR code can be shared (displayed, printed)
**And** scanning QR code opens tournament join page
**And** QR code works on mobile devices

## Tasks / Subtasks

- [ ] Install QR code library (AC: QR code generated)
  - [ ] Verify qrcode.react is installed
  - [ ] If not: `npm install qrcode.react @types/qrcode.react`
  - [ ] Test library imports correctly

- [ ] Create QRCodeDisplay component (AC: QR code displayed)
  - [ ] Create src/components/QRCodeDisplay.tsx
  - [ ] Import QRCode from qrcode.react
  - [ ] Accept tournamentId as prop
  - [ ] Generate tournament join URL
  - [ ] Render QR code with proper sizing

- [ ] Implement QR code generation (AC: Contains join URL)
  - [ ] Generate URL: `/tournament/join/:tournamentId`
  - [ ] Use full domain: `${window.location.origin}/tournament/join/${tournamentId}`
  - [ ] Test URL is correct format
  - [ ] Verify URL opens tournament join page

- [ ] Design QR code display (AC: Prominently displayed)
  - [ ] Large, scannable size (min 200x200px)
  - [ ] High contrast for scanning
  - [ ] Include tournament name above QR code
  - [ ] Add "Scan to Join" instruction text
  - [ ] Style with Tailwind CSS

- [ ] Add sharing options (AC: Can be shared)
  - [ ] Add "Display Full Screen" button
  - [ ] Add "Download QR Code" button (optional MVP feature)
  - [ ] Test full screen mode works
  - [ ] Ensure printable view is clear

- [ ] Test QR code scanning (AC: Opens join page, works on mobile)
  - [ ] Test scanning with mobile camera app
  - [ ] Verify redirects to tournament join page
  - [ ] Test on iOS and Android
  - [ ] Ensure tournament data loads correctly

- [ ] Integrate into TournamentDashboard (AC: Displayed on dashboard)
  - [ ] Add QRCodeDisplay to TournamentDashboard
  - [ ] Position prominently on dashboard
  - [ ] Test renders correctly
  - [ ] Verify updates when tournament changes

## Dev Notes

### QRCodeDisplay Component

**src/components/QRCodeDisplay.tsx:**
```typescript
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, Download } from 'lucide-react';

interface QRCodeDisplayProps {
  tournamentId: string;
  tournamentName: string;
  size?: number;
}

export function QRCodeDisplay({ 
  tournamentId, 
  tournamentName, 
  size = 256 
}: QRCodeDisplayProps) {
  const joinUrl = `${window.location.origin}/tournament/join/${tournamentId}`;
  
  const handleFullScreen = () => {
    // Create full screen modal with QR code
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/90 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="text-center">
        <h1 class="text-4xl font-bold text-white mb-8">${tournamentName}</h1>
        <div class="bg-white p-8 rounded-lg inline-block">
          <div id="qr-full"></div>
        </div>
        <p class="text-2xl text-white mt-8">Scannez pour rejoindre</p>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Render QR code in modal
    const qrContainer = modal.querySelector('#qr-full');
    if (qrContainer) {
      ReactDOM.render(
        <QRCodeSVG value={joinUrl} size={512} level="H" />,
        qrContainer
      );
    }
    
    // Close on click
    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-6 text-center">
      <h3 className="text-xl font-bold text-white mb-2">
        Inviter des participants
      </h3>
      
      <p className="text-slate-400 mb-4">
        Scannez ce QR code pour rejoindre le tournament
      </p>
      
      <div className="bg-white p-4 rounded-lg inline-block">
        <QRCodeSVG 
          value={joinUrl} 
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <div className="mt-4 flex gap-2 justify-center">
        <button
          onClick={handleFullScreen}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
        >
          <Maximize2 size={20} />
          Afficher en plein écran
        </button>
      </div>
      
      <p className="text-sm text-slate-500 mt-4 break-all">
        {joinUrl}
      </p>
    </div>
  );
}
```

### Installation

```bash
npm install qrcode.react
npm install -D @types/qrcode.react
```

### Integration in TournamentDashboard

```typescript
import { QRCodeDisplay } from '@/components/QRCodeDisplay';

function TournamentDashboard() {
  const { tournamentId } = useParams();
  const tournament = useTournament(tournamentId);
  
  return (
    <div className="container mx-auto p-6">
      {/* Tournament header */}
      
      {/* QR Code Section */}
      <QRCodeDisplay 
        tournamentId={tournament.id}
        tournamentName={tournament.name}
      />
      
      {/* Participants, matches, etc. */}
    </div>
  );
}
```

### Testing Checklist

**Manual Testing:**
1. Create tournament → QR code appears
2. Scan QR code with mobile → Opens join page
3. Click "Full Screen" → Large QR code displayed
4. Print page → QR code is clear and scannable
5. Test on multiple mobile devices

**QR Code Quality:**
- Error correction level: H (high)
- Minimum size: 200x200px for mobile scanning
- Include margin for easier scanning
- High contrast (black on white)

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture - Component Categories]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#QRCodeDisplay Component]
- [Source: _bmad-output/planning-artifacts/prd.md#FR6.1: QR Code d'Invitation]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 3: Tournament Creation & Management]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Create:**
- src/components/QRCodeDisplay.tsx

**Files to Modify:**
- src/pages/TournamentDashboard.tsx (integrate QRCodeDisplay)
- package.json (add qrcode.react dependency)
