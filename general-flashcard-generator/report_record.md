# 📝 General Flashcard Generator 專案開發記錄

## 📌 當前狀態
- **狀態**: 已完成 (Completed)
- **進度**: 100%
- **健康度**: 🟢 健康

## 🗓️ 任務執行日誌

### 2026-06-12
- **初始化專案**: 建立專案目錄 `100_Todo/projects/general-flashcard-generator/`。
- **撰寫基礎文檔**:
  - 建立 [README.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/README.md)、[report_record.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/report_record.md)。
- **設計與規劃**:
  - 撰寫規格書 [general_flashcard_spec.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/docs/specs/general_flashcard_spec.md) 及實作計畫 [implementation_plan.md](file:///D:/AI_AGENT/agycli/100_Todo/projects/general-flashcard-generator/docs/plans/implementation_plan.md)。
  - 根據用戶反饋，調整發音設定：僅保留粵語與英語（美音、英音）發音選項。
- **核心開發 (通用性 & 漢字田字格 & 證書列印)**:
  - 撰寫 `src/flashcard.css`：實現 3D 翻轉卡片、適應手機直屏的 RWD 視圖、高質感色彩主題（科技藍、翡翠綠、朝陽橘、薰衣紫）、漢字田字格輔助線、以及 **A4 橫向高保真列印證書**（包含 `size: landscape` 零邊距、`rem` 縮放與漸層列印 `box-shadow` Inset 陰影防白化 Fallback）。
  - 撰寫 `src/flashcard.js`：實現通用字卡複習邏輯（`{ front: '...', back: '...' }`），支援選擇發音語系與朗讀面，並具備智慧漢字判斷（當字卡為單個中文字且啟用田字格時才自動顯示田字格線）。支援可設定 Lobby 是否要求輸入姓名（不要求時自動以 Guest 登入並直入 Arena 複習）。
  - 撰寫 `src/flashcard-template.html`：為學生端頁面定義 UI 骨架與變數/樣式注入錨點。
  - 撰寫 `src/generator.html`：教師端繁體中文親和介面，支援完全自訂正面與背面欄位名稱、發音語系、田字格開關、主題配色、以及大區塊 Excel TSV 直接貼入。
- **編譯打包與自檢**:
  - 撰寫並執行 `build.js`，將 CSS、JS 與學生端模板內嵌壓縮合成至 `index.html`。
  - 撰寫並執行 `check.js` 進行靜態 JavaScript 沙箱編譯，結果 **100% 通過 (Zero SyntaxError)**。
- **修復亂序結算 Bug、新增圖片下載與更新 Skill 指南**:
  - 修正複習 Arena 中的 `markStatus` 結算跳轉邏輯：只要已評估的字卡總數等於全部題目數量（不論學生當前是在哪一頁按 `mastered`/`review`），即會在 300ms 後自動進入 Summary 結果頁，徹底解決跳頁/亂序複習無法結算的 Bug。
  - 將證書生成模式從「調用瀏覽器 PDF 列印」優化為「離線自動下載 PNG 圖片」：更新 `src/flashcard-template.html` 內按鈕調用為 `downloadCertificateImage()`，更換其 SVG 圖標為下載圖案，並設定預設文字為「儲存證書圖片」。
  - 將此 100% 純前端 Canvas 2D 離線證書繪圖下載技術寫入 [create_gamified_learning_courseware/SKILL.md](file:///D:/AI_AGENT/agycli/000_Agent/skills/create_gamified_learning_courseware/SKILL.md) 指南中的 `3.3` 章節。
  - 重新執行 `build.js` 進行 `index.html` 打包，並通過 `check.js` 的 100% 語法自檢。
  - 執行全域 Obsidian 同步及動態儀表板整理，狀態為健康且 100% 完成。
- **簡化語音發音設定為「開/關」並實作智能語言判定**:
  - 將教師端 `src/generator.html` 設定介面的「發音語系設定」簡化為「開啟語音朗讀 / 關閉語音朗讀」開關，不再讓教師手動挑選特定的語系。
  - 重構 `src/flashcard.js` 學生端的 `speak()` 發音邏輯，實現全自動發音語系匹配：
    1. 純中文模式下：一律採用粵語 (`zh-HK`)。
    2. 純英文模式下：一律採用英語 (`en-US`)。
    3. 雙語模式下：動態「見字讀字」，若朗讀的文字內容含有中文字元，則使用粵語 (`zh-HK`)，否則使用英語 (`en-US`)。這完美解決了學生在雙語切換介面時，朗讀發音需要自動配合頁面語言變動的需求。
  - 重新執行 `build.js` 和 `check.js` 進行專案打包與 100% 語法無錯自檢，並執行全域專案同步與儀表板整理。

### 2026-06-13
- **範例題庫書面語化**：
  - 將 `src/generator.html` 中預設雙語及中文範例中的「和」（如最終商品和服務、稅收和支出）修改為標準書面語「與」。
  - 重新執行 `node build.js` 重新生成成品 [index.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/html-generators/general-flashcard-generator/index.html)，並通過 `check.js` 的 100% 語法自檢。

### 2026-06-13 (續)
- **Google Sites 嵌入指引更新**：
  - 更新教師介面中的 Google Sites 整合指南，將 traditional iframe 嵌入模式調整為「全頁嵌入網頁 (Embed page)」模式，同時完成 zh 與 en 的雙語對應字典更新。
  - 重新執行 `node build.js; node check.js` 通過靜態語法與功能編譯打包測試。
- **手機端 UI Resizing 與證書彈窗優化**：
  - 移除學員端手機媒體查詢中導致 iframe 嵌入被截斷且無法滾動的 `overflow: hidden` 及 `height: 100vh` 鎖死設定，改為具備垂直滾動彈性的流式佈局。
  - 將原本點選儲存證書直接觸發檔案下載的方式，優化為彈出精美的 Modal Popup 顯示圖片，使 iOS/Android 等手機用戶可直接透過「長按圖片」將證書儲存至手機相簿。
  - **Branding 頁尾品牌更新**：更新學員端 HTML 模板底部的 footer，將產出之複習網頁頁尾統一變更為 "Powered by HKTAYY3"。
  - 重新執行 `node build.js; node check.js` 通過打包自檢。

### 2026-06-15
- **Branding 頁尾品牌與證書視覺升級**：
  - 更新教師端 `generator.html` 的 footer 品牌文字為 `香港道教聯合會圓玄學院第三中學 · HKTA The Yuen Yuen Institute No.3 Secondary School · AI in Education`，並同步中英文切換之翻譯。
  - 升級學員端 `flashcard.js` 的 Canvas 證書為高解像度 1200x840 px **「修畢證書 / Certificate of Completion」** 規格（對齊 MC Generator 最新視覺設計，包含象牙白底色、主題色邊框、金色細內框與折角裝飾、Verified Signature、左下角黃金勳章及右下角紅色圓玄三中電子之印）。
  - 將閃卡溫習數據直接印在證書上，包含：**「熟練度 (Mastery)」** 與 **「溫習用時 (Time Spent)」**。
  - 重新執行 `node build.js` 重新生成成品 [index.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/html-generators/general-flashcard-generator/index.html) 並通過 `check.js` 100% 語法檢測（Zero SyntaxError）。

### 2026-06-16
- **溫習模式選項重命名與中文語音說明優化**：
  - 將教師端設定面板中的溫習模式選項改名為：`中文版` (Chinese Version)、`英文版` (English Version)、`中英切換` (Bilingual (Chinese/English))，讓選項名稱更加簡潔直覺。
  - 在語音設定中，明確標示「開啟語音朗讀 (廣東話 / 英語)」(Speech Enabled (Cantonese / English))，藉此在設定上主動說明中文語音一律使用廣東話 (粵語 `zh-HK`)，英文則使用英語口音。
  - 重新執行 `node build.js` 重新生成成品 [index.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/html-generators/general-flashcard-generator/index.html) 並通過 `check.js` 100% 語法檢測。

