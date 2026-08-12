# 📝 Flashcard Generator (英文翻卡溫習產生器)

This is an interactive flashcard revision web page generator designed for English teachers. Teachers can input vocabulary/phrases along with definitions, select voice accent settings, choose visual themes, and generate a **100% offline-ready, RWD, and interactive 3D flip card study page** that can be easily embedded in Google Sites.

## ✨ Features
1. **Teacher-Facing Generator**:
   - Custom Subject and Practice Title settings.
   - Excel Import via copy-paste (TSV schema: `English word/phrase <Tab> Meaning/Hint`).
   - Customizable **Voice Accent** (US English / British English UK)事前鎖定 (pre-locked for students).
   - **Initial Card Face** toggle: Choose whether students see the English word first or the definition/meaning first.
   - Modern, pre-defined theme colors (Sky Blue, Emerald Green, Vibrant Orange, Amethyst Purple).
   - Instant HTML generation and download.
   
2. **Student-Facing Flashcard Revision**:
   - Welcome/Lobby screen to capture student name.
   - Full randomized **Card Shuffling** to ensure randomized revision order.
   - **3D Flip Interaction**: Interactive card flipping with beautiful 3D animations when clicked.
   - **Text-to-Speech (TTS)**: Built-in local voice synthesis with a standard speaker button on the English word side.
   - **Mastery Tracker**: Toggles to mark cards as "Mastered" or "Need Review", updating stats dynamically.
   - **Summary Screen**: Provides learning duration, percentage of mastery, and list of items classified into "Mastered" and "Needs Review".

## 🛠️ Project Structure
- `src/flashcard.css`: CSS styling for student-facing flashcard deck (handles responsive styling and 3D card flips).
- `src/flashcard.js`: Javascript revision application flow and TTS configuration.
- `src/flashcard-template.html`: Revision page HTML layout shell.
- `src/generator.html`: Teacher generator setup panel and TSV builder.
- `build.js`: Packages and inlines assets into a single standalone `index.html`.
- `check.js`: Automated syntax testing.

## 🚀 How to Run
Compile the code to the root `index.html` file using:
```bash
node build.js
```
Then, double-click and open the generated `index.html` in your browser.
