// 첫 화면 인트로: 블렌더가 칸 단위로 렌더하듯 최종 렌더가 가운데부터 그려지고, 다 그려지면 한 줄이 뜬 뒤 사라진다.
// 페이지를 열 때마다 나온다(그동안 페이지는 스크롤되지 않음). 건너뛰기 버튼은 두지 않는다(사용자 11-13).
// 문구가 뜬 뒤엔 저절로 넘어가지 않고, 다 읽고 휠·터치·키로 내릴 때 넘어간다(사용자 11-13: 팝업이 너무 빨리 뜸). 칸이 채워지는 중에 내리면 칸만 다 채우고 문구를 보여 줌.
// 끝나면: 고르기 팝업이 이어서 뜰 예정이면(window.__pickPending) 오프닝 화면을 그대로 둔 채 그 위에 팝업이 뜨고, 팝업이 닫힐 때 같이 걷힌다.
// 첫 화면의 '오프닝 다시 보기'로 다시 볼 수 있다(이때는 팝업 없이 끝나면 걷힘).
// (사용자 11-15 저녁 "오프닝 → 첫 화면이 다른 페이지처럼 점프컷") 마지막 장면 = 첫 화면 문구·칩·그림 크기·밝기 그대로. 그 문구가 다 뜨고
// 그림이 첫 화면과 같아지면 오프닝을 바로 걷고(보이는 변화 없음) 위쪽 줄이 위에서 부드럽게 내려온다. 휠 한 번(관성 포함) = 한 장면,
// 장면이 다 끝나기 전 입력은 넘기지 않고, 위쪽 줄이 다 내려오고 휠이 멈춘 뒤에야 스크롤을 풂(다음 훅으로 드드득 넘어가지 않게).
// 문구는 장면마다 한 줄(LINES): 내릴 때마다 다음 문구로 바뀌고(대화가 이어지듯), 마지막 문구 다음에 고르기 팝업. 소개 글을 압축해 오프닝에 넣음(사용자 11-13).
(function () {
  var KEY = "aigen_intro_seen";
  var LINES = [
    // 표어('지적할 수 있는 눈으로, AI 결과물을 사람 수준까지.')는 오프닝이 끝나고 고르기 팝업 뒤 첫 화면에서 처음 나온다 — 오프닝 첫 문구로 겹쳐 나오지 않게 뺌(사용자 11-14)
    ["영상 편집 일에서 시작해,<br>AI로 일하는 방식을 넓혀 왔습니다.", "반복되는 편집을 자동화하는 도구를 직접 만들었고, 지금은 친구들과의 게임 개발과 3D 모델링까지."],
    ["어디가 왜 틀렸는지 짚고,<br>규칙으로 남깁니다.", "어느 분야든 AI가 처음 만든 결과를 확인할 수 있는 형태로 바꿔 보게 하고, 그 지적을 다음에도 지키는 규칙으로 남깁니다."]
  ];
  function lineHTML(l) { return "<b>" + l[0] + "</b><span>" + l[1] + "</span>"; }
  function heroLine() { var t = document.querySelector("#top .hc-text"), b = t && t.querySelector("b"), sp = t && t.querySelector("span"); return b && sp ? [b.innerHTML, sp.innerHTML] : null; }

  // 오프닝·고르기 팝업이 떠 있는 동안은 페이지 스크롤을 잠근다(html.locked). 팝업이 이어서 뜰 예정이면(window.__pickPending)
  // 오프닝이 닫혀도 잠금을 풀지 않고 팝업이 넘겨받는다(picker.js).
  function lock(on) { document.documentElement.classList.toggle("locked", on); }
  if ("scrollRestoration" in history && !location.hash) { history.scrollRestoration = "manual"; window.scrollTo(0, 0); }

  function play() {
    lock(true);
    document.documentElement.classList.add("bar-wait");   // 위쪽 줄은 마지막에 위에서 내려옴
    var hl = heroLine(), steps = hl ? LINES.concat([hl]) : LINES;
    var box = document.createElement("div");
    box.className = "intro";
    box.innerHTML = '<img src="img/flip/r73.jpg" alt="">' +
      '<div class="intro-tiles"></div><i class="intro-shade"></i>' +
      '<div class="intro-text"><div class="intro-line">' + lineHTML(LINES[0]) + '</div></div>' +
      '<div class="intro-hint">휠을 내려 보십시오<br>↓</div>';
    document.body.appendChild(box);
    // 마지막 장면엔 첫 화면과 같은 칩이 같은 자리에 뜬다 — 누르면 그 장의 요약 팝업(chipmodal.js), 팝업에서 이동하면 오프닝도 걷힘('chip-go')
    var src = document.querySelector("#top .hc-chips");
    if (src) {
      var chips = src.cloneNode(true); box.appendChild(chips);
      chips.addEventListener("click", function (e) {
        var a = e.target.closest("a"); if (!a) return;
        e.preventDefault(); e.stopPropagation();
        if (window.ChipModal && window.ChipModal.open(a.getAttribute("href"), a)) return;
        var go = document.querySelector(a.getAttribute("href"));
        close();
        if (go) setTimeout(function () { window.scrollTo({ top: go.getBoundingClientRect().top + window.scrollY, behavior: "instant" }); }, 30);
      });
    }
    document.addEventListener("chip-go", function () { close(); }, { once: true });
    box.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
    // 터치: 한 번 쓸어 올림 = 한 번(쓸어 올리는 동안 여러 번 넘어가지 않게)
    var ty = null, tacted = false;
    function onTouchStart(e) { ty = e.touches[0].clientY; tacted = false; }
    function onTouchMove(e) { if (ty !== null && !tacted && ty - e.touches[0].clientY > 24) { tacted = true; act(); } }

    var grid = box.querySelector(".intro-tiles"), cols = 12, rows = 7, cells = [];
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var c = document.createElement("i");
        grid.appendChild(c);
        var dx = x - (cols - 1) / 2, dy = (y - (rows - 1) / 2) * 1.6;
        cells.push({ el: c, d: Math.sqrt(dx * dx + dy * dy) + Math.random() * 0.6 });
      }
    }
    cells.sort(function (a, b) { return a.d - b.d; });

    var i = 0, done = false, timers = [], tick = null, readyAt = 0, step = 0, swapping = false;   // readyAt: 이 시각 뒤의 입력부터 '넘어가기'(문구가 뜬 직후 휠 관성으로 바로 넘어가지 않게)
    function showTitle() {
      clearInterval(tick); timers.forEach(clearTimeout); timers = [];
      cells.forEach(function (c) { c.el.className = "done"; });
      box.classList.add("titled");
      readyAt = performance.now() + 1100;
      timers.push(setTimeout(function () { box.classList.add("ready"); }, 1100));
    }
    // 내리기·누르기: 칸이 채워지는 중이면 문구까지만, 문구를 읽을 시간이 지났으면 넘어감
    // 넘어갈 때도 바로 띄우지 않고 0.7초 멈춘 뒤(실수로 눌러 굴러간 것일 수 있어서 — 사용자 11-13). 그동안 안내가 사라짐
    var leaving = 0;
    function act() {
      // 칩 팝업이 떠 있거나 막 닫힌 직후의 휠·키는 오프닝을 넘기지 않음
      if (document.documentElement.classList.contains("cm-open") || performance.now() - (window.__cmClosedAt || -1e9) < 400) return;
      if (!readyAt) { showTitle(); return; }
      if (performance.now() < readyAt || leaving || swapping) return;
      if (step < steps.length - 1) { next(); return; }
      if (hl) return;   // 마지막(첫 화면 문구)은 다 뜨면 저절로 걷힘(settle)
      box.classList.add("leaving");
      leaving = setTimeout(close, 700);
    }
    // 다음 문구: 지금 문구가 위로 사라지고 새 문구가 아래에서 떠오름. 배경 그림은 장면마다 조금씩 다가가며 어두워짐(--k)
    function next() {
      step++; swapping = true; box.classList.remove("ready");
      var ln = box.querySelector(".intro-line"); ln.classList.add("gone");
      box.style.setProperty("--k", step);   // 마지막 장면(--k 2) = 첫 화면 그림과 같은 크기 1.08 · 밝기 .76
      var last = step === steps.length - 1;
      if (last && hl) {   // 그늘도 첫 화면 것으로 바뀌기 시작(1.2초)
        // 첫 화면은 위쪽 줄(테두리 포함 높이) 아래에서 시작해 화면 아래끝과 몇 px 어긋날 수 있음 — 그만큼 글 · 칩을 옮겨 정확히 포갬
        var hc = document.querySelector(".hcath"), dy = hc ? Math.round(hc.getBoundingClientRect().bottom - window.innerHeight) : 0;
        box.style.setProperty("--hero-dy", dy + "px"); box.classList.add("hero");
      }
      timers.push(setTimeout(function () {
        ln.innerHTML = lineHTML(steps[step]);
        ln.classList.add("enter"); ln.classList.remove("gone"); void ln.offsetWidth; ln.classList.remove("enter");
        swapping = false; readyAt = performance.now() + 1100;
        if (last) box.classList.add("chips");
        if (last && hl) { timers.push(setTimeout(settle, 800)); return; }   // 문구 · 칩 · 그림이 다 바뀐 뒤(그림 1.1초 · 칩 1.2초)
        timers.push(setTimeout(function () { box.classList.add("ready"); }, 1100));
      }, 450));
    }
    // 휠: 한 번 굴림(관성으로 이어지는 휠 포함) = 한 번. 새로 굴렸다고 보는 때 = 0.2초 넘게 쉬었다가, 또는 줄어들던 휠이 다시 세짐(관성은 줄기만 함).
    // 예전엔 0.26초 쉬어야만 새 입력이라, 트랙패드 관성 끝에 바로 다시 쓸면 계속 같은 굴림으로 보여 넘어가지 않았음(사용자 11-15 밤 "스크롤해도 안 움직여")
    var lastWheel = 0, lastDy = 0;
    function onWheel(e) {
      var now = performance.now(), dy = Math.abs(e.deltaY), push = now - lastWheel > 200 || dy > lastDy + 3;
      lastWheel = now; lastDy = dy;
      if (e.deltaY > 0 && push) act();   // 장면이 아직 끝나지 않았으면 act 가 넘기지 않음(readyAt)
    }
    // 마지막 장면이 첫 화면과 똑같아졌으면 오프닝을 바로 걷고(보이는 변화 없음) 위쪽 줄이 위에서 내려옴
    function settle() {
      if (done) return;
      if (window.scrollY > 2) { close(); return; }   // 다시 보기 등으로 첫 화면이 바로 아래에 없으면 예전처럼 흐려지며 걷힘
      done = true; timers.forEach(clearTimeout); clearInterval(tick);
      box.remove();
      document.documentElement.classList.remove("bar-wait");
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      // 앞 장면들과 같은 박자(넘긴 뒤 약 1.5초)에 스크롤을 풂 — 예전엔 휠이 멈출 때까지 기다려, 계속 굴리면 오래 잠겨 있었음(사용자 11-15 밤).
      // 넘길 때 쓸었던 휠의 남은 관성은 페이지를 굴리지 않고, 새로 굴릴 때(잠깐 쉬었다가 · 다시 세게)부터 내려감
      setTimeout(function () {
        unbind(); lock(false);
        var lw = lastWheel, ld = lastDy;
        function guard(e) {
          var now = performance.now(), dy = Math.abs(e.deltaY), push = now - lw > 200 || dy > ld + 3;
          lw = now; ld = dy;
          if (push) { window.removeEventListener("wheel", guard, { passive: false }); return; }
          e.preventDefault();
        }
        window.addEventListener("wheel", guard, { passive: false });
        setTimeout(function () { window.removeEventListener("wheel", guard, { passive: false }); }, 8000);   // 혹시 몰라 둔 마지막 안전장치(보통은 새로 굴릴 때 풀림)
        document.dispatchEvent(new CustomEvent("intro-done"));
      }, 300);
    }
    function unbind() {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      box.removeEventListener("touchstart", onTouchStart);
      box.removeEventListener("touchmove", onTouchMove);
    }
    function close() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      clearInterval(tick);
      // 고르기 팝업이 이어서 뜨면 오프닝 화면은 남겨 두고(다 그려진 그림·문구 그대로) 팝업이 닫힐 때 걷는다
      function away(now) { if (now) box.remove(); else { box.classList.add("out"); setTimeout(function () { box.remove(); }, 800); } }
      if (window.__pickPending) {
        cells.forEach(function (c) { c.el.className = "done"; });
        box.classList.add("titled");
        document.addEventListener("pick-close", function (e) { away(e.detail && e.detail.solid); }, { once: true });
      } else away(false);
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      document.documentElement.classList.remove("bar-wait");
      unbind();
      if (!window.__pickPending) lock(false);
      // 오프닝이 끝났음을 알림(무엇부터 볼지 팝업이 받는다)
      document.dispatchEvent(new CustomEvent("intro-done"));
    }
    function onKey(e) { if (["Escape", " ", "Enter", "ArrowDown", "PageDown"].indexOf(e.key) >= 0) act(); }

    tick = setInterval(function () {
      for (var k = 0; k < 2 && i < cells.length; k++, i++) {
        (function (cell) {
          cell.el.className = "on";
          timers.push(setTimeout(function () { cell.el.className = "done"; }, 240));
        })(cells[i]);
      }
      if (i >= cells.length) { clearInterval(tick); timers.push(setTimeout(showTitle, 300)); }
    }, 34);

    box.addEventListener("click", act);
    box.addEventListener("touchstart", onTouchStart, { passive: true });
    box.addEventListener("touchmove", onTouchMove);
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
  }

  play();
  var again = document.getElementById("introAgain");
  if (again) again.addEventListener("click", play);
})();
