# Implementation Plan: English Vocabulary Flashcard Generator

This plan outlines the steps required to build, compile, and verify the English Vocabulary Flashcard Generator.

---

## Phase 1: Setup & Documentation (Day 1)
* [x] Create project directories.
* [x] Write `docs/specs/flashcard_generator_spec.md`.
* [ ] Create `README.md` and `report_record.md` in the project root.

## Phase 2: Create Core Source Files (Day 1)
* [ ] Create `src/flashcard.css`:
  * Focus on premium UI with fluid 3D flipping card transitions, hover highlights, glassmorphic lobby card, and mobile response layouts.
* [ ] Create `src/flashcard.js`:
  * State management: current card index, mastery list (Mastered vs Need Review), start/end times.
  * Browser Speech Synthesis: speak words/phrases using natural English voices matching the teacher-locked locale.
  * Nav grid behavior and statistics calculator.
* [ ] Create `src/flashcard-template.html`:
  * Skeleton interface for the student side.
  * Dynamic theme color support (`:root` injection).
* [ ] Create `src/generator.html`:
  * Teacher-facing setup form with accent toggles, color dropdowns, card-face initialization settings.
  * TSV parser logic with validation errors.
  * Google Sites setup tutorial content.

## Phase 3: Packaging & Automation (Day 1)
* [ ] Create `build.js` compiler:
  * Inlines CSS & JS into the template.
  * Performs proper escaping of backticks and nested script tags inside template strings.
  * Generates output `index.html`.
* [ ] Create `check.js` syntax verifier:
  * Runs static check over generated HTML files via the Node VM compiler.

## Phase 4: Verification & Integration (Day 1)
* [ ] Verify visual and functional correctness of the generator and output files.
* [ ] Update logs and dashboards:
  * Synchronize docs via `obsidian_sync.py`.
  * Update dev dashboard via `update_dashboard.py`.
