# Homework 1 & 2 Task Decomposition

## HW1 - Production Portfolio

### M1 - WCAG 2.2 AA Accessibility Audit
- Add semantic landmarks
- Verify heading hierarchy
- Improve foreground/background contrast
- Add accessible labels
- Add alt text for meaningful images
- Verify WCAG AA compliance

Expected commit:

fix(a11y): contrast & landmarks

### M2 - Keyboard Navigation and Focus Audit
- Verify all interactive elements are keyboard accessible
- Provide visible focus states
- Prevent keyboard traps
- Add skip navigation
- Test Tab and Shift+Tab navigation

Expected commit:

fix(nav): keyboard trap prevention

### M3 - Content Security Policy
- Remove inline scripts
- Remove inline styles
- Remove onclick/onkeydown/onkeyup attributes
- Add strict Content Security Policy
- Move JavaScript behavior into external files

Expected commit:

fix(security): enforce strict CSP

### M4 - Performance and Lighthouse
- Convert images to WebP
- Resize large images
- Lazy-load non-critical images
- Minimize unnecessary JavaScript
- Run Lighthouse audit
- Target scores of 100

Expected commit:

perf: optimize assets

---

## HW2 - Drum Kit Engine

### Step 1 - HTML Sound Contract
- Define pads in HTML
- Add data-key attributes
- Add data-sound attributes
- Do not implement JavaScript yet

Expected commit:

feat(drum): define HTML sound contract

### Step 2 - Audio Engine
- Implement reusable AudioEngine class
- Load audio samples
- Support polyphonic playback
- Keep audio logic independent from UI

Expected commit:

feat(audio): implement polyphonic playback engine

### Step 3 - Keyboard Input
- Add centralized keydown listener
- Ignore event.repeat
- Read keyboard mappings from HTML contract

Expected commit:

feat(input): add keyboard trigger throttling

### Step 4 - Beat Recorder
- Create FIFO event queue
- Store key and timestamp
- Allow recording, playback and clearing

Expected commit:

feat(recorder): implement FIFO beat recorder