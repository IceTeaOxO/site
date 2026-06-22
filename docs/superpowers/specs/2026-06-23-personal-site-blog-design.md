# 個人首頁 + 部落格 — 設計文件

**日期：** 2026-06-23
**狀態：** 已通過腦力激盪階段確認，待轉入實作規劃（writing-plans）

## 目標

建立一個單一網站，同時作為個人首頁與部落格，靜態產生、低維護成本、注重隱私，不過度設計。網站僅提供中文內容，不需要多語言支援。

## 技術架構

- **框架：** Astro，從零開始建立（`npm create astro@latest`），不使用現成主題套件
- **樣式：** Tailwind CSS
- **視覺參考：** 參考 Astro 官方主題 "Milky Way"（https://astro.build/themes/details/milky-way/，repo `ttomczak3/Milky-Way`）的簡潔排版與留白風格，**但不沿用其太空／星空視覺主題**——本站走中性的淺色／深色配色
- **內容管理：**
  - 部落格文章使用 Astro 5+ Content Layer API 的 content collections，檔案放在 `src/content/blog/*.md`
  - 專案／作品列表使用一份簡單的純資料陣列 `src/data/projects.ts`，不建立成 content collection（因為內容量小、變動低，用 collection 是過度設計）
- **不需要：** 標籤／分類功能、MDX、多語言（i18n）

## 內容結構（首頁）

首頁包含三個區塊：
1. 自我介紹 + 聯絡方式連結
2. 最新文章預覽列表
3. 專案／作品集列表

## 部落格功能

- RSS feed
- 全站搜尋：使用 Pagefind
- 不需要標籤或分類

## 視覺設計

- 淺色／深色（light/dark）中性配色，不採用太空／星空主題
- 排版與留白風格參考 Milky Way 主題的簡潔感

## 訪客統計（Analytics）

- 使用 GoatCounter（相較 Cloudflare Web Analytics 與 GA4，在設置成本、隱私與功能間取得較好平衡，且不需要 cookie 同意橫幅）
- **前置條件：** 使用者需自行到 goatcounter.com 註冊取得網站代碼（site code），此步驟無法透過程式碼完成，需在實作階段提醒使用者執行

## 部署

- **GitHub 帳號：** `IceTeaOxO`
- **Repo 名稱：** `site`（一般 project-page repo，非 `IceTeaOxO.github.io` 的 user-page repo）
- **Base path：** 暫時為 `/site`，待之後設定自訂網域後可移除（屬於暫時性質，非永久架構決策）
- **部署流程：** GitHub Actions，使用官方 `withastro/action@v6` + `actions/deploy-pages`
- **Repo 設定：** Pages 來源（source）設為 "GitHub Actions"

## 非目標（Out of scope）

- 標籤／分類系統
- 多語言（i18n）
- MDX
- 留言系統、會員系統等動態功能（目前為純靜態站）
- 自訂網域設定（已知未來會做，但不在本次規劃範圍內，待後續再開新的設計討論）
