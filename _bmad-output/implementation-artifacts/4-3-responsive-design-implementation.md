# Story 4.3: Responsive Design Implementation

Status: ready-for-dev

## Story

As a user,
I want the app to work on any device,
So that I can use it on my phone, tablet, or computer.

## Acceptance Criteria

**Given** the application
**When** accessed on mobile (320px-767px)
**Then** layout is optimized for mobile (single column, large touch targets)
**And** navigation uses drawer/menu pattern
**And** forms are mobile-friendly
**When** accessed on tablet (768px-1023px)
**Then** layout adapts to tablet size (2-column where appropriate)
**When** accessed on desktop (1024px+)
**Then** layout uses available space efficiently
**And** all features work across all breakpoints
**And** offline functionality works on all devices

## Tasks / Subtasks

- [ ] Define responsive breakpoints (AC: Breakpoints defined)
  - [ ] Verify Tailwind breakpoints match spec
  - [ ] Mobile: 320px-767px (sm and below)
  - [ ] Tablet: 768px-1023px (md)
  - [ ] Desktop: 1024px+ (lg, xl, 2xl)
  - [ ] Document breakpoint usage

- [ ] Optimize mobile layout (AC: Mobile optimized)
  - [ ] Single column layout on mobile
  - [ ] Stack elements vertically
  - [ ] Full-width buttons and forms
  - [ ] Large touch targets (44x44px+)
  - [ ] Test on 320px width (iPhone SE)

- [ ] Implement mobile navigation (AC: Drawer pattern)
  - [ ] Review MenuDrawer component
  - [ ] Hamburger menu on mobile
  - [ ] Slide-in drawer navigation
  - [ ] Close on selection or overlay click
  - [ ] Test drawer accessibility

- [ ] Make forms mobile-friendly (AC: Mobile-friendly forms)
  - [ ] Full-width inputs on mobile
  - [ ] Large input fields (min height 44px)
  - [ ] Appropriate input types (email, tel, etc.)
  - [ ] Virtual keyboard optimization
  - [ ] Test form usability on mobile

- [ ] Adapt tablet layout (AC: Tablet layout)
  - [ ] 2-column layout where appropriate
  - [ ] Use available screen space
  - [ ] Maintain readability
  - [ ] Test on iPad (768px, 1024px)
  - [ ] Verify portrait and landscape modes

- [ ] Optimize desktop layout (AC: Desktop layout)
  - [ ] Multi-column layouts
  - [ ] Max-width containers for readability
  - [ ] Efficient use of space
  - [ ] Desktop navigation (no drawer)
  - [ ] Test on 1920px+ screens

- [ ] Test cross-device compatibility (AC: All features work)
  - [ ] Test all pages on mobile
  - [ ] Test all pages on tablet
  - [ ] Test all pages on desktop
  - [ ] Verify PWA works on all devices
  - [ ] Test offline mode on all devices

## Dev Notes

### Tailwind Breakpoints

**Configuration (tailwind.config.js):**
```javascript
module.exports = {
  theme: {
    screens: {
      'sm': '640px',   // Small devices (landscape phones)
      'md': '768px',   // Tablets
      'lg': '1024px',  // Desktops
      'xl': '1280px',  // Large desktops
      '2xl': '1536px', // Extra large desktops
    },
  },
};
```

**Usage:**
```typescript
// Mobile-first approach (default styles for mobile)
<div className="
  w-full           // Mobile: full width
  md:w-1/2         // Tablet: half width
  lg:w-1/3         // Desktop: third width
  px-4             // Mobile: 16px padding
  md:px-6          // Tablet: 24px padding
  lg:px-8          // Desktop: 32px padding
">
  Content
</div>
```

### Mobile Navigation Pattern

**MenuDrawer Component:**
```typescript
// src/components/layout/MenuDrawer.tsx already exists
// Review and ensure it follows these patterns:

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDrawer({ isOpen, onClose }: MenuDrawerProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-slate-800 z-50
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:hidden
      `}>
        {/* Navigation items */}
      </div>
    </>
  );
}
```

### Responsive Layout Patterns

**1. Single Column → Multi-Column:**
```typescript
// Mobile: stack vertically
// Desktop: side-by-side
<div className="flex flex-col lg:flex-row gap-4">
  <div className="w-full lg:w-2/3">Main content</div>
  <div className="w-full lg:w-1/3">Sidebar</div>
</div>
```

**2. Grid Layout:**
```typescript
// Mobile: 1 column
// Tablet: 2 columns
// Desktop: 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

**3. Hidden/Visible by Breakpoint:**
```typescript
// Show only on mobile
<div className="block lg:hidden">Mobile menu</div>

// Show only on desktop
<div className="hidden lg:block">Desktop nav</div>
```

**4. Font Sizes:**
```typescript
// Scale text size with breakpoints
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

### Form Optimization

**Mobile-Friendly Input:**
```typescript
<input
  type="email"
  className="
    w-full           // Full width on all devices
    px-4 py-3        // Large padding for touch
    text-base        // 16px to prevent iOS zoom
    rounded-lg
    bg-slate-700
    text-white
  "
  placeholder="email@example.com"
/>
```

**Button Size:**
```typescript
<button className="
  w-full md:w-auto  // Full width mobile, auto desktop
  px-8 py-4         // Large touch target
  text-lg           // Large text
  rounded-lg
  bg-amber-500
">
  Submit
</button>
```

### Testing Matrix

**Devices to Test:**

| Device | Width | Breakpoint | Priority |
|--------|-------|------------|----------|
| iPhone SE | 320px | < sm | High |
| iPhone 12/13 | 390px | < sm | High |
| iPad Mini | 768px | md | Medium |
| iPad Pro | 1024px | lg | Medium |
| Desktop | 1920px | xl | High |

**Test Scenarios:**
- [ ] Home page loads correctly
- [ ] Create tournament form works
- [ ] Join tournament works
- [ ] Record match works
- [ ] Leaderboard displays correctly
- [ ] Navigation works
- [ ] PWA installs and works offline

### References

**Architecture Requirements:**
- [Source: _bmad-output/planning-artifacts/architecture.md#Design Patterns - Responsive Design]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design System]
- [Source: _bmad-output/planning-artifacts/prd.md#FR5.2: Responsive Web]

**Epic Context:**
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 4: Tournament Participation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]

## Dev Agent Record

### Agent Model Used

(To be filled by implementing agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**Files to Review/Update:**
- All pages in src/pages/
- All components in src/components/
- src/components/layout/MenuDrawer.tsx
- tailwind.config.js (verify breakpoints)
- src/App.tsx (responsive layout wrapper)
