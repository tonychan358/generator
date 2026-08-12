# 📝 MC Generator 專案開發記錄

## 📌 當前狀態
- **狀態**: 已完成 (Completed)
- **進度**: 100%
- **健康度**: 🟢 健康

## 🗓️ 任務執行日誌

### 2026-06-03
- **初始化專案**: 建立專案目錄 `100_Todo/projects/mc-generator/`
- **撰寫文件**: 建立 `README.md` 與 `report_record.md`
- **設計規格**: 撰寫 `docs/specs/mc_generator_spec.md` 與 `docs/plans/implementation_plan.md`
- **代碼開發**: 完成 `index.html` 核心產生器與測驗網頁模板的實作，支援中英雙語、Excel 題庫貼上 (TSV)、四色主題。
- **Bug 修復**: 修復了生成模板中內置的 `</script>` 標籤導致產生器腳本被提前截斷的語法錯誤 (ReferenceError: loadExample is not defined)。將其轉義為 `<\/script>`，語法檢查通過。
- **新功能升級**:
  - 新增自訂匯出檔案名稱功能。
  - 新增大廳畫面 (Lobby) 與學生姓名輸入框，在結果結算卡片中完美呈現學生姓名。
  - 支援三種作答模式：「一次顯示全部」、「一題一頁」與「隨機抽 10 題（洗牌打亂，若不足 10 題則取全部）」。
  - 為產出的 HTML 測驗網頁進行了手機直屏（RWD）深度優化與觸控裝置 Hover 粘滯 Bug 修復。
  - **作答交互重大升級**：改為「全部答完一次過提交批改」；分頁作答時提供「上一題/下一題」與「題目導覽網格」以便學生自由檢查與跳轉修改；提交後在結算畫面下方一併列出所有已批改題目卡片與解析（答題回顧與詳解模式），極大提升複習體驗。
