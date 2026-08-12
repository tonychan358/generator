# 📋 實作計畫：通用跨學科翻卡溫習產生器 (General Flashcard Generator Implementation Plan)

本計畫列出了建構、編譯與驗證「通用跨學科翻卡溫習產生器」的步驟。

---

## 第一階段：設計規格與專案初始化 (Phase 1: Specs & Setup)
* [x] 建立專案目錄結構。
- [x] 撰寫 [README.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/README.md) 與 [report_record.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/report_record.md)。
- [x] 撰寫詳細遊戲設計規格書 [general_flashcard_spec.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/docs/specs/general_flashcard_spec.md)。
- [ ] 撰寫本實作計畫 [implementation_plan.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/docs/plans/implementation_plan.md) 並提交給用戶審批。

## 第二階段：核心源代碼開發 (Phase 2: Source Code Development)
- [ ] 撰寫學生端複習樣式 `src/flashcard.css`：
  - 實作流暢 3D 翻轉效果（`transform-style: preserve-3d`、`backface-visibility: hidden`）。
  - 設計高質感、可切換的主題配色變數（科技藍、翡翠綠、朝陽橘、薰衣紫）。
  - 卡片內嵌米字格/田字格背景樣式（可由變數控制開啟或隱藏）。
  - RWD 響應式排版，特別針對手機直屏單頁面優化。
- [ ] 撰寫學生端交互邏輯 `src/flashcard.js`：
  - 管理卡牌狀態：當前卡牌索引、熟練度狀態（`mastered` / `review`）、開始與結束時間。
  - Web Speech API 朗讀功能：支援粵語、國語、英語、日語、韓語等語音，並依老師鎖定的發音面播放。
  - 網格導航（Navigation Grid）更新與點擊跳轉。
  - 結算畫面與 A4 橫向列印高保真證書功能（整合 A4 列印黑魔法：Rem 縮放、漸層列印 Inset 陰影 Fallback 等）。
- [ ] 撰寫學生端 HTML 模板外殼 `src/flashcard-template.html`：
  - 定義 UI 骨架：Lobby 歡迎頁、複習操作區、結算與證書頁。
  - 提供預留的 CSS、JS 與題庫數據注入錨點。
- [ ] 撰寫教師端產生器 `src/generator.html`：
  - 建構教師端繁體中文界面：輸入標題、自訂正面與背面欄位名稱、發音語系與朗讀卡面設定、田字格開關、主題配色與 Lobby 姓名開關。
  - 實作 Excel 兩欄 TSV 解析邏輯與錯誤提示。
  - 提供「載入範例」按鈕。
  - 實作前端動態打包與下載邏輯：在瀏覽器中直接將設定、題庫與模板字串合併，生成單一 standalone HTML 檔案。

## 第三階段：建置打包與語法安全檢驗 (Phase 3: Building & Verification)
- [ ] 撰寫編譯打包腳本 `build.js`：
  - 支援將 CSS、JS 及模板程式碼內嵌並進行變數無縫轉義打包，產生最終的 `index.html`（教師端產生器）。
- [ ] 撰寫自動化語法檢查 `check.js`：
  - 使用 Node.js 的 `vm` 模組在本地沙箱載入，對生成的 HTML 中的 JS 語法進行靜態自檢（Zero-Babel-Error）。

## 第四階段：測試與整合 (Phase 4: Testing & Integration)
- [ ] 執行 `node build.js` 生成最終的 `index.html`。
- [ ] 驗證教師端產生面板是否運作良好，並下載學生端 HTML 進行功能測試（3D 翻轉、語音朗讀、熟練度、A4 列印證書）。
- [ ] 執行 `python 000_Agent/scripts/obsidian_sync.py` 與 `python 000_Agent/scripts/update_dashboard.py`，更新個人 Obsidian 智庫與開發儀表板。
