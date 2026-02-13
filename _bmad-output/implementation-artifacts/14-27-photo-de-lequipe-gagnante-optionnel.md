# Story 14.27: Winning team photo (optional)

Status: ready-for-dev

## Story

As a player,
I want to optionally add a photo of the winning team,
So that I have a souvenir of the match.

## Acceptance Criteria

1. **Given** I have selected the winner
   **When** the form displays the options
   **Then** optional "Photo" button (camera or gallery)

2. Photo uploaded to Supabase Storage

3. URL stored in `photo_url`

## Tasks / Subtasks

- [ ] Task 1: Photo capture (AC: 1)
  - [ ] input type="file" accept="image/\*" capture="environment"
  - [ ] Or navigator.mediaDevices.getUserMedia
  - [ ] Permission handling
- [ ] Task 2: Supabase Storage upload (AC: 2)
  - [ ] Bucket match-photos
  - [ ] Upload after match creation (matchId)
  - [ ] Optional mobile compression
- [ ] Task 3: Persistence (AC: 3)
  - [ ] Public URL in matches.photo_url

## Dev Notes

- **File:** `src/components/MatchRecordingForm.tsx`
- Depends: 14.24 (schema), 14.25 (winner selection)
- design-system-convergence sections 7.2, 7.3

### References

- [Source: _bmad-output/planning-artifacts/design-system-convergence.md#7]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
