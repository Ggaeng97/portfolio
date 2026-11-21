// 그림 칸: img 폴더에 정해진 이름의 파일이 있으면 그 그림을, 없으면 "이미지 필요" 칸을 보여 준다.
// 파일을 넣고 새로고침만 하면 된다. 확장자는 png → jpg → jpeg → webp 순서로 찾는다.
// 그림이 들어오면 칸에 "slotloaded" 신호를 보낸다(compare.js 가 받는다).
(function () {
  var EXT = ["png", "jpg", "jpeg", "webp"];

  function placeholder(fig, id, need, base) {
    var box = document.createElement("div");
    box.className = "ph";
    box.innerHTML = "<b>이미지 필요 · " + id + "</b><span></span><code></code>";
    box.querySelector("span").textContent = need;
    box.querySelector("code").textContent = "img/" + base + ".png (또는 .jpg)";
    fig.insertBefore(box, fig.firstChild);
  }

  function tryLoad(fig, i) {
    var base = fig.dataset.file;
    if (i >= EXT.length) { placeholder(fig, fig.dataset.id, fig.dataset.need, base); return; }
    var img = new Image();
    img.alt = fig.dataset.need;
    img.onload = function () {
      fig.insertBefore(img, fig.firstChild);
      fig.classList.add("has");
      fig.dispatchEvent(new CustomEvent("slotloaded", { bubbles: true }));
    };
    img.onerror = function () { tryLoad(fig, i + 1); };
    img.src = "img/" + base + "." + EXT[i];
  }

  document.querySelectorAll("figure.slot").forEach(function (fig) { tryLoad(fig, 0); });
})();
