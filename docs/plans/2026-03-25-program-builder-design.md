# Design: Program Builder Wizard

**Date:** 2026-03-25
**Status:** Approved
**Topic:** Implementing a linear, 4-step wizard to create and manage training programs.

---

## 1. Overview
Currently, programs and routines are seeded via database scripts. This feature introduces a user-facing **Program Builder** that guides the user through creating a full program (Program -> Phases -> Routines -> Exercises) in a structured, mobile-friendly interface.

## 2. User Experience (UX) - The 4-Step Flow

### Step 1: Program Information
- **Fields:** Program Name (e.g., "Powerbuilding 2026") and optional Description.
- **Goal:** Set the high-level identity of the training block.

### Step 2: Structure & Phases
- **Phases:** Define one or more phases (e.g., "Hypertrophy", "Strength").
- **Weeks:** Assign week ranges per phase (e.g., Weeks 1-4, 5-8).
- **Days:** Select training days per routine using a "chip" selector (Mon, Tue, Wed, etc.).
- **Validation:** Ensure phases do not overlap and at least one day is selected.

### Step 3: Exercise Programming (The Heart)
- **Navigation:** Use **Tabs** to switch between the selected training days.
- **Selection:** Integrate the existing `ExercisePicker` to add exercises to each day.
- **Parameters:** Inline editing for sets, reps, rest seconds, and RPE targets for each exercise.
- **Shortcuts:** A "Copy Day" feature to duplicate exercises from one day to another (e.g., Copy Mon to Thu).

### Step 4: Summary & Activation
- **Review:** A compact view of the entire program hierarchy.
- **Action:** A "Save & Activate" button that persists the program and sets it as the active one.

---

## 3. Technical Architecture

### Frontend (`features/programs/`)
- **`ProgramWizard`:** Main orchestrator component managing the current step and the global temporary state.
- **`useProgramBuilder`:** Custom hook for state management, including `localStorage` persistence to prevent data loss.
- **Steps Components:** Decoupled components for each step of the wizard.
- **Validation:** Use **Zod** for real-time validation at each step transition.

### API (`POST /api/programs`)
- **Atomic Transaction:** The entire program hierarchy is sent as a nested JSON object.
- **Deactivation:** Before creating the new program, the API will mark any current active program as `isActive: false`.
- **Nested Create:** Use Prisma's `create` with nested `include` to ensure all relationships (Phases, Routines, Exercises) are created correctly or not at all (Rollback on failure).

---

## 4. Edge Cases & Safety
- **Empty Routines:** Warn the user if a training day has no exercises assigned.
- **Accidental Exit:** Prompt the user before leaving the wizard if there are unsaved changes.
- **Exercise Deletion:** Handle cases where a selected exercise might have been deleted from the catalog during the wizard session.

---

## 5. Success Criteria
- Users can build a multi-phase program from scratch in under 5 minutes.
- The interface is fully accessible and intuitive on mobile devices.
- No "partial" or "broken" programs are left in the database due to failed submissions.
