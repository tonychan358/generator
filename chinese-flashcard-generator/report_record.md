# 📝 Chinese Flashcard Generator 專案開發記錄

## 📌 當前狀態
- **狀態**: 已完成 (Completed)
- **進度**: 100%
- **健康度**: 🟢 健康

## 🗓️ 任務執行日誌

### 2026-06-04
- **初始化專案**: 建立專案目錄 `100_Todo/projects/chinese-flashcard-generator/`
- **撰寫文檔與規劃**:
  - 建立 [README.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/README.md)、[report_record.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/report_record.md)。
  - 撰寫設計規劃與規格書 [docs/specs/chinese_flashcard_spec.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/docs/specs/chinese_flashcard_spec.md) 及 [docs/plans/implementation_plan.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/docs/plans/implementation_plan.md)。
- **核心開發 (100% 離線 RWD & 中文國粵語 TTS & 漢字筆劃動畫)**：
  - 撰寫 [src/flashcard.css](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/src/flashcard.css)：實現了 RWD 3D 翻轉卡片、發音按鈕波紋脈衝呼吸動畫、觸控防護，以及田字格（米字格）輔助線背景樣式。
  - 撰寫 [src/flashcard.js](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/src/flashcard.js)：實現了學生自習流程（洗牌、掌握狀態標記與導航格）、Web Speech API 粵語/普通話智能發音尋找與播放、以及整合 `Hanzi Writer` 動態 SVG 漢字書寫軌跡。針對多字漢字詞（例如「學習」），動態渲染字元標籤切換按鈕，方便學生點選特定字元播放筆劃動畫。離線時自動進行靜態降級大字呈現，確保系統穩定。
  - 撰寫 [src/flashcard-template.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/src/flashcard-template.html)：建構學生端 HTML 骨架，引入 Hanzi Writer CDN，並寫入 `:root` 配色覆寫區塊。
  - 撰寫 [src/generator.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/src/generator.html)：老師端產生器網頁，支援 Excel TSV 解析，讀音語系（廣東話/普通話）與主題配色自適應鎖定，所有界面文字皆為**純繁體中文**。
- **打包與安全轉義**：
  - 撰寫並執行 [build.js](file:///D:/AI_AGENT/agycli/100_Todo/projects/chinese-flashcard-generator/build.js)，合成最終的 `index.html`。
- **語法校驗與測試**：
  - 執行 `check.js` 進行 Node.js VM 沙箱語法檢驗，結果 **100% 通過（零 SyntaxError）**。
- **文件同步與更新**：
  - 執行 `obsidian_sync.py` 與 `update_dashboard.py` 完成專案文檔同步與開發儀表板重新整理。

### 2026-06-13
- **雙語切換與解耦升級**：
  - 在教師介面新增中英雙語切換按鈕，所有標籤、說明及警告提示隨語言狀態即時變更。
  - 解耦「練習標題」與「匯出檔案名稱」的自動同步邏輯，改為獨立設定。
  - 將 Google Sites 嵌入指南改為教導老師使用「全頁嵌入網頁 (Embed page)」模式，避免傳統 iframe 嵌入所帶來的高度不足滾動條問題。
  - 修復了 HTML 原始檔中的雙重 footer 碎碼及 CSS style 閉合錯誤，確保原始碼語法結構完全正確。
  - **手機端與嵌入介面 RWD 優化**：移除學員端手機媒體查詢中限制滾動的 `overflow: hidden` 與 `height: 100vh` 鎖定屬性，改為流式 RWD 介面，讓學生在 Google Sites 嵌入或手機小螢幕上使用時，高度不足可自然垂直滾動，防止按鈕與進度條被截斷。
  - **Branding 頁尾品牌更新**：更新學員端 HTML 模板底部的 footer，將產出之識字複習網頁頁尾統一變更為 "Powered by HKTAYY3"。
  - 重新執行 `node build.js; node check.js`，檢驗結果 100% 通過。
