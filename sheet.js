// 접촉 시트: 같은 카메라 렌더 전부를 작은 칸으로 한 판에 깐다.
// 화면에 들어오면 빛 표시가 처음부터 끝까지 훑고 지나가며 옆 큰 화면이 따라 바뀐다(한 번).
// 칸에 마우스를 올리면 그 렌더를 크게 본다. '다시 훑기'로 반복.
(function () {
  document.querySelectorAll("[data-sheet]").forEach(function (box) {
    var names = box.dataset.sheet.split(",");
    var grid = box.querySelector(".sheet-grid");
    var big = box.querySelector(".sheet-big img");
    var label = box.querySelector(".sheet-label");
    var cells = [];
    names.forEach(function (n, k) {
      var c = document.createElement("button");
      c.type = "button";
      c.innerHTML = "<img loading='lazy' src='img/flip/" + n + ".jpg' alt='" + n + "'>";
      c.onmouseenter = function () { stop(); show(k); };
      c.onfocus = function () { stop(); show(k); };
      grid.appendChild(c);
      cells.push(c);
    });

    var cur = -1, timer = null;
    function show(k) {
      if (cur >= 0) cells[cur].classList.remove("on");
      cur = k;
      cells[k].classList.add("on");
      cells[k].classList.add("seen");
      big.src = "img/flip/" + names[k] + ".jpg";
      label.textContent = names[k] + "  ·  " + (k + 1) + " / " + names.length;
    }
    function stop() { clearInterval(timer); timer = null; }
    function sweep() {
      stop();
      cells.forEach(function (c) { c.classList.remove("seen"); });
      var k = 0;
      timer = setInterval(function () {
        show(k);
        k += 1;
        if (k >= names.length) stop();
      }, 70);
    }
    show(0);
    var started = false;
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting && !started) { started = true; sweep(); }
    }, { threshold: 0.45 }).observe(box);
    var again = box.querySelector(".sheet-again");
    if (again) again.onclick = sweep;
  });
})();
