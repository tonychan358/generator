# 開發計畫書：非華語學生中文識字翻卡產生器 (Chinese Flashcard Generator)

本計畫書規劃了「非華語學生中文識字翻卡產生器」的開發與校驗時程。

---

## 階段一：架構規劃與文件建立
* [x] 建立專案目錄結構。
* [x] 撰寫規格書 `docs/specs/chinese_flashcard_spec.md`。
* [x] 撰寫本開發計畫書 `docs/plans/implementation_plan.md`。
* [ ] 建立專案 README.md 與 report_record.md。

## 階段二：核心組件開發
* [ ] 建立 `src/flashcard.css`：
  - 設計卡牌的 3D 翻轉效果（rotateY 與 perspective）。
  - 設計 Hanzi Writer 動態書寫框的佈局、底圖田字格線樣式、以及重播/關閉筆劃控制按鈕。
  - 設計主題配色變量，使筆劃動畫的線條顏色與按鈕同步。
* [ ] 建立 `src/flashcard.js`：
  - 設計學生端的核心狀態（學生姓名、隨機排序字卡、目前索引、掌握狀態、溫習計時）。
  - 整合 Web Speech API TTS，尋找廣東話/粵語 (`zh-HK`) 或普通話/國語 (`zh-CN` / `zh-TW`) 的原生系統發音。
  - 整合 `HanziWriter` 物件動態初始化、筆劃動態繪製與重播，並在載入失敗時提供大字降級保護。
* [ ] 建立 `src/flashcard-template.html`：
  - 設計學生端 HTML 骨架。
  - 引入 `Hanzi Writer` 的 CDN 腳本，並預留本地降級的 CSS/JS 區塊。
* [ ] 建立 `src/generator.html`：
  - 老師端繁體中文 UI 設定介面（科目、標題、口音語系、配色主題）。
  - TSV 資料解析與漢字筆劃前置安全檢查。
  - 繁體中文的 Google Sites 嵌入指引。

## 階段三：打包自動化與語法校驗
* [ ] 建立 `build.js` 合成編譯器：
  - 將 CSS、JS、資料正確打包並寫入根目錄的 `index.html`。
  - 對腳本中特殊字元與反引號進行安全轉義。
* [ ] 建立 `check.js` 靜態編譯校驗器：
  - 在 Node 沙箱環境中加載檢驗產出的 HTML Script。

## 階段四：測試與同步
* [ ] 雙擊進行實際功能測試。
* [ ] 執行同步腳本 `obsidian_sync.py` 與 `update_dashboard.py` 更新 Obsidian 筆記與開發儀表板。
