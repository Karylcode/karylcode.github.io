---
title: 一把劍加一把槍
date: 2026-11-02
period: 10/31 – 11/2
summary: 不再三把近戰輪流換，改成單手劍加步槍。先把規則問清楚，再分給幾個 AI 一起做。
cover: /media/2026-11-02-sword-and-rifle/cover.webp
coverAlt: 訓練場裡角色揮劍砍中訓練假人，跳出傷害數字 71
draft: false
---

這幾天方向轉了個彎：不再三把近戰武器輪流換，改成一把單手劍加一把步槍。

動手之前，我先讓 AI 一題一題問我，把每個決定和理由寫成一份計畫。問完定下三條規則：按鍵可以加，但不能多；不准組合鍵；新招式只用動作包裡現成的動作。

照這三條，操作變得很單純。左鍵砍，按住右鍵舉槍，放開回到劍，攻擊到一半也能切。子彈不會自己補，要靠劍砍中敵人來賺，開場是零發。所以一開始得先衝上去砍，劍和槍互相需要。

計畫寫好之後，拆給幾個 AI session 分頭做：玩法、特效、介面、shader 各一條線。

<div class="media-video">
  <video src="/media/2026-11-02-sword-and-rifle/training-run.mp4" poster="/media/2026-11-02-sword-and-rifle/training-run-poster.webp" muted loop playsinline preload="none" aria-label="訓練場實機錄影：劍連招、火焰附魔、步槍"></video>
</div>

槍的模型也是 AI 做的。它寫腳本在 Blender 裡建模，一次出三種造型讓我挑。我選了方塊錯位疊起來的那款，它再出三種變化，我再選一次。舉槍的時候，槍會一塊一塊拼起來。

![步槍特效的十種情況](/media/2026-11-02-sword-and-rifle/rifle-fx.webp "步槍的特效：一般命中、爆擊、打倒、火焰附魔，打到地板還會留下彈孔。")

同時開好幾個 AI session，很快就遇到問題：Unity 編輯器只有一個。有人在裡面按 Play 測試，其他人就不能放新程式進去。後來做了「分身」，也就是專案的複本編輯器。AI 要測試就去分身，排隊輪流用，卡住了會自己重開，我的主編輯器不會被打斷。

11/2 還做了一輪效能優化，原則很簡單：每一格畫面都不做多餘的事。
