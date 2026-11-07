# 怎麼新增一篇 Devlog

流程：**總管每週寫草稿 → 使用者看過點頭 → 才發佈**。草稿（`draft: true`）在本機看得到，build 不會輸出，push 上去也不會出現在網站上。

## 1. 建檔

在 `src/content/devlog/` 新增 `YYYY-MM-DD-英文短名.md`（檔名就是網址：`/devlog/YYYY-MM-DD-英文短名/`）。

```md
---
title: 這週的標題
date: 2026-11-14          # 這篇寫到哪一天
period: 11/8 – 11/14      # 涵蓋期間，可省略
summary: 列表和文章開頭的一兩句摘要。
cover: /media/2026-11-14-英文短名/cover.webp   # 可省略，沒有就用日期排版
coverAlt: 封面圖在畫什麼
draft: true               # 使用者點頭前一律 true
---

內文用 Markdown。小標用 `##`、`###`。
```

寫法：

- **每篇內文 500 字以內**（不算標題、摘要、圖說）。標題 12 字以內。
- 第一句就講這段時間最重要的一件事，口吻像跟朋友聊開發，不是工作報告。
- 只挑 2～3 件最有意思的事好好講，其他砍掉或最後一句帶過。踩坑最多一個，講成小故事：發生什麼、為什麼、之後怎麼做。
- 少用條列、多用短段落；不堆功能清單和技術名詞，玩家看不懂的就換白話或刪掉。數字只留一兩個。句子短，不要翻譯腔。
- 圖片和影片每篇 2～4 個，挑最好的。
- 寫「當時做了什麼」，是歷史紀錄，不是現況。數值和玩法之後會變，不用寫太細。
- 照實寫用 AI 開發：使用者定需求、做決定、驗收，AI 代理實作。可以寫踩過的坑。
- 不確定的事少寫，不要編。材料看遊戲倉庫的 `git log`、還沒 commit 的改動、各 session 的驗收截圖和筆記。

## 2. 圖片和影片

檔案放 `public/media/<檔名>/`，只放 `.webp`（圖）和 `.mp4`（短片）。

**每張截圖都要先打開看過。** 有露出桌面、檔案總管、終端機、路徑、工作列、視窗標題列、帳號、硬體或電腦名稱的，裁掉或遮掉；裁不乾淨就不用。

壓檔（ffmpeg）：

```sh
# 圖：最寬 1600、WebP 品質 80
ffmpeg -i 原圖.png -vf "scale='min(1600,iw)':-2" -c:v libwebp -quality 80 cover.webp

# 裁切：crop=寬:高:左上x:左上y
ffmpeg -i 原圖.png -vf "crop=1480:748:48:34" -c:v libwebp -quality 80 out.webp

# 短片：拿掉聲音和中繼資料，一支盡量 5 MB 以內（太大就把 crf 調高）
ffmpeg -i 原片.mp4 -an -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -map_metadata -1 clip.mp4

# 影片封面（第 3 秒那格）
ffmpeg -ss 3 -i clip.mp4 -frames:v 1 -c:v libwebp -quality 78 clip-poster.webp
```

文章裡的寫法：

```md
![替代文字（給看不到圖的人）](/media/2026-11-14-英文短名/xxx.webp "圖說，會顯示在圖片下面")

<div class="media-video">
  <video src="/media/2026-11-14-英文短名/clip.mp4" poster="/media/2026-11-14-英文短名/clip-poster.webp" muted loop playsinline preload="none" aria-label="影片在拍什麼"></video>
</div>

<div data-youtube="" data-title="長片的說明"></div>
```

- 單獨一行的圖會自動變成有圖說的大圖，寬高自動補上。
- 長片傳 YouTube，把影片 ID（網址 `watch?v=` 後面那串）填進 `data-youtube`。ID 是空的時候，`npm run dev` 會顯示佔位框，正式 build 會自動拿掉。

## 3. 本機預覽

```sh
npm install          # 第一次
npm run dev          # 邊寫邊看，草稿也看得到：http://localhost:4321/
npm run build        # 正式輸出到 dist/（不含草稿）
npm run preview      # 看正式輸出
```

手機寬也要看一次，不能橫向捲動。

## 4. 隱私自查

```sh
npm run build && npm run check-privacy
```

會掃原始碼和 `dist/`：Windows 路徑、使用者資料夾、email、金鑰字樣、Karylcode 以外的 GitHub 帳號。找到就列出來，GitHub Actions 也會因此停下不部署。

裝置名稱、電腦名稱、私人資料夾名稱這些「具體的字」不能寫進公開的腳本，放在本機的 `.privacy-words.local.txt`（一行一個，已在 `.gitignore`），腳本會一起掃。換電腦時要自己帶過去。

另外人工再確認一次，這些都不能放：

- 私人倉庫的程式碼或檔案內容（用文字描述做法可以，不貼程式碼）
- 金鑰、電腦路徑、帳號、email
- 裝置名稱、電腦名稱
- 別人的名字、使用者的真名
- 試玩下載連結

## 5. 發佈

使用者點頭之後：

1. 把 `draft: true` 改成 `draft: false`。
2. `npm run build && npm run check-privacy` 通過。
3. commit、push 到 `main`。`.github/workflows/deploy.yml` 會自動 build 並部署到 https://karylcode.github.io 。

倉庫 `Karylcode/karylcode.github.io`（公開），Pages 的 Source 是「GitHub Actions」。commit 的 email 用 GitHub 的隱藏信箱（這個倉庫的 `git config user.email` 已設好），不要用私人信箱。

`_review/` 是給人看截圖和全文用的，已經在 `.gitignore`，不會 push 也不會部署。
