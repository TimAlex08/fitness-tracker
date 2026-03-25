# Implementation Plan: Workout Focus Mode

**Date:** 2026-03-25
**Topic:** Implementing the Focus Mode (Carousel Flow) for workout sessions.

---

## Phase 1: Core UI Components
- [ ] **`FocusProgressBar.tsx`**: Create a minimalist progress indicator.
  - Show `[Current] / [Total]` exercises.
  - Progress bar filling as exercises are completed.
- [ ] **`FocusExerciseCard.tsx`**: Specialized exercise card for the focus view.
  - Centered layout, large typography for exercise name.
  - Oversized buttons and inputs for sets/reps.
  - Integrated image/video placeholder.
- [ ] **`SessionFocusView.tsx`**: The carousel container.
  - Use `flex overflow-x-auto snap-x snap-mandatory`.
  - Handle scroll events to sync `currentExerciseIndex`.
  - Responsive padding for centered slides on all devices.

## Phase 2: State Management & Navigation
- [ ] **Update `use-session-state.ts`**:
  - Add `currentExerciseIndex` (default: 0).
  - Add `setExerciseIndex(index: number)` with bounds checking.
  - Add `nextExercise()` and `prevExercise()` helpers.
- [ ] **Automatic Progression Logic**:
  - Modify `handleCompleteExercise` to wait for the rest timer (or a short delay) and then call `nextExercise()`.
  - Handle the "Finalize Session" case at the end of the carousel.
- [ ] **State Synchronization**:
  - Save `currentExerciseIndex` to local storage or sync with `DailyLog` metadata to persist across reloads.

## Phase 3: Layout Integration
- [ ] **Update `TodaySession.tsx`**:
  - Add a toggle (button or switch) to change between `listView` and `focusView`.
  - Conditional rendering of `SessionExerciseList` vs `SessionFocusView`.
- [ ] **Integrate Rest Overlay**:
  - Ensure the `RestTimer` component fits naturally into the focus flow (perhaps as a full-screen overlay during Focus Mode).

## Phase 4: Styling & Polishing
- [ ] **Animations**:
  - Smooth scroll behavior for the carousel.
  - Fade-in/out transitions for exercise details when they enter/exit focus.
- [ ] **Responsive Refinement**:
  - Test and adjust "Focus Mode" for various mobile aspect ratios.

## Phase 5: Verification
- [ ] Verify automatic slide transition after completing an exercise.
- [ ] Test manual swipe navigation.
- [ ] Confirm "List View" stays in sync with changes made in "Focus Mode".
- [ ] Ensure the "Finish Session" button appears correctly at the end of the focus flow.
