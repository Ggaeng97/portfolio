// 훅을 다 보고 지나가면 첫 화면(성당) · 훅을 걷어 내, 위로 굴려도 되돌아가지 않게 한다 — 그때부터 페이지는
// '영상 편집에서 클리커까지, 이렇게 배우며 왔습니다'(#story)에서 시작(사용자 11-15).
// 걷어 낼 때 지금 보이는 화면이 그대로이도록, 없어진 높이만큼 스크롤 자리를 같이 당긴다(훅이 화면 위로 다 올라간 뒤에만).
(function () {
  var hook = document.getElementById("challenge"), story = document.getElementById("story");
  if (!hook || !story) return;
  var gone = false;
  function retire() {
    var before = story.getBoundingClientRect().top;
    document.querySelectorAll(".hcath, #challenge, .hc-back").forEach(function (el) { el.style.display = "none"; });
    document.body.classList.add("hook-retired");
    document.body.dataset.bg0 = "#ffffff";   // 이제 맨 위는 흰 이야기 구역 — 어두운 첫 화면 색에서 섞이지 않게
    var brand = document.querySelector(".bar .brand"); if (brand) brand.setAttribute("href", "#story");
    var after = story.getBoundingClientRect().top;
    window.scrollTo({ top: window.scrollY + (after - before), behavior: "instant" });
    document.dispatchEvent(new CustomEvent("tracks-reordered"));   // 배경색 · 목차가 남은 구역으로 다시 잼
  }
  function check() {
    if (gone || !window.__hk || !window.__hk().done) return;
    if (hook.getBoundingClientRect().bottom <= 0) { gone = true; retire(); window.removeEventListener("scroll", check); }
  }
  window.addEventListener("scroll", check, { passive: true });
})();
