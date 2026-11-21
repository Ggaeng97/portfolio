// 첫 화면(성당)과 훅에서는 위쪽 줄(.bar)을 숨긴다(사용자 11-15 밤 "초반 인트로 상단에 저거 안 뜨게 하자").
// 이야기 단계(#story)가 화면 가운데쯤 올라오면 body.in-top 을 떼서 줄이 나타나고(css/w-trim.css), 다시 위로 올라가면 숨는다.
// 훅을 다 보고 첫 화면 · 훅이 걷힌 뒤(body.hook-retired, hookgate.js)에는 늘 보인다.
(function () {
  var body = document.body, story = document.getElementById("story");
  if (!story) return;
  function fit() {
    var hide = !body.classList.contains("hook-retired") && story.getBoundingClientRect().top > window.innerHeight * 0.5;
    body.classList.toggle("in-top", hide);
  }
  fit();
  window.addEventListener("scroll", fit, { passive: true });
  window.addEventListener("resize", fit);
  document.addEventListener("tracks-reordered", fit);
})();
