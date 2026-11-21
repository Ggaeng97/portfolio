// 목차: 늘 펼쳐져 있다(누를 필요 없음).
//  - 넓은 화면: 왼쪽 목차. 분야 묶음(.track[data-track])이 굵은 제목, 그 안 구역([data-toc])이 아래 줄.
//    선 하나에 지금까지 읽은 만큼 차오른다.
//  - 좁은 화면: 위쪽 줄에 소개 + 분야 이름만(옆으로 밀면 나머지)
// 분야 순서를 바꾸면(picker.js 'tracks-reordered') 목차도 다시 만든다.
// 채울 것(점선 글) 켜고 끄는 글자 버튼은 위쪽 줄 오른쪽(기본은 숨김).
(function () {
  var rail = document.createElement("aside");
  rail.className = "rail";
  rail.innerHTML = "<a class='rail-name' href='#top'>이경환</a><ol></ol>";
  document.body.appendChild(rail);
  var ol = rail.querySelector("ol");
  var nav = document.querySelector(".bar nav");
  var links = [], io = null;

  function build() {
    var marks = Array.prototype.slice.call(document.querySelectorAll("[data-track], [data-toc]"));
    ol.innerHTML = "<i class='rail-fill'></i>";
    nav.innerHTML = "";
    marks.forEach(function (s) {
      var group = s.hasAttribute("data-track");
      var inner = !group && s.closest("[data-track]");
      var name = group ? s.dataset.track : s.dataset.toc;
      ol.insertAdjacentHTML("beforeend", "<li class='" + (group ? "grp" : inner ? "sub" : "") + "'><a href='#" + s.id + "'><span class='rl-t'>" + name + "</span></a></li>");
      if (!inner) nav.insertAdjacentHTML("beforeend", "<a href='#" + s.id + "'>" + name + "</a>");
    });
    links = Array.prototype.slice.call(document.querySelectorAll(".rail ol a, .bar nav a"));
    if (io) io.disconnect();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) mark(e.target); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    marks.forEach(function (s) { if (!s.hasAttribute("data-track")) io.observe(s); });
    prog();
  }
  function mark(sec) {
    var ids = ["#" + sec.id];
    var tr = sec.closest("[data-track]");
    if (tr) ids.push("#" + tr.id);
    links.forEach(function (a) {
      var on = ids.indexOf(a.getAttribute("href")) >= 0;
      a.classList.toggle("on", on);
      // 위쪽 목차 줄은 지금 항목이 줄 밖으로 나갔을 때만 옆으로 맞춘다(괜히 좌우로 움직이지 않게)
      if (on && a.parentElement === nav) {
        var l = a.offsetLeft - nav.offsetLeft, r = l + a.offsetWidth;
        if (l < nav.scrollLeft || r > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = l - 16;
      }
    });
  }
  // 채움: 첫 점에서 마지막 점까지 이어진 긴 줄 위에서, 지금 읽는 단계와 다음 단계 사이를 실제로 읽은 만큼(단계 사이 거리로 나눠) 차오른다
  function prog() {
    var fill = ol.querySelector(".rail-fill"), lis = ol.querySelectorAll("li");
    if (!fill || lis.length < 2) return;
    var y = function (li) { return li.offsetTop + 9; }, a = y(lis[0]), b = y(lis[lis.length - 1]);
    ol.style.setProperty("--rl-a", a + "px"); ol.style.setProperty("--rl-b", b + "px");
    var secs = Array.prototype.map.call(lis, function (li) { var s = document.querySelector(li.firstChild.getAttribute("href")); return s ? s.getBoundingClientRect().top + window.scrollY : 0; });
    var at = window.scrollY + window.innerHeight * 0.4, v = 0;
    for (var i = 0; i < secs.length - 1; i++) {
      if (at >= secs[i + 1]) continue;
      v = at < secs[i] ? (i ? i : 0) : i + (at - secs[i]) / Math.max(1, secs[i + 1] - secs[i]);
      break;
    }
    if (at >= secs[secs.length - 1]) v = secs.length - 1;
    fill.style.height = Math.max(0, (y(lis[0]) + (b - a) * v / (lis.length - 1)) - a).toFixed(1) + "px";
  }
  window.addEventListener("scroll", prog, { passive: true });
  window.addEventListener("resize", prog);
  // 크레파스 질감: 가장자리를 살짝 흔들고(변위) 흰 틈을 군데군데(잡음으로 투명 구멍) — 줄 · 채움이 같이 쓴다
  var cr = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  cr.setAttribute("width", "0"); cr.setAttribute("height", "0"); cr.setAttribute("aria-hidden", "true"); cr.style.position = "absolute";
  cr.innerHTML = '<filter id="crayon" x="-80%" y="-1%" width="260%" height="102%"><feTurbulence type="fractalNoise" baseFrequency="0.8 0.12" numOctaves="2" seed="5" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="1.3 0.55" numOctaves="3" seed="9" result="g"/>' +
    '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -3.2 2.25" result="holes"/>' +
    '<feComposite in="d" in2="holes" operator="in"/></filter>' +
    // 같은 질감, 방향 없는 것(펜 동그라미 · ✓ · 화살표 · 줄 긋기 — crayon.css)
    '<filter id="crayon-i" x="-15%" y="-40%" width="130%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="5" result="n"/>' +
    '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="9" result="g"/>' +
    '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.95" result="holes"/>' +   // 가는 펜 선은 틈을 덜(진행 줄보다 순하게)
    '<feComposite in="d" in2="holes" operator="in"/></filter>';
  document.body.appendChild(cr);
  document.addEventListener("tracks-reordered", build);
  build();

  var todos = document.querySelectorAll(".todo").length;
  if (todos) document.body.classList.add("hide-todo");
  // 위쪽 줄의 '채울 것 보기' 글자 단추는 주소에 ?todo 를 붙였을 때만(사용자 11-14: 얇은 회색 글 빼기)
  if (todos && /[?&]todo\b/.test(location.search)) {
    var t = document.createElement("button");
    t.className = "todo-toggle";
    t.type = "button";
    t.textContent = "채울 것 " + todos + "개 보기";
    t.onclick = function () {
      var hid = document.body.classList.toggle("hide-todo");
      t.textContent = hid ? "채울 것 " + todos + "개 보기" : "채울 것 숨기기";
    };
    document.querySelector(".bar .wrap").appendChild(t);
  }
})();
