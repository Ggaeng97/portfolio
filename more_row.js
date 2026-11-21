// 단계 머리의 '자세히 보기' 줄(.st-more-row)을 번호(01)의 왼쪽 끝에 맞춘다(사용자 11-15 밤 "좌측으로 빼든 잘 보이게").
// 넓은 화면에서는 번호가 글 칸 왼쪽 바깥에 걸려 있어(w-story.css .st-no position:absolute) 그만큼 줄을 왼쪽으로 내어 쓴다.
// 번호 크기가 화면 폭에 따라 달라서 재서 맞춤. 휴대폰처럼 번호가 제자리(static)면 내어 쓰지 않는다.
(function () {
  function fit() {
    document.querySelectorAll(".st-sum > .st-more-row").forEach(function (row) {
      var no = row.parentNode.querySelector(".st-title .st-no");
      row.style.marginLeft = "";
      if (!no || getComputedStyle(no).position !== "absolute") return;
      row.style.marginLeft = Math.round(no.getBoundingClientRect().left - row.getBoundingClientRect().left) + "px";
    });
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);   // 글꼴이 늦게 들어와 번호 폭이 바뀌는 경우
})();
