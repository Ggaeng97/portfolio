// 성장 이야기 단계(.st)의 '자세히 보기' / '접기': 같은 페이지에서 그 단계의 과정(.st-more)을 펼치고 접는다(사용자 11-15).
// 펼치거나 접으면 'tracks-reordered' 를 보내 배경색(bgtween) · 목차(toc) · 성당 장면이 화면에 보이는 구역만으로 다시 잰다.
// 숨은 과정 안을 가리키는 링크(#cath 등)를 누르면 그 단계를 먼저 펼친다.
// 단추는 하나. 펼치면(사용자 11-15 저녁 "알약이 글을 가린다, 왼쪽에 세로로 붙게 · 대각선 없이 두 단계로") 알약이
// ① 같은 높이에서 화면 왼쪽 끝으로 가며 가는 세로 막대로 줄고 ② 막대가 아래로 내려가 펼친 본문 첫 제목 높이에 붙는다.
// 막대는 본문 밖 왼쪽 끝에서 따라오다가(위쪽 줄 아래에서 멈춤) 과정이 끝나면 함께 올라간다.
// 막대에 마우스를 올리거나 누르면 숨어 있던 [접기]가 옆으로 튀어나온다. 접으면 거꾸로: 제자리 높이로(세로) → 제자리로(가로).
(function () {
  var P = [];   // { more, st, pill, inner, bar, ph(제자리 자리표), btn, busy, pad, sh }
  var EZ = "cubic-bezier(.65, 0, .35, 1)", T1 = 260, T2 = 300;   // ① 가로 ② 세로(ms)
  var BW = 10, BH = 84, BAR = "#0b0c12", BAR_SH = "0 0 0 2px rgba(255, 255, 255, .9), 0 8px 22px rgba(10, 12, 20, .22)";
  function barGap() { return window.innerWidth <= 900 ? 72 : 76; }
  function calm() { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function notify() { document.dispatchEvent(new CustomEvent("tracks-reordered")); window.dispatchEvent(new Event("resize")); }
  function setBox(el, b) { for (var k in b) el.style[k] = b[k]; }
  // 펼친 본문이 시작하는 높이 = 과정 안의 보이는 첫 제목
  function startTop(p) {
    var hs = p.more.querySelectorAll("h2, h3");
    for (var i = 0; i < hs.length; i++) { var r = hs[i].getBoundingClientRect(); if (r.height) return r.top; }
    return p.more.getBoundingClientRect().top;
  }
  function dockTop(p) {
    var t = Math.min(Math.max(barGap() + 16, startTop(p)), window.innerHeight - BH - 24);
    return Math.min(t, p.more.getBoundingClientRect().bottom - BH - 12);
  }
  function place(p) {
    if (p.busy || !p.pill.classList.contains("docked")) return;
    p.pill.style.top = dockTop(p) + "px";
    var s = p.st.getBoundingClientRect();
    p.pill.classList.toggle("away", s.bottom < barGap() || s.top > window.innerHeight);
  }
  function barLook(y) {
    return { left: "0px", top: y + "px", width: BW + "px", height: BH + "px", borderRadius: "0 10px 10px 0", backgroundColor: BAR, padding: "0px", boxShadow: BAR_SH };
  }
  function pillLook(p, r) {
    return { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: r.height / 2 + "px", backgroundColor: "#ffffff", padding: p.pad, boxShadow: p.sh };
  }
  function dock(p, r, instant) {
    var pill = p.pill, cs = getComputedStyle(pill);
    p.pad = cs.padding; p.sh = cs.boxShadow;
    setBox(p.ph, { width: r.width + "px", height: r.height + "px", display: "inline-block" });
    // 떠 있는 동안은 body 바로 아래로 — 단계 안에 두면 그 단계의 쌓임 순서에 갇혀 뒤 장면(05 조립 고정 화면) 아래로 깔렸음
    document.body.appendChild(pill);
    var y1 = r.top + r.height / 2 - BH / 2, fade = null;
    function docked() {
      pill.classList.remove("morph"); pill.classList.add("docked");
      setBox(pill, { left: "", width: "", height: "" });
      p.btn.textContent = "접기";
      if (fade) fade.cancel();
    }
    if (instant) { docked(); p.busy = false; place(p); return; }
    p.busy = true;
    pill.classList.add("morph");
    setBox(pill, { left: "0px", top: y1 + "px", width: BW + "px", height: BH + "px" });
    fade = p.inner.animate([{ opacity: 1 }, { opacity: 0, offset: .4 }, { opacity: 0 }], { duration: T1, fill: "forwards" });
    pill.animate([pillLook(p, r), barLook(y1)], { duration: T1, easing: EZ }).onfinish = function () {   // ① 가로
      docked();
      var y2 = dockTop(p);
      pill.style.top = y2 + "px";
      if (Math.abs(y2 - y1) < 3) { p.busy = false; place(p); return; }
      pill.animate([{ top: y1 + "px" }, { top: y2 + "px" }], { duration: T2, easing: EZ }).onfinish = function () { p.busy = false; place(p); };   // ② 세로
    };
  }
  function restore(p) {   // 막대 → 제자리 알약(애니메이션 없이): 제자리(자리표 바로 뒤)로 되돌림
    p.pill.classList.remove("morph", "docked", "leaving", "pop", "away");
    setBox(p.pill, { left: "", top: "", width: "", height: "" });
    p.ph.parentNode.insertBefore(p.pill, p.ph.nextSibling);
    p.ph.style.display = "none"; p.busy = false;
  }
  function undock(p, d, instant) {
    var pill = p.pill;
    pill.classList.remove("pop", "away"); pill.classList.add("leaving"); p.bar.setAttribute("aria-expanded", "false");
    var ph = p.ph.getBoundingClientRect();
    if (ph.top < barGap() || ph.bottom > window.innerHeight) {   // 제자리가 화면 밖이면 제자리를 막대 높이로 데려옴(접어도 화면이 튀지 않게)
      window.scrollTo({ top: window.scrollY + (ph.top + ph.height / 2) - (d.top + d.height / 2), behavior: "instant" });
      ph = p.ph.getBoundingClientRect();
    }
    function home() { restore(p); }
    function across() {   // ② 가로: 막대가 알약으로 펴지며 제자리로
      var t = p.ph.getBoundingClientRect();
      p.btn.textContent = "자세히 보기";
      pill.classList.remove("docked", "leaving"); pill.classList.add("morph");
      setBox(pill, { left: t.left + "px", top: t.top + "px", width: t.width + "px", height: t.height + "px" });
      p.inner.animate([{ opacity: 0 }, { opacity: 0, offset: .55 }, { opacity: 1 }], { duration: T1 });
      pill.animate([barLook(t.top + t.height / 2 - BH / 2), pillLook(p, t)], { duration: T1, easing: EZ }).onfinish = home;
    }
    if (instant) { p.btn.textContent = "자세히 보기"; home(); return; }
    var yA = ph.top + ph.height / 2 - BH / 2;
    if (Math.abs(yA - d.top) < 3) { across(); return; }
    pill.style.top = yA + "px";
    pill.animate([{ top: d.top + "px" }, { top: yA + "px" }], { duration: T2, easing: EZ }).onfinish = across;   // ① 세로
  }
  // 펼칠 때 한 번에 툭 튀어나와 펼쳐진 줄 모르던 것(사용자 11-15 저녁): 위에서부터 화면 높이만큼 커튼처럼 내려오며 드러남.
  // 배치는 처음부터 다 펼친 그대로라(잘라 보이기만) 다른 스크립트가 재는 위치는 흔들리지 않는다
  function reveal(more) {
    var top = Math.max(0, more.getBoundingClientRect().top), span = Math.round(Math.max(260, window.innerHeight - top));
    more.animate([{ clipPath: "inset(0 0 calc(100% - 0px) 0)", opacity: 0 }, { clipPath: "inset(0 0 calc(100% - " + span + "px) 0)", opacity: 1 }],
      { duration: 560, easing: "cubic-bezier(.22, .61, .36, 1)" });
  }
  function toggle(more, open, quiet) {
    var p = P.filter(function (q) { return q.more === more; })[0];
    if (p && p.busy) return;
    var r = p ? p.pill.getBoundingClientRect() : null;   // 펼치기 전 알약 자리 / 접기 전 막대 자리
    if (p) p.busy = true;   // 아래 resize 알림 동안 막대가 다시 놓이지 않게
    more.hidden = !open;
    if (p) p.btn.setAttribute("aria-expanded", open ? "true" : "false");
    notify();
    var instant = quiet || calm();
    if (open && !instant) reveal(more);
    if (!p) return;
    if (open) dock(p, r, instant); else undock(p, r, instant);
  }
  document.querySelectorAll(".st-more").forEach(function (more) {
    var st = more.closest(".st"), no = st.querySelector(".st-no"), name = st.getAttribute("data-toc") || "";
    var btn = st.querySelector('.st-head .st-btn[aria-controls="' + more.id + '"]');
    if (!btn) return;
    var num = no ? no.textContent : "";
    var pill = document.createElement("div"); pill.className = "st-open-pill";
    var bar = document.createElement("button"); bar.type = "button"; bar.className = "sp-bar";
    bar.setAttribute("aria-label", (num + " " + name).trim() + " · 접기 단추 보기"); bar.setAttribute("aria-expanded", "false");
    var inner = document.createElement("div"); inner.className = "sp-in";
    btn.parentNode.insertBefore(pill, btn);
    pill.appendChild(bar); pill.appendChild(inner); inner.appendChild(btn);
    inner.insertAdjacentHTML("beforeend", "<span><b>" + num + "</b> " + name + "</span>");
    var ph = document.createElement("div"); ph.className = "st-pill-ph"; ph.style.display = "none";
    pill.parentNode.insertBefore(ph, pill);
    var p = { more: more, st: st, pill: pill, inner: inner, bar: bar, ph: ph, btn: btn, busy: false };
    P.push(p);
    btn.addEventListener("click", function () { toggle(more, more.hidden, false); });
    bar.addEventListener("click", function () { var on = pill.classList.toggle("pop"); bar.setAttribute("aria-expanded", on ? "true" : "false"); p.popY = window.scrollY; });
  });
  document.addEventListener("click", function (e) {   // 막대 밖을 누르면 튀어나온 [접기]를 다시 숨김
    P.forEach(function (p) {
      if (p.pill.classList.contains("pop") && !p.pill.contains(e.target)) { p.pill.classList.remove("pop"); p.bar.setAttribute("aria-expanded", "false"); }
    });
  });
  // 튀어나온 [접기]는 160px 넘게 스크롤하면 저절로 다시 접힘(사용자 11-15 저녁 — 펼친 채 글을 가리지 않게)
  function fold(p) { p.pill.classList.remove("pop"); p.bar.setAttribute("aria-expanded", "false"); }
  function follow() {
    P.forEach(function (p) {
      if (p.more.hidden) return;
      if (p.pill.classList.contains("pop") && Math.abs(window.scrollY - p.popY) > 160) fold(p);
      place(p);
    });
  }
  window.addEventListener("scroll", follow, { passive: true });
  window.addEventListener("resize", follow);
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var t = document.querySelector(a.getAttribute("href"));
    var more = t && t.closest(".st-more");
    if (more && more.hidden) toggle(more, true, true);
  }, true);
  window.StoryAPI = { items: P, restore: restore, notify: notify };   // 지나온 과정 저절로 접기(story_fold.js)가 씀
  window.StoryOpen = function (id) { var m = document.getElementById(id); if (m && m.hidden) toggle(m, true, true); };   // 점검용
})();
