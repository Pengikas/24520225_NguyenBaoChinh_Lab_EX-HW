# PROJECT STRUCTURE – PRODUCTION STUDIO DRUM KIT

**Student:** Nguyen Bao Chinh  
**Student ID:** 24520225  
**Assignment:** HW1 – Production Studio Drum Kit  
**Reference:** Lab 2 – Accessibility and Event Engineering  
**Technology:** React 18, TypeScript 5.6, Vite 5  
**Standard:** WCAG 2.2 Level AA

## 1. Project Overview

Modernize the legacy Slide 26 Drum Kit into an accessible production-oriented React application.

The application supports seven physical keyboard keys and mouse-operated drum pads.

## 2. Architecture

```text
src/
├── components/
│   ├── DrumPad.tsx
│   ├── DrumPad.css
│   ├── HitHistory.tsx
│   └── VolumeMeter.tsx
├── hooks/
│   └── useDrumKeyboard.ts
├── audio/
│   └── drumAudio.ts
├── data/
│   └── drumPads.ts
├── App.tsx
├── App.css
├── index.css
└── main.tsx
```

## 3. Module Responsibilities

### App.tsx
- Main application component.
- Manages active pad and hit history.
- Connects keyboard and mouse interactions.
- Coordinates audio playback and visual feedback.

### DrumPad.tsx
- Reusable drum pad component.
- Uses native HTML button.
- Supports accessible names and aria-pressed.
- Provides active visual state.

### HitHistory.tsx
- Displays the latest drum activation events.
- Provides screen-reader announcements using aria-live.

### VolumeMeter.tsx
- Displays estimated audio intensity.
- Exposes its value using progressbar semantics.
- Does not claim calibrated decibel measurements.

### useDrumKeyboard.ts
- Registers physical keyboard events.
- Uses KeyboardEvent.code.
- Blocks repeated keydown events.
- Ignores form controls and editable content.
- Cleans up event listeners.

### drumAudio.ts
- Provides Web Audio API playback.
- Maps individual drum pads to sound profiles.
- Handles browser audio initialization and playback failures.

### drumPads.ts
- Stores the seven drum pad definitions.
- Provides stable identifiers and physical keyboard mappings.

## 4. Data Flow

```text
Keyboard / Mouse
       |
       v
Drum Activation Handler
       |
       +------> Audio Engine
       |
       +------> Active Pad State
       |
       +------> Hit History
       |
       +------> Visual Intensity Meter
       |
       +------> Screen Reader Announcement
```

## 5. Accessibility Contract

- WCAG 2.2 Level AA target.
- Native semantic HTML.
- Native buttons for interactive pads.
- aria-pressed for toggle-like active state.
- aria-live="polite" for hit announcements.
- Visible focus indicators.
- Keyboard-only operation.
- Minimum 4.5:1 normal text contrast.
- Appropriate touch target dimensions.
- Reduced-motion support.
- No deprecated keyboard APIs.

## 6. Engineering Constraints

- React functional components.
- Strict TypeScript.
- No unnecessary dependencies.
- No clickable div or span.
- No deprecated keyCode.
- Proper useEffect cleanup.
- Stable component keys.
- No fake accessibility or Lighthouse claims.

## 7. Testing Strategy

- Test all seven keyboard mappings.
- Test mouse activation.
- Test e.repeat protection.
- Test input focus isolation.
- Test event listener cleanup.
- Test audio playback.
- Test live announcements.
- Test keyboard focus.
- Test mobile responsiveness.
- Run TypeScript build and Lighthouse audit.