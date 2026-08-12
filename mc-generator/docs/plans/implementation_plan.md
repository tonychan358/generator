# 📝 MC Generator 實做計畫 (Implementation Plan)

## 1. 核心技術架構 (Technical Architecture)

### 1.1 100% 純 Vanilla 技術棧 (Zero-Dependency)
為了保障產出的測驗網頁具有 **100% 離線便攜性 (Offline Portability)**，避免因為學校內部網路防火牆攔截外部 CDN (如 Tailwind, FontAwesome) 導致樣式崩潰，本專案將採用：
- **Generator (產生器本身)**: 單一 HTML 檔案 (`index.html`)，採用 Vanilla CSS 與 Vanilla JavaScript。
- **Generated Quiz (生成的測驗網頁)**: 純 Vanilla CSS / Vanilla JS 封裝，無任何外部網路依賴。所有主題配色、雙語切換、圖標 (使用純 CSS 或 SVG 內嵌) 皆打包在單一 HTML 檔案中。

### 1.2 Excel TSV 解析算法
老師從 Excel 複製的資料為 Tab 分隔的 TSV 格式。解析算法步驟：
1. 以換行符 `\n` 或 `\r\n` 分隔成列。
2. 對每一列，以 Tab 字元 `\t` 分隔成欄位。
3. 清理各欄位的前後空格。
4. 欄位映射：
   - Index 0: 題目 (Question)
   - Index 1..4: 選項 A, B, C, D
   - Index 5: 答案 (Ans) -> 標準化為大寫 `A`, `B`, `C`, `D`。支援容錯（如去除句點 `A.`、中文「A」等）。
   - Index 6: 詳解 (Explanation) -> 若無，則預設為空字串。
5. 雙語配對：
   - 若為雙語模式，分別解析中文 TSV 與英文 TSV。
   - 根據題目的陣列索引 (0-indexed) 進行配對：
     `{ id: i, cn: cnQuestionObj, en: enQuestionObj }`
   - 若兩邊題數不一致，以中文題數為主，英文缺失部分自動補空，並在下載前跳出提示警告。

---

## 2. 實做步驟與進度規劃

### 🛠️ 階段一：建立專案與文件規範
- [x] 建立 `report_record.md` 與 `README.md`
- [x] 撰寫設計規格書與實做計畫

### 🛠️ 階段二：撰寫 HTML 模板字串 (Template Generator)
- 設計一個名為 `quizTemplate` 的 JS 模板函數。
- 該模板將注入：
  - `CONFIG`: 包含科目名稱、練習標題、主題色配置 (CSS 變數)、語系模式。
  - `QUESTIONS`: 解析後的 JSON 題庫陣列。
- 模板內包含精美的 Vanilla CSS，並實做雙語切換邏輯。

### 🛠️ 階段三：建置產生器 UI (`index.html`)
- **第一區：練習參數 (Configuration)**
  - 輸入：練習標題、科目名稱。
  - 選擇：主題色 (Sky Blue, Classic Green, Vibrant Orange, Elegant Purple)。
  - 選擇：語系 (繁體中文, English, 中英雙語切換)。
- **第二區：題庫貼上區 (Question Input)**
  - 根據語系動態顯示 Textarea。
  - 提供預設的 Excel 範例資料一鍵載入，供老師測試。
- **第三區：匯出與指引 (Export & Guide)**
  - 提供「下載獨立 HTML 檔案」按鈕。
  - 展示精緻的 Google Sites 嵌入指引與動態生成的嵌入碼。

### 🛠️ 階段四：測試、防呆與優化
- **JSON 轉義安全**: 確保題目、選項、詳解中若有雙引號 (`"`)、單引號 (`'`) 或換行符，在轉為 JSON 字串注入模板時，不會導致模板腳本語法出錯。
- **Excel 容錯測試**: 測試空白行、無解析欄位、答案格式不對 (例如小寫 `a`) 等。
- **響應式 UI 測試**: 確保產生的網頁在手機直屏下有優良的互動體驗。
