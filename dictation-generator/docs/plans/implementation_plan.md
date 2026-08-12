# 📅 Dictation Generator 實作計畫書 (Implementation Plan)

## 📌 開發步驟規劃

### 1. 建立基礎模組 (Building Block Foundations)
- **學生端樣式 ([src/dictation.css](file:///D:/AI_AGENT/agycli/100_Todo/projects/dictation-generator/src/dictation.css))**：
  - 設計精緻的大廳歡迎卡片、聽寫卡片與結算卡片視覺。
  - 設計發音按鈕波紋微動畫 (`.play-btn` 與波紋效果)。
  - 設計響應式題號導覽網格、輸入框焦點樣式。
  - 套用 `@media (hover: hover)` 來防止行動觸控 Hover 粘滯。
- **學生端邏輯 ([src/dictation.js](file:///D:/AI_AGENT/agycli/100_Todo/projects/dictation-generator/src/dictation.js))**：
  - 大廳姓名登入防呆、洗牌打亂算法。
  - TTS 發音邏輯：使用 `speechSynthesis` 朗讀，句子模式 `rate=0.75`，單字模式 `rate=0.85`。
  - 綁定 Enter 鍵至下一題。
  - 進階校對算法（區分大小寫、過濾標點符號的字串比對）。
  - 題目跳轉與導覽網格高亮狀態管理。
  - 結算渲染與拼寫對比的 HTML 高亮渲染（紅綠對比）。
- **學生端外殼模板 ([src/dictation-template.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/dictation-generator/src/dictation-template.html))**：
  - 定義網頁基礎骨架。
  - 預留動態 `:root` 顏色覆寫的 `<style>` 區塊。
  - 預留 placeholders (如 `/* {{DICT_TITLE}} */`, `/* {{QUESTIONS_DATA}} */`)。

### 2. 建立產生器 UI ([src/generator.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/dictation-generator/src/generator.html))
- 設計參數輸入區：科目、標題、自訂檔名、主題色 (四色)、語系 (三種)、模式 (Vocab/Sentence)、進階校對選單。
- 題庫輸入與範例載入（單字範本、句子範本）。
- 解析 TSV 函數，進行格式檢查與空行防呆。
- 下載邏輯與 `buildDictHTML` 模板外殼。

### 3. 編譯與構建 ([build.js](file:///D:/AI_AGENT/agycli/100_Todo/projects/dictation-generator/build.js))
- 撰寫打包腳本，將 `dictation.css` 與 `dictation.js` 注入 `dictation-template.html`。
- 嚴格執行 `export_html_generator_sop.md` 中規定的轉義與變數替換順序。
- 生成最終的 `index.html`。

### 4. 語法檢驗與測試 ([check.js](file:///D:/AI_AGENT/agycli/100_Todo/projects/dictation-generator/check.js))
- 複製上一專案的 `check.js` 以驗收產出有無隱藏的 SyntaxError。
- 實際在瀏覽器中開啟 `index.html`，貼上範例資料並測試下載網頁。
- 在斷網環境下測試產出的網頁（語音合成發音是否正常、校對是否準確）。

---

## 🗓️ 進度排程
1. **Day 1 (今日)**：完成所有 `src/` 核心代碼撰寫 (`dictation.css`, `dictation.js`, `dictation-template.html`, `generator.html`)。
2. **Day 1 (今日)**：完成 `build.js`、執行編譯並使用 `check.js` 進行語法校驗。
3. **Day 1 (今日)**：自檢測試並同步 Obsidian 與儀表板。
