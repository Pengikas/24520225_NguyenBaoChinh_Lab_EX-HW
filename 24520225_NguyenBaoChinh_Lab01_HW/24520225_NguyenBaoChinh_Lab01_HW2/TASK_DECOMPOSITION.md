# Homework 2 Task Decomposition - Drum Kit Engine

## Step 1 - HTML Sound Contract
- Define pads in HTML
- Add data-key attributes
- Add data-sound attributes
- Keep audio contract decoupled from implementation

Expected commit:
`feat(drum): define HTML sound contract`

## Step 2 - Audio Engine
- Implement reusable AudioEngine class
- Load audio samples (.wav files)
- Support polyphonic playback
- Keep audio logic independent from UI
- Provide synthesized Web Audio fallback

Expected commit:
`feat(audio): implement polyphonic playback engine`

## Step 3 - Keyboard Input
- Add centralized keydown listener
- Ignore event.repeat
- Read keyboard mappings from HTML contract

Expected commit:
`feat(input): add keyboard trigger throttling`

## Step 4 - Beat Recorder
- Create FIFO event queue
- Store key and timestamp
- Allow recording, playback and clearing

Expected commit:
`feat(recorder): implement FIFO beat recorder`
