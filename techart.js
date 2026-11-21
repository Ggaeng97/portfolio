// 영상 편집 장의 기술 그림(바르코 카드 결, 사용자 11-15 "파형 · 숨소리 같은 기술적인 걸 모션그래픽으로 알기 쉽고 재미있게, 카드 방식으로").
// <div class="tg" data-tg="ng|asr9|breath"> 를 채우고, 단계(p0 → p1 → …)를 차례로 바꿔 끼워 CSS 가 움직이게 한다.
// 화면에 보일 때만 돌고(IntersectionObserver), 벗어나면 멈춘다. 그림은 원리를 보여 주는 도식이고 숫자는 기록 그대로.
(function () {
  function seeded(n) { var x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); }
  function bars(n, from, h) {   // 막대 n개(높이 %), h(k) 로 높이를 바꿀 수 있음
    var s = "";
    for (var k = 0; k < n; k++) {
      var v = h ? h(k) : 22 + 70 * Math.abs(Math.sin((k + from) * 0.41) * 0.6 + (seeded(k + from) - 0.5) * 0.8);
      s += "<i data-k='" + k + "' style='height:" + Math.min(96, v).toFixed(0) + "%'></i>";
    }
    return s;
  }
  var BUILD = {
    // NG: 신호어로 찾은 NG → 호흡 · 되풀이 규칙으로 찾은 NG → 잘라 내 당김
    ng: {
      // 11-21 사용자: 되풀이 · 더듬음이 한꺼번에 뜨지 않게 장면을 나눔(① 신호어 → ② 되풀이 → ③ 더듬음 → ④ 잘라 냄), 이름표는 알약 대신 글자만 + 그 글자를 빨간 줄로 찍(css/marks.css)
      steps: ["말한 그대로의 파형", "① '다시 할게요' — 신호어로 찾기", "② 되풀이 — 호흡 같은 규칙으로", "③ 더듬음 — 같은 규칙으로", "④ 잘라 내고 당기기, NG 17곳 모두"],
      times: [1300, 2000, 2000, 2000, 2600],
      html: function () {
        var spans = { a: [9, 14], b: [24, 28], c: [37, 40] };
        var s = "<div class='tg-wave'>" + bars(48, 3).replace(/data-k='(\d+)'/g, function (m, k) {
          k = +k; var c = k >= spans.a[0] && k <= spans.a[1] ? "a" : k >= spans.b[0] && k <= spans.b[1] ? "b" : k >= spans.c[0] && k <= spans.c[1] ? "c" : "";
          return c ? "class='ng " + c + "'" : "";
        }) + "<s></s></div>";
        return s + "<b class='tg-tag ta'>신호어</b><b class='tg-tag tb'>되풀이</b><b class='tg-tag tc'>더듬음</b>";   // 셋 다 NG 의 종류로(11-21 사용자: '다시 할게요'가 다른 이름표와 안 어울림)
      }
    },
    // 위스퍼: 듣는 구간이 9초를 넘으면 되풀이한 말을 하나로 합침 → 짧게 끊어 처음부터
    asr9: {
      steps: ["한 번에 5초씩 들려주면, 되풀이가 그대로", "9초까지는, 그대로", "13초씩 들려주면, 되풀이를 하나로 합쳐 버림", "AI는 모델 한계라 했지만, 짧게 나눠 받아쓰고 합쳐 정답 227자 중 225자"],
      times: [1900, 1700, 2400, 2800],
      html: function () {
        return "<div class='tg-strip'><span>앞으로</span><span class='r1'>상승하던…</span><span class='r2'>앞으로</span><span>상승을</span><span>하던</span></div>" +
          "<div class='tg-win'><b></b></div><i class='tg-seg s1'></i><i class='tg-seg s2'></i><i class='tg-seg s3'></i>" +
          "<div class='tg-out'><u>받아쓴 글</u><p><span class='o1'>앞으로 상승하던…</span> 앞으로 상승을 하던</p></div>";
      }
    },
    // 숨소리: 위스퍼는 빈 답을 못 내 숨소리에 '아멘' → 말소리 기준 아래면 묻지 않게
    breath: {
      steps: ["말소리는 그대로 받아쓰고", "숨소리까지 받아쓰게 하면, '아멘'을 지어냄", "말소리보다 작은 소리는 받아쓰기에서 빼기, 16곳 중 15곳 해결"],
      times: [1800, 2200, 3200],
      html: function () {
        var h = function (k) { return k >= 15 && k <= 20 ? 10 + 8 * seeded(k) : 30 + 62 * Math.abs(Math.sin(k * 0.5) * 0.6 + (seeded(k) - 0.5) * 0.7); };
        var w = bars(36, 0, h).replace(/data-k='(\d+)'/g, function (m, k) { return +k >= 15 && +k <= 20 ? "class='br'" : ""; });
        return "<div class='tg-words'><span class='w1'>자 클로봇의</span><span class='w2'>주주님들 반갑습니다</span></div>" +
          "<div class='tg-wave'>" + w + "<s></s><hr></div><b class='tg-bub'><span class='x'>아멘</span><span class='ok'>빈칸으로 둠</span></b><b class='tg-gate'>말소리 크기</b>";
      }
    }
  };
  // 다른 파일(techart_*.js)이 window.TG_BUILD 에 넣어 둔 그림도 같이 돌린다(파일당 기능 하나)
  var more = window.TG_BUILD || {}; for (var key in more) BUILD[key] = more[key];
  document.querySelectorAll(".tg[data-tg]").forEach(function (el) {
    var b = BUILD[el.dataset.tg]; if (!b) return;
    el.innerHTML = "<div class='tg-stage'>" + b.html() + "</div><div class='tg-step'><i></i><span></span></div>" +
      "<button type='button' class='tg-nav prev' aria-label='이전 장면'>‹</button><button type='button' class='tg-nav next' aria-label='다음 장면'>›</button>";
    var step = el.querySelector(".tg-step span"), dots = el.querySelector(".tg-step i"), n = b.steps.length;
    dots.innerHTML = b.steps.map(function (t, k) { return "<b role='button' tabindex='0' aria-label='" + (k + 1) + "번째 장면'></b>"; }).join("");
    var p = -1, timer = 0, on = false, base = b.base || 0;
    function show(k) {
      p = (k + n) % n;
      // p숫자 = 지금 단계 하나, u숫자 = 지금까지 지난 단계 전부(쌓이는 그림용). base = 장면 번호를 미는 값(첫 장면을 뺀 그림이 CSS 번호를 그대로 쓰게)
      var q = p + base;
      for (var j = 0; j < 12; j++) { el.classList.toggle("p" + j, j === q); el.classList.toggle("u" + j, j <= q); }
      el.classList.toggle("loop", p === 0);
      step.textContent = b.steps[p];
      Array.prototype.forEach.call(dots.children, function (d, j) { d.classList.toggle("on", j === p); });
    }
    function tick() { if (!on) return; show(p + 1); timer = setTimeout(tick, b.times[p]); }
    // 손으로 넘기기(11-21 사용자: "하단 점에 마우스를 올리거나 좌우 버튼으로 다음 장면으로, 이런 유형 전부") — 넘긴 장면에 7초 머문 뒤 다시 저절로
    function nav(k) { show(k); clearTimeout(timer); if (on) timer = setTimeout(tick, Math.max(7000, b.times[p])); }
    Array.prototype.forEach.call(dots.children, function (d, k) {
      d.addEventListener("mouseenter", function () { if (k !== p) nav(k); });
      d.addEventListener("click", function () { nav(k); });
      d.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(k); } });
    });
    el.querySelector(".tg-nav.prev").addEventListener("click", function () { nav(p - 1); });
    el.querySelector(".tg-nav.next").addEventListener("click", function () { nav(p + 1); });
    if (!("IntersectionObserver" in window)) { on = true; tick(); return; }
    new IntersectionObserver(function (es) {
      var vis = es[0].isIntersecting;
      if (vis && !on) { on = true; clearTimeout(timer); p = -1; tick(); }
      else if (!vis && on) { on = false; clearTimeout(timer); }
    }, { threshold: 0.3 }).observe(el);
  });
})();
