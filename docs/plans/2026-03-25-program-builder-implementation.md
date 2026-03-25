# Implementation Plan: Program Builder Wizard

**Date:** 2026-03-25
**Topic:** Implementing a linear, 4-step wizard for program creation.

---

## Phase 1: API & Foundation
- [ ] **API Endpoint**: Create `app/api/programs/route.ts` for handling nested program creation.
  - Implement a Prisma transaction: `updateMany isActive: false` -> `create` new program.
- [ ] **Zod Schema**: Define the `ProgramCreateSchema` for validating the nested object.
- [ ] **Features Directory**: Scaffold `features/programs/` (components, hooks, types).

## Phase 2: Wizard Shell & Step 1
- [ ] **`use-program-builder` Hook**:
  - Manage `step`, `programData`.
  - Implement `localStorage` persistence.
- [ ] **`ProgramWizard` Component**:
  - Step indicator (progress bar).
  - "Next" and "Back" buttons.
- [ ] **`ProgramInfoStep` Component**:
  - Name and Description inputs.

## Phase 3: Structure & Selection
- [ ] **`StructureStep` Component**:
  - Manage phases (name, start/end weeks).
  - Training day selector (multiselect chips).
- [ ] **`ExerciseStep` Component**:
  - Tabbed interface for selected training days.
  - Integration with `ExercisePicker`.
  - Compact `RoutineExerciseItem` with inline inputs for sets/reps/rest.
  - "Copy Day" utility.

## Phase 4: Review & Persist
- [ ] **`SummaryStep` Component**:
  - Read-only tree view of the program.
  - "Save & Activate" button.
- [ ] **Navigation Entry**: Add a link to the wizard in the main Training Dashboard.

## Phase 5: UX & Validation
- [ ] **Step Validation**: Ensure the user can't advance if data is missing or invalid.
- [ ] **Mobile Optimization**: Verify that the tabbed exercise view and inputs are usable on small screens.
- [ ] **Persistence Recovery**: Test that data is restored if the tab is closed.
