import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// --- Pure M1 Logic Import / Replication Verification ---
import {
    allowedTransitions,
    canTransition,
    relationshipReducer,
} from '../src/utils/relationshipReducer.ts';

import {
    initialRelationshipState,
} from '../src/types/relationship.ts';

import {
    effortReducer,
    initialEffortState,
    deriveEffortState,
} from '../src/utils/effortReducer.ts';

test('M1: Relationship State Machine - Initial state is FRIENDS', () => {
    assert.deepEqual(initialRelationshipState, { phase: 'FRIENDS' });
});

test('M1: Relationship State Machine - Allowed transitions lookup contract', () => {
    assert.deepEqual(allowedTransitions.FRIENDS, ['DATING_NO_LOVE']);
    assert.deepEqual(allowedTransitions.DATING_NO_LOVE, [
        'FRIENDS',
        'OFFICIAL_LOVE',
        'GHOSTED_EXIT',
    ]);
    assert.deepEqual(allowedTransitions.OFFICIAL_LOVE, ['GHOSTED_EXIT']);
    assert.deepEqual(allowedTransitions.GHOSTED_EXIT, ['FRIENDS']);
});

test('M1: canTransition guard - strictly permits valid transitions', () => {
    assert.equal(canTransition('FRIENDS', 'DATING_NO_LOVE'), true);
    assert.equal(canTransition('DATING_NO_LOVE', 'OFFICIAL_LOVE'), true);
    assert.equal(canTransition('DATING_NO_LOVE', 'GHOSTED_EXIT'), true);
    assert.equal(canTransition('DATING_NO_LOVE', 'FRIENDS'), true);
    assert.equal(canTransition('OFFICIAL_LOVE', 'GHOSTED_EXIT'), true);
    assert.equal(canTransition('GHOSTED_EXIT', 'FRIENDS'), true);
});

test('M1: canTransition guard - strictly rejects forbidden transitions', () => {
    assert.equal(canTransition('FRIENDS', 'OFFICIAL_LOVE'), false);
    assert.equal(canTransition('FRIENDS', 'GHOSTED_EXIT'), false);
    assert.equal(canTransition('OFFICIAL_LOVE', 'FRIENDS'), false);
    assert.equal(canTransition('OFFICIAL_LOVE', 'DATING_NO_LOVE'), false);
    assert.equal(canTransition('GHOSTED_EXIT', 'DATING_NO_LOVE'), false);
    assert.equal(canTransition('GHOSTED_EXIT', 'OFFICIAL_LOVE'), false);
});

test('M1: relationshipReducer - executes valid transitions and rejects invalid immutably', () => {
    const s0 = initialRelationshipState;

    // Valid: FRIENDS -> DATING_NO_LOVE
    const s1 = relationshipReducer(s0, {
        type: 'SET_PHASE',
        phase: 'DATING_NO_LOVE',
    });
    assert.equal(s1.phase, 'DATING_NO_LOVE');
    assert.notEqual(s1, s0);

    // Invalid: DATING_NO_LOVE -> DATING_NO_LOVE (self transition not allowed)
    const s1Invalid = relationshipReducer(s1, {
        type: 'SET_PHASE',
        phase: 'DATING_NO_LOVE',
    });
    assert.equal(s1Invalid, s1, 'Invalid transition must return exact previous state reference');

    // Valid: DATING_NO_LOVE -> OFFICIAL_LOVE
    const s2 = relationshipReducer(s1, {
        type: 'SET_PHASE',
        phase: 'OFFICIAL_LOVE',
    });
    assert.equal(s2.phase, 'OFFICIAL_LOVE');

    // Invalid: OFFICIAL_LOVE -> FRIENDS
    const s2Invalid = relationshipReducer(s2, {
        type: 'SET_PHASE',
        phase: 'FRIENDS',
    });
    assert.equal(s2Invalid, s2);

    // Valid: OFFICIAL_LOVE -> GHOSTED_EXIT
    const s3 = relationshipReducer(s2, {
        type: 'SET_PHASE',
        phase: 'GHOSTED_EXIT',
    });
    assert.equal(s3.phase, 'GHOSTED_EXIT');

    // Reset: returns initialRelationshipState
    const sReset = relationshipReducer(s3, { type: 'RESET' });
    assert.equal(sReset.phase, 'FRIENDS');
});