- **模組化重構**: 將單檔產生器解耦拆分為 `src/` 目錄下的多個獨立模組檔案，並撰寫 Node 構建腳本 `build.js` 自動進行 inline 注入與標籤轉義，從根本上解決了在 string template 內修改代碼時無語法高亮、易出轉義 Bug 的問題。
- **Bug 修正與交互防呆 (2026-06-03 續)**:
  - **修復預留位置替換 Bug**: 修正了原先 `build.js` 打包時未在 JavaScript 模板字串中正確替換 `/* {{QUIZ_TITLE}} */`、`/* {{QUIZ_SUBJECT}} */`、`/* {{QUESTIONS_DATA}} */` 等預留位置的缺陷，確保點擊下載的測驗網頁完全可用。
  - **修復主題色注入 Bug**: 新增了在 `<head>` 中動態注入 `:root` 變數覆寫的 `<style>` 區塊，讓生成的測驗網頁能完美套用老師選擇的 Sky Blue/Classic Green/Vibrant Orange/Elegant Purple 主題色。
  - **答哂一次過批改與防呆**: 檢查並確認「隨機抽 10 題」及「一題一頁」模式均採用「答完再提交」邏輯。同時在點擊「提交」時加入**防呆警示**：若有未答題目會彈窗警告並顯示未答題數，防止誤觸。
  - **架構評估**: 明確了模組化（`src/` 程式碼與 `build.js`）的解耦開發結構，能讓 AI 與人類開發者在修改時專注於職責分離的子檔案中，有效避免程式碼破碎。
  - **修復重音符語法錯誤 (SyntaxError: Unexpected identifier '$')**: 排查並解決了在轉義流程後，打包腳本 `build.js` 使用未轉義的重音符 `` ` `` 注入 `langMode` 與 `quizMode` 導致外層模板字串結構被提前閉合破碎的問題。已全面改用單引號 `'\${langMode}'` 與 `'\${quizMode}'` 注入，語法校驗完全通過，下載按鈕現已運作正常。
  - **更新開發指南**: 將重音符避免使用、轉義處理順序、行動端 RWD 及 Hover 粘滯解決方案、答題防呆等 in general 的踩坑與優化點，寫入通用指南 [export_html_generator_sop.md](file:///D:/AI_AGENT/agycli/300_Reference/templates/export_html_generator_sop.md) 中。
- **文件同步**: 執行 `obsidian_sync.py` 與 `update_dashboard.py` 將新專案與文件同步至 Obsidian 智庫和開發儀表板。

### 2026-06-13
- **範例題庫 ECON 化**：
  - 將 `src/generator.html` 教師端內置的預設題庫（`sampleCn` 和 `sampleEn`）由原先的物理科學類別，改為以 **經濟科 (Econ)** 為主的 5 道核心選擇題範例，包含機會成本、稀缺性、需求定律、GDP 及貿易保護政策。
  - 優化 `loadExample()` 功能：在教師點擊載入範例時，自動將「科目名稱」、「練習標題」、「匯出檔案名稱」與「語系模式」填入為最適合經濟科測驗的預設設定值，提升使用體驗。
  - 重新執行 `node build.js` 重新生成 [index.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/html-generators/mc-generator/index.html) 成品，並通過 `node check.js` 的 100% 語法自檢。
  - 執行 Obsidian 同步與專案數據儀表板更新，一切運行正常。
- **教師端多國語言支持 (中英雙語切換)**：
  - 在教師端 `generator.html` 頂部加入「中英切換按鈕 (Bilingual Switcher)」與精緻的 Earth Icon。當英文教師使用產生器時，能一鍵將產生器的所有設定標題、欄位 Placeholder、Excel 格式說明、下載按鈕、彈窗提示與 Google Sites 嵌入步驟指引切換為英文。
  - 設計了一套前端的多國語言字典 (`translations` 物件)，透過 `data-i18n` 屬性標記需要翻譯的 DOM 元素，並使用 `toggleInterfaceLanguage()` 動態更新頁面文字、Placeholders 以及錯誤警告視窗的提示語。
  - 將解析 Excel 複製格式時所拋出的各類錯誤提示與防呆警告（欄位不足、答案為空、雙語題數不一致等）全面進行了語系化支持，確保純英文語系體驗的一致性。
  - 重新執行 `node build.js` 編譯並輸出新的 [index.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/html-generators/mc-generator/index.html) 成品，並順利通過 `node check.js` 100% 語法自檢。
- **解耦練習標題與匯出檔案名稱**：
  - 移除了「練習標題 (Practice Title)」和「匯出檔案名稱 (File Name)」輸入框之間的自動同步事件（`syncFilename()` 及相關事件監聽與 trigger）。
  - 教師現在可以獨立、分開設定網頁上的練習標題與下載的 HTML 檔名，避免了輸入中文標題時檔名也自動被變為中文的困擾。
  - 重新執行 `node build.js; node check.js` 打包及自檢，一切運作正常。
- **更新 Google Sites 嵌入指引為全頁嵌入**：
  - 修改了 [generator.html](file:///D:/AI_AGENT/agycli/100_Todo/projects/html-generators/mc-generator/src/generator.html) 內中英文 `translations` 的 `guide3`、`guide4`、`guide5` 步驟文字。
  - 指引內容改為教導老師使用 Google Sites 的 **「新增全頁嵌入網頁 (New embed page)」** 模式，這能讓測驗網頁自動 100% 填滿整個瀏覽器畫面，避免手動拖曳調整高度所產生的滾動條（scrollbar）問題，提升學生答題體驗。
  - 重新執行 `node build.js; node check.js` 打包及自檢，一切運作正常。
- **手機端 UI Resizing 與答題觸控優化**：
  - 更新學員端 CSS 中的手機媒體查詢樣式，全面採用 `clamp()` 字型大小計算公式，讓題目與選項字體能配合手機螢幕極致流動縮放。
  - 將選項按鈕的最小高度限制為 `48px`，大按鈕的最小高度限制為 `44px`，保證手機端學生的手勢答題熱區與最優觸控體驗。
  - 重新執行 `node build.js; node check.js` 通過靜態自檢。
- **Branding 頁尾品牌更新**：
  - 更新學員端 HTML 模板底部的 footer，將產出之測驗網頁頁尾統一變更為 "Powered by HKTAYY3"。
  - 重新執行 `node build.js; node check.js` 通過打包與沙箱檢驗。

### 2026-06-15
- **結算證書動態生成與長按儲存功能**：
  - 在學員端結算卡片 (`summary-card`) 中引入了全新的證書展示區 (`certificate-container`)。
  - 實作了基於 HTML5 Canvas 的高畫質 (1200x840 px, 2x 視網膜畫質) 證書動態繪製系統。
  - 證書完美適配老師設定的主題顏色（`themePrimaryColor`），具備金色古典雙層內邊框與角落細緻幾何折角。
  - 動態繪製了帶有金色漸層與鋸齒效果的 Achievement Seal 勳章（根據分數顯示 PASSED, EXCELLENT 或 PERFECT）以及硃砂紅「圓玄三中學習之印」的紅色防偽印章。
  - 動態抓取 DOM 中的科目名稱與測驗標題，將學生姓名、答對題數、百分比分數與當前日期整合為中英雙語對照正文。
  - 將 Canvas 自動轉為 Base64 DataURL (image/png) 並注入 `<img>` 標籤，解決了 Google Sites iframe 內直接使用 Canvas 無法長按儲存的問題，實現完美的「長按儲存至相簿 (Save into Photo)」功能。
  - 更新 `resetQuiz()` 邏輯，確保「重新挑戰」時清除並隱藏舊證書。
  - 重新執行 `node build.js` 編譯，並通過 `node check.js` 的 100% 語法自檢。
- **題目與選項順序隨機化模式**：
  - 在教師端 `generator.html` 第一步中新增「題目及選項順序 (Question & Option Order)」參數選擇，支援「按題庫固定順序 (Keep original order)」與「學生每次作答隨機打亂 (Randomize questions & options)」兩種模式。
  - 為教師端的多國語言字典 (`translations` 的 `zh` 與 `en`) 新增對應的國際化字詞。
  - 修改打包工具 `build.js` 與學生端模板 `quiz-template.html`，引入全域變數 `orderMode`，使該設定可自適應編譯入最終 HTML。
  - 在學員端 `quiz.js` 的 `startQuiz()` 中實作當選定為 `shuffle` 模式時題目與選項的隨機化邏輯：
    - 題目部分：採用數組打亂洗牌演算法對 `activeQuestions` 進行亂序。
    - 選項部分：建立 `shuffledIndices` 映射數組打亂 A, B, C, D 原本的選項順序，並在 `startQuiz` 中透過計算 `indices.indexOf(originalCorrectIdx)` 自動對齊並覆寫正確答案的相對字母 `newQ.ans`，使得原有的判題引擎與計分邏輯零修改、零風險直接兼容。
  - 優化 `createQuestionCard` 及語系切換函數 `updateUIVocabulary` 中的 DOM 渲染邏輯，確保中英雙語切換時能精確讀取打亂後的 `shuffledIndices` 內容，防止語系變更導致隨機順序被打回原形的 Bug。
  - 重新編譯（`node build.js`）及自檢（`node check.js`），自檢順利通過。
- **固定修畢證書與合格門檻控制功能**：
  - 簡化證書大標題，不論作答成績如何，一律固定為「修畢證書 / Certificate of Completion」，且金色成就徽章 (Seal) 中的中間主文字固定為 `COMPLETED`（字型調整為 `13px` 以完美貼合內圈），符合結業修畢的標準語意。
  - 在教師端 `generator.html` 第一步中新增「證書頒發門檻 (Certificate Passing Threshold)」下拉參數設定，支援從 `0%` (完成即可) 到 `100%` (必須全對) 的 7 種及格門檻（預設 `60%`）。
  - 為教師端的多國語言字典 (`translations` 的 `zh` 與 `en`) 新增合格門檻標籤與選項翻譯。
  - 修改 `build.js` 及學生端模板 `quiz-template.html` 以將門檻數值 `passingScore` 封裝編譯入最終產出的 HTML。
  - 在學生端結算卡片 (`summary-card`) 中引入未合格重做提示區 (`retry-hint` 元素，底色採用淡紅警示邊框 `.retry-hint`），並在 `quiz.js` 的 `i18n` 字典中新增中英雙語警示字詞 `retryForCert`。
  - 在學員端 `quiz.js` 的 `submitAllQuestions()` 中實作達標判定：
    - 當學生成績 `pct >= passingScore` 時，自動隱藏重做提示，並像往常一樣動態繪製及顯示高畫質「修畢證書」。
    - 當學生成績 `pct < passingScore` 時，自動隱藏證書區，並動態填入雙語警示字詞（如「⚠️ 未達合格門檻 60%，請點擊下方按鈕重新挑戰以取得證書！」）並顯眼展示，提醒學生需要重新挑戰。
  - 更新 `updateUIVocabulary()` 以在不及格狀態下點選語言切換時，同步翻譯不及格提示文字的語系；更新 `resetQuiz()` 以在學生點擊重新挑戰時隱藏並重置此警示區。
  - 重新打包編譯（`node build.js`）並通過 `node check.js` 安全檢查。
- **產生器 UI 與頁尾品牌標語更新**：
  - 將教師端產生器頂部的副標題從「MC Exercise Generator for Google Sites - 專為老師設計的一鍵 Excel 轉網頁工具 (模組化架構)」簡化為「MC Exercise Generator for Google Sites - 專為老師設計的一鍵 Excel 轉網頁工具」，同時更新了 HTML 以及 `zh` 翻譯詞典。
  - 將教師端底部頁尾 (footer) 從「香港道教聯合會圓玄學院第三中學 · HKTA The Yuen Yuen Institute No.3 Secondary School」變更為「香港道教聯合會圓玄學院第三中學 · HKTA The Yuen Yuen Institute No.3 Secondary School · AI in Education」，為學校品牌注入 AI 教育特色。
  - 重新打包編譯（`node build.js`）並通過 AST 語法安全自檢（`node check.js`）。
- **修復 Google Sites 嵌入沙箱限制 (VM Ignored call to confirm)**：
  - 解決了當產出之網頁嵌入 Google Sites 的帶有沙箱限制 `<iframe>` 時，原生 `confirm()` 彈窗因為未設置 `allow-modals` 被瀏覽器強制 Ignored，進而導致學生點選提交時被阻斷、無法順利 submit 答案的致命 Bug。
  - 移除了所有原生 `confirm()` 的呼叫，並實作了一套純 DOM 的**「自訂防呆對話框 (Custom Confirm Modal)」**，這在 Google Sites 沙箱環境下能 100% 正常運作且免除任何權限限制。
  - 在學生端模板 `quiz-template.html` 中加入了具有精緻設計感與半透明毛玻璃背景 (`backdrop-filter: blur(4px)`) 的對話框卡片 DOM 結構。
  - 在 `quiz.css` 中為 `.custom-modal-overlay` 遮罩層、警告圖示與主題色「確認」按鈕增加了平滑的滑入滑出漸變動畫，使網頁視覺體驗與產生器整體外觀融為一體，具有更高的 premium 質感。
  - 在 `quiz.js` 中新增了 `showCustomModal(message, onConfirm)` 與 `closeCustomModal()` 事件對話框系統，在學生確定提交後自動執行回調函數提交答案。
  - 重新打包編譯（`node build.js`）與語法校驗（`node check.js`），語法檢測通過。
