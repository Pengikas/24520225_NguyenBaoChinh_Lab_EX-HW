# TASK DECOMPOSITION – PRODUCTION STUDIO DRUM KIT

**Student:** Nguyen Bao Chinh  
**Student ID:** 24520225  
**Assignment:** HW1

## Phase 0 – Project Initialization

Tasks:
1. Inspect the existing React + Vite project.
2. Verify Git status and branch.
3. Preserve existing dependencies.
4. Create components, hooks, audio, and data directories.

Acceptance Criteria:
- Project structure exists.
- Existing dependencies remain functional.
- Git working tree is understood.

## Phase 1 – Architecture and Documentation

Tasks:
1. Document project architecture.
2. Define component responsibilities.
3. Identify AI-generated code risks.
4. Define testing and verification procedures.

Acceptance Criteria:
- PROJECT_STRUCTURE.md completed.
- TASK_DECOMPOSITION.md completed.
- AI_FAILURE_AUDIT.md completed.

## Phase 2 – Drum Pad Data and UI

Tasks:
1. Define seven drum pad records.
2. Build reusable DrumPad component.
3. Implement seven accessible native buttons.
4. Create the studio interface.
5. Implement responsive pad layout.

Acceptance Criteria:
- Seven pads are displayed.
- Every pad has a unique ID.
- Buttons have accessible names.
- aria-pressed reflects active state.

## Phase 3 – Audio Engine

Tasks:
1. Implement Web Audio API.
2. Create different sound profiles.
3. Connect sound playback to mouse interaction.
4. Handle unsupported AudioContext.
5. Handle audio playback errors.

Acceptance Criteria:
- Seven pads produce distinguishable sounds.
- Audio starts after user interaction.
- Playback errors do not crash the application.

## Phase 4 – Physical Keyboard Hook

Tasks:
1. Implement useDrumKeyboard.
2. Map KeyW, KeyA, KeyS, KeyD, KeyJ, KeyK, KeyL.
3. Use e.code.
4. Ignore e.repeat.
5. Isolate INPUT, TEXTAREA, SELECT and contenteditable.
6. Prevent accidental browser shortcuts.
7. Implement event listener cleanup.

Acceptance Criteria:
- All seven physical keys work.
- Holding a key does not produce repeated hits.
- Typing inside input controls does not trigger drum pads.
- Event listeners are removed during cleanup.

## Phase 5 – Hit History and Visual Meter

Tasks:
1. Store recent hit events.
2. Display the latest eight events.
3. Announce the latest hit using aria-live.
4. Display estimated audio intensity.
5. Provide accessible progressbar semantics.

Acceptance Criteria:
- Hit history updates after every valid hit.
- Screen readers receive appropriate announcements.
- Visual intensity changes with the selected pad.
- Meter does not claim calibrated decibel accuracy.

## Phase 6 – WCAG and Responsive Styling

Tasks:
1. Define color tokens.
2. Verify text contrast.
3. Implement focus-visible indicators.
4. Provide sufficient button dimensions.
5. Implement mobile responsive layout.
6. Respect prefers-reduced-motion.

Acceptance Criteria:
- Keyboard focus is visible.
- Normal text contrast meets 4.5:1.
- UI boundaries meet applicable 3:1 contrast requirements.
- Layout works at 375px width.

## Phase 7 – Verification and Audit

Tasks:
1. Run npm run build.
2. Verify keyboard mappings.
3. Verify input isolation.
4. Verify repeat protection.
5. Verify event cleanup.
6. Verify screen reader announcements.
7. Inspect Chrome DevTools Accessibility Tree.
8. Run Lighthouse Accessibility and Best Practices.
9. Update AI_FAILURE_AUDIT.md with actual findings.

Acceptance Criteria:
- Production build passes.
- No runtime errors.
- Required interactions work.
- Lighthouse target is verified using actual results.

## Git Commit Strategy

1. chore(hw1): initialize drum kit project
2. docs(hw1): document drum kit architecture
3. feat(hw1): build accessible studio drum pads
4. feat(hw1): implement drum audio engine
5. feat(hw1): implement physical keyboard controls
6. feat(hw1): add accessible visual hit feedback
7. style(hw1): implement accessible studio design
8. test(hw1): verify accessibility and performance