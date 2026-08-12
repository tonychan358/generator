# Specification: English Vocabulary Flashcard Generator

This specification document outlines the requirements and system design for the "English Vocabulary Flashcard Generator". The generator is a tool for teachers to create interactive, standalone study web pages where students can revise English vocabulary and phrases using interactive 3D flip cards, audio pronunciation, and mastery tracking.

---

## 1. Core Requirements

### 1.1 Pure English Interface
* All user interface text, tooltips, placeholders, and labels on both the **Teacher-facing Generator** and the **Student-facing Flashcard Application** must be in **English only**.
* Supporting content (such as explanations, translations, or definitions in the user's list) can be bilingual or in any language, but all system controls, labels, and buttons must be pure English.

### 1.2 Standalone, Offline-Ready Architecture
* Must be zero-dependency: no external JavaScript frameworks (like React, Vue) or CSS frameworks (like Tailwind).
* All icons must use inline SVG.
* Browser Web Speech API (`speechSynthesis`) will handle audio pronunciation locally, requiring no internet connection or external API keys.
* Compilation will package all assets (CSS, JS, and data) into a single `.html` file that can be embedded into Google Sites or run locally.

### 1.3 TSV Parsing Schema
* Schema: `Word/Phrase <Tab> Meaning/Explanation/Hint` (tab-separated).
* The parser must handle carriage returns, empty lines, and trim whitespaces.
* Example load values must contain common English vocabulary and bilingual translations (e.g., `apple \t apple/蘋果`, `look after \t to take care of/照顧`).

---

## 2. Feature Specification

### 2.1 Teacher's Generator UI (`generator.html`)
The generator page will feature a dual-column layout:
* **Left Column (Settings & Inputs)**:
  * **Configuration Panel**:
    * **Subject**: e.g., "S1 English Vocab"
    * **Title**: e.g., "Unit 2 Flashcards"
    * **Export File Name**: e.g., `s1_vocab_unit2`
    * **Initial Card Face**: Dropdown (`English Word First` or `Meaning/Explanation First`) to determine which side faces the student initially.
    * **Voice Accent**: Dropdown (`American English (US)` or `British English (UK)`).
    * **Theme Color**: Dropdown with options for themes (e.g., Sky Blue, Classic Emerald, Vibrant Orange, Elegant Amethyst).
  * **Material Input Panel**:
    * Textarea with placeholder and dynamic line counter.
    * "Load Example" button to load pre-filled vocabulary and phrase list.
    * Excel Import Tips: A clear documentation box explaining how to format and paste rows from Excel.
* **Right Column (Export & Embedding Guide)**:
  * **Generate & Download Card**: Prominent button to compile and export the standalone study page.
  * **Google Sites Embed Guide**: Step-by-step instructions for copying code and inserting it into Google Sites.

### 2.2 Student's Revision UI (`dictation-template.html` / `flashcard.js`)
* **Lobby Page**:
  * Clean card interface showing the subject and title.
  * Student Name input box (validates name before letting the student start).
  * "Start Revision" button.
* **Flashcard Arena Page**:
  * **3D Flip Card**:
    * Uses CSS 3D transforms (`perspective`, `rotateY`, `backface-visibility`).
    * Click anywhere on the card (or the "Flip Card" button) to toggle between front and back.
    * **Front Side**: Shows the English Word/Phrase and a prominent "Speaker" button. Clicking the speaker triggers TTS pronunciation.
    * **Back Side**: Shows the Meaning, Explanation, or Hint.
  * **Controls & Mastery Panel**:
    * "Prev" and "Next" buttons to navigate the cards.
    * Mastery Buttons:
      * **"Mark as Mastered"** (Green tick): Marks the card as understood.
      * **"Need Review"** (Orange refresh/arrow): Marks the card as needing more practice.
    * **Progress Stats**: A progress bar showing:
      * Card index (e.g., `Card 3 / 12`).
      * Stats breakdown: `Mastered: X | Review: Y`.
    * Navigation Grid: Clickable number grid showing card states (unvisited, mastered, need review).
* **Summary Page**:
  * Shows student name, study time, and final stats.
  * A structured review list split into two columns or sections:
    * **Mastered Cards**: Listed with green highlights and speaker icon.
    * **Cards to Review**: Listed with orange/red highlights, meaning, and speaker icon.
  * "Restart Study" button.

---

## 3. Tech Stack & Styling Guidelines

### 3.1 Design Aesthetics
* A premium dark-mode or light-mode color scheme based on modern design systems (Slate/Sky colors).
* Font Family: `Outfit`, sans-serif (Google Fonts).
* Rounded corners (`border-radius: 1rem`) and subtle glassmorphism headers.
* Smooth flip transitions: `transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)`.

### 3.2 File Routing Table
* Source Scripts & Templates:
  * CSS stylesheet: `src/flashcard.css`
  * JS student application: `src/flashcard.js`
  * HTML student template: `src/flashcard-template.html`
  * Teacher generator interface: `src/generator.html`
* Packager:
  * `build.js` in root directory
* Standalone compiled output:
  * `index.html` in root directory
* Reports & Logs:
  * `README.md`
  * `report_record.md`

### 3.3 Audio Handling (Speech Synthesis)
* Browser Web Speech API matches the locked voice accent by scanning `speechSynthesis.getVoices()` for region language codes (`en-US` or `en-GB`/`en-GB`).
* Volume is default, and rate is set to `0.9` for clear, natural speech.