test('M2: effortReducer - handles ADD, REMOVE, RESET immutably', () => {
    const s0 = initialEffortState;
    assert.deepEqual(s0.signals, []);

    const sig1 = { id: 'sig-1', actor: 'EM', steps: 100, multiplier: 0.1 };
    const sig2 = { id: 'sig-2', actor: 'AI_DO', steps: 1, multiplier: 50 };

    const s1 = effortReducer(s0, { type: 'ADD_SIGNAL', signal: sig1 });
    assert.equal(s1.signals.length, 1);
    assert.notEqual(s1.signals, s0.signals);

    const s2 = effortReducer(s1, { type: 'ADD_SIGNAL', signal: sig2 });
    assert.equal(s2.signals.length, 2);

    // Remove sig1
    const s3 = effortReducer(s2, { type: 'REMOVE_SIGNAL', id: 'sig-1' });
    assert.equal(s3.signals.length, 1);
    assert.equal(s3.signals[0].id, 'sig-2');

    // Reset log
    const s4 = effortReducer(s3, { type: 'RESET_LOG' });
    assert.deepEqual(s4.signals, []);
});

test('M2: deriveEffortState - calculates asymmetric effort and Red Flag correctly', () => {
    const exampleSignals = [
        { id: '1', actor: 'EM', steps: 100, multiplier: 0.1 },
        { id: '2', actor: 'AI_DO', steps: 1, multiplier: 50 },
    ];

    const result = deriveEffortState(exampleSignals);

    assert.equal(result.emSteps, 100);
    assert.equal(result.emWeightedEffort, 10);
    assert.equal(result.aiDoSteps, 1);
    assert.equal(result.aiDoWeightedEffort, 50);
    assert.equal(result.totalWeightedEffort, 60);
    assert.equal(result.imbalanceRatio, 5.0);
    assert.equal(result.isRedFlag, true, 'AI_DO weighted effort (50) > EM weighted effort (10) must trigger Red Flag');
    assert.match(result.redFlagMessage, /Red Flag/);
});

test('M2: deriveEffortState - balanced state returns isRedFlag false', () => {
    const balancedSignals = [
        { id: '1', actor: 'EM', steps: 100, multiplier: 1.0 },
        { id: '2', actor: 'AI_DO', steps: 1, multiplier: 50 },
    ];

    const result = deriveEffortState(balancedSignals);
    assert.equal(result.emWeightedEffort, 100);
    assert.equal(result.aiDoWeightedEffort, 50);
    assert.equal(result.isRedFlag, false);
});

test('M3: Ghosting Timer contracts exist and use 5000ms', () => {
    const hookFile = fs.readFileSync(path.resolve('src/hooks/useGhostingTimer.ts'), 'utf8');
    assert.match(hookFile, /GHOSTING_TIMEOUT_MS\s*=\s*5000/);
    assert.match(hookFile, /new AbortController\(\)/);
    assert.match(hookFile, /controller\.signal/);
    assert.match(hookFile, /AbortError/);
});

test('M4: Accessibility attributes present in source', () => {
    const effortFile = fs.readFileSync(path.resolve('src/components/EffortAnalyzer.tsx'), 'utf8');
    const ghostFile = fs.readFileSync(path.resolve('src/components/GhostingTimer.tsx'), 'utf8');
    const cssFile = fs.readFileSync(path.resolve('src/App.css'), 'utf8');

    assert.match(effortFile, /useId\(\)/);
    assert.match(effortFile, /role="status"/);
    assert.match(effortFile, /aria-live="polite"/);

    assert.match(ghostFile, /useId\(\)/);
    assert.match(ghostFile, /role="status"/);
    assert.match(ghostFile, /aria-live="polite"/);

    assert.match(cssFile, /:focus-visible/);
    assert.match(cssFile, /prefers-reduced-motion/);
});

test('M5: Responsive CSS breakpoints are fully declared', () => {
    const cssFile = fs.readFileSync(path.resolve('src/App.css'), 'utf8');
    assert.match(cssFile, /@media\s*\(max-width:\s*1024px\)/);
    assert.match(cssFile, /@media\s*\(max-width:\s*768px\)/);
    assert.match(cssFile, /@media\s*\(max-width:\s*600px\)/);
    assert.match(cssFile, /@media\s*\(max-width:\s*375px\)/);
});

test('M5: App.css is properly imported in App.tsx and main.tsx', () => {
    const appTsx = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
    const mainTsx = fs.readFileSync(path.resolve('src/main.tsx'), 'utf8');
    assert.match(appTsx, /import\s+['"]\.\/App\.css['"]/);
    assert.match(mainTsx, /import\s+['"]\.\/App\.css['"]/);
});

test('M6: Bug Fix Verification - Zombie Timer Prevention & Reset Contract', () => {
    const ghostFile = fs.readFileSync(path.resolve('src/components/GhostingTimer.tsx'), 'utf8');
    // Verifies that switching recipient while waiting halts active message dispatch
    assert.match(ghostFile, /if\s*\(status\s*===\s*'WAITING'\)\s*\{\s*setIsMessageSent\(false\);\s*\}/);
    // Verifies that reset resets messageId to 0
    assert.match(ghostFile, /setMessageId\(0\)/);
});

