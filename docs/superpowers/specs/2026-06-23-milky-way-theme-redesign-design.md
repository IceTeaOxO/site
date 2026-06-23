# 網站視覺主題改版 — milky-way 風格 — 設計文件

**日期：** 2026-06-23
**狀態：** 已通過腦力激盪階段確認（含瀏覽器 mockup 比對），待轉入實作規劃（writing-plans）

## 背景

原始設計（見 `2026-06-23-personal-site-blog-design.md`「視覺設計」一節）決定採用中性淺色／深色配色，明確不沿用 Milky Way 主題的太空／星空視覺。實際做出來後使用者反饋版面太陽春、缺乏美感，重新比較後決定改採 Milky Way 風格的星空主題。**本文件取代原始設計文件中「視覺設計」一節的決定**，其餘章節（內容結構、部落格功能、部署等）不受影響。

## 視覺方向

透過瀏覽器 mockup 比較兩個方向（A. 中性簡約強化版／B. milky-way 深色星空版）後，使用者選擇 B，並進一步迭代解決「擠在一起」的排版問題。最終方向：

- **深色模式（夜）：** 放射狀漸層背景 `radial-gradient(ellipse 90% 60% at 50% -15%, #2a1f4d 0%, #0c0a1e 55%, #060512 100%)`，疏密不一的星點（多層 `radial-gradient` 模擬，無圖片、無 JS），標題用紫到青的漸層文字（`#c9b8ff` → `#8fd8ff`，`background-clip: text`）
- **淺色模式（日）：** 線性漸層背景 `linear-gradient(180deg, #cfe8ff 0%, #eef6ff 45%, #fbfdff 100%)`，柔光雲朵（模糊放射狀漸層，暖色調 `rgba(255,221,150,.35)` 點綴日出感），標題用藍到暖金的漸層文字（`#2f6fa5` → `#e8a23a`）
- 兩個模式共用同一套排版骨架與間距節奏，只替換色彩 token，讓使用者感覺是「同一個站的日／夜兩個時段」而非兩個不相關的設計
- 沿用現有 `prefers-color-scheme` 自動切換機制，不額外做手動切換開關

## 套用範圍

全站套用，不只首頁：
- 共用 nav（首頁／文章／搜尋連結）
- 首頁 hero 區塊 + 最新文章／專案 section
- 文章列表頁
- 文章內頁（含內文排版）
- 搜尋框（Pagefind modal）配色

## 排版骨架與間距

統一的內容欄寬與節奏。腦力激盪過程中有兩版 mockup（`layout-v2` 解決「擠在一起」問題、`day-night` 是最終日／夜對照版），兩版數字略有差異——以下取**最終版本（day-night）**為準，實作請用這組精確數值，不要混用前一版：

- 內容欄置中，`max-width: 680px`
- nav：上下 padding `28px`
- hero 區塊：padding `56px 0 72px`（上 56、下 72），標題字級用 `clamp()` 做流體縮放，桌面約 `46px`，小螢幕自動縮小（建議 `clamp(32px, 8vw, 46px)`）
- 內容 section（最新文章／專案）：上下 padding `44px`，section 標題為大寫字母間距 `.1em`、字級 `13px`，前面加一個 `6px` 圓點＋光暈（`box-shadow`）作為視覺錨點，顏色用該模式的強調色
- 文章列表 row：上下 padding `16px`，用上邊框分隔（非第一個 row 才加邊框）
- 專案卡片：padding `18px 20px`，`border-radius: 12px`，用 1px 邊框＋極淡背景色，不用整圈陰影

## 色彩 Token（CSS 自訂屬性，寫在 `global.css`）

延續現有 `:root` + `@media (prefers-color-scheme: dark)` 的寫法（與既有 `--pf-*` 搜尋框變數同一檔案），新增一組站內主題 token，例如背景漸層、前景文字、次要文字、強調色（漸層兩端）、邊框、卡片底色。深色／淺色各一組，數值取自已確認的 mockup（見上方視覺方向的色碼）。

**搜尋框配色同步更新：** 現有 `--pf-*` 變數（上次修 Pagefind bug 時設定的中性黑白）會一併改成呼應新主題的配色（深色版用星空紫／青、淺色版用天空藍／暖金），避免搜尋框看起來像舊設計殘留。

## 字型

維持系統預設字體堆疊（`-apple-system` 等），不載入任何自訂 web font，保持頁面輕量、零額外網路請求。

## 順便修的既有問題

`src/pages/blog/[...slug].astro` 目前用 `class="prose dark:prose-invert"`，但專案並未安裝 `@tailwindcss/typography`，這個 class 目前完全沒有效果，文章內文是瀏覽器預設樣式（純黑字）。換上深色背景後預設黑字會幾乎不可讀，等於文章頁面壞掉。

**修法：** 不額外安裝 typography 套件（維持專案一貫的「能不加套件就不加」傾向），改在 `global.css` 手寫一組輕量的文章內文樣式（標題、段落、連結、列表），套用前述同一組色彩 token。

## 明確不做的事

- 不做任何動畫效果（星星不閃爍、無進場動畫），避免一次擴大範圍，之後有需要再另開討論
- 不做手動深色／淺色切換開關，沿用現有 `prefers-color-scheme` 自動偵測
- 不做行動版專用導覽選單（漢堡選單等）——nav 只有三個連結，窄螢幕下原生 flex 排列即足夠，不需要額外元件

## 受影響的檔案

- `src/styles/global.css` — 新增色彩 token、星空／天空背景樣式、section/hero/卡片樣式、文章內文樣式、更新 `--pf-*` 配色
- `src/layouts/BaseLayout.astro` — nav 與背景套用新樣式 class
- `src/pages/index.astro` — hero 與 section 套用新樣式 class
- `src/pages/blog/index.astro` — 文章列表套用 section/row 樣式
- `src/pages/blog/[...slug].astro` — 移除無效的 `prose` class，套用新的文章內文樣式

## 驗證方式

延續上次修 Pagefind bug 時的作法：用 Playwright 在淺色／深色模式下分別截圖檢查首頁、文章列表、文章內頁、搜尋框，確認配色一致且文字可讀（無黑字疊深色背景之類的對比問題）。
