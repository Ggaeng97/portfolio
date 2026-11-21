// 카드 · 단계 제목의 쉼표 뒤를 한 덩어리로(사용자 11-15 밤: "받아쓰기를, 짧게 / 끊어 듣게"처럼 어중간하게 끊김).
// 쉼표 뒤 부분을 .t2(inline-block, css/w-trim.css)로 감싸, 한 줄에 다 안 들어가면 그 덩어리째 다음 줄로 넘어가게 한다.
// 글자는 그대로라(쉼표 + 띄어쓰기 유지) 제목 글을 읽는 다른 스크립트에는 영향이 없다. 이미 태그가 든 제목은 건드리지 않는다.
(function () {
  document.querySelectorAll(".cs-head h3, .st-title .st-h").forEach(function (h) {
    if (h.children.length) return;
    var t = h.textContent, i = t.indexOf(", ");
    if (i < 0) return;
    var s = document.createElement("span");
    s.className = "t2";
    s.textContent = t.slice(i + 2);
    h.textContent = t.slice(0, i + 2);
    h.appendChild(s);
  });
})();
