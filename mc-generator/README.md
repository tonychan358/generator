# 📝 MC Generator (選擇題網頁產生器)

這是一個專為中小學教師設計的選擇題 (Multiple Choice) 測驗網頁產生器。旨在讓不具備程式設計背景 (No-coding base) 的教師能夠透過簡單的 Excel 題庫複製貼上，快速生成美觀、支援中英雙語切換、且能無縫嵌入 Google Sites 的獨立互動測驗網頁。

## 🚀 核心功能

1. **視覺化設定參數**
   - 支援輸入科目名稱、練習標題。
   - 提供 4 種預設的主題色彩 (科技藍、經典綠、活力橘、優雅紫)。
   - 支援 3 種語系模式：繁體中文、English、中英雙語切換。

2. **Excel 題庫一鍵匯入 (Tab-separated TSV 支援)**
   - 教師只需在 Excel 中依照特定欄位順序製作題庫，選取並複製後直接貼上：
     - **A**: 題目 (Question)
     - **B**: 選項 A (Choice A)
     - **C**: 選項 B (Choice B)
     - **D**: 選項 C (Choice C)
     - **E**: 選項 D (Choice D)
     - **F**: 標準答案 (Ans) - 如 A, B, C, D
     - **G**: 詳解/解析 (Explanation)
   - 根據第一步選擇的語系模式，動態開啟「中文題庫貼上區」與「英文題庫貼上區」。

3. **匯出與 Google Sites 嵌入**
   - 自動將題庫與設定編譯成單一、離線可用的 HTML 檔案。
   - 提供直覺的 Google Sites 嵌入指引與嵌入代碼。

## 📂 目錄結構
- `docs/`
  - `specs/`: 專案設計規格書
  - `plans/`: 實做計畫與流程
- `index.html`: 產生器主網頁
- `report_record.md`: 開發與維護記錄
