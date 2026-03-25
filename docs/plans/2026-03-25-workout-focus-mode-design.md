# Design: Workout Focus Mode (Carousel Flow)

**Date:** 2026-03-25
**Status:** Approved
**Topic:** Improving workout session flow with a dynamic, single-exercise focus interface.

---

## 1. Overview
The current workout session uses a vertical list of exercises. To improve focus and reduce cognitive friction during training, we are implementing a **Focus Mode** based on a horizontal carousel. This mode shows one exercise at a time in a large, immersive view and transitions automatically to the next one upon completion.

## 2. User Experience (UX)

### Focus View (Carousel)
- **Immersive Slide:** Each exercise occupies the full width of the screen (or a large central block).
- **Large Controls:** Input fields for sets, reps, and RPE are oversized for easy interaction during training.
- **Progress Header:** A persistent header showing current progress (e.g., "Exercise 3 of 8") and a toggle to switch back to the "List View".
- **Visual Feedback:** Clear indicators for completed sets and exercises.

### Flow & Transitions
- **Automatic Progression:** Completing the last set of an exercise (and finishing the rest timer) automatically slides the carousel to the next exercise.
- **Rest Overlay:** The rest timer appears prominently after the last set, with an option to skip and proceed immediately.
- **Manual Navigation:** Users can swipe horizontally or use arrows to review previous exercises or preview upcoming ones.
- **Completion Screen:** Reaching the end of the carousel transitions the user to the "Post-session" summary.

## 3. Technical Architecture

### Components
- `SessionFocusView`: Main container managing the horizontal scroll and `scroll-snap`.
- `FocusExerciseCard`: Specialized version of the exercise card for the focus view.
- `FocusProgressBar`: Minimalist progress tracker for the top of the screen.
- `FocusRestOverlay`: Prominent rest timer integrated into the focus flow.

### State Management (`use-session-state.ts`)
- **`currentExerciseIndex`:** Track the active exercise in the carousel.
- **`goToNextExercise()` / `goToPrevExercise()`:** Programmatic navigation helpers.
- **Logic Integration:** Update `handleCompleteExercise` to trigger the automatic transition after the rest period.
- **Persistence:** Ensure the current index is preserved if the page reloads (sync with `DailyLog` status if possible).

### Styling & Animations
- **TailwindCSS 4:** Use utility classes for the layout and `snap-x mandatory`.
- **Framer Motion (Optional/TBD):** For smoother transitions if native CSS isn't enough for the desired "cinematic" feel.

## 4. Edge Cases
- **Skipping Exercises:** A "Skip" button in the focus card allows moving forward without completing all sets.
- **Editing Past Data:** Navigating back allows editing; updates are reflected in the global session state.
- **Session Interruption:** The state is saved in the database (`DailyLog`), so returning to the session restores the progress and position.

---

## 5. Success Criteria
- Users can complete a full workout without manual navigation between exercises.
- The interface feels responsive and "large" on mobile devices.
- Transitions feel fluid and predictable.
