// '18번 → 3번' 그림: 스토리 채널을 고칠 때마다 실패한 판은 실패 사례로, 잘된 판은 좋은 사례로 쌓이고,
// 다음 채널(보겸)은 쌓인 사례를 보고 시작해 3번 만에 닮음. 사용자 11-15 "실패한 건 실패 케이스로, 성공한 건 좋은 사례로 데이터를 쌓아 개선".
// 판 수(18 · 3)는 분석 세션이 센 기록 그대로, 판마다 실패/잘됨의 배치는 도식.
(function () {
  // 판마다 안 된 부분은 실패 사례로, 된 부분은 좋은 사례로 함께 쌓임(사용자 11-15 "좋은 사례가 너무 적어 보여") — 판 칸은 반반, 마지막 판은 닮음(초록)
  function tiles(n, cls) { var s = ""; for (var k = 0; k < n; k++) s += "<i class='" + (k === n - 1 ? "ok" : "mx") + "' style='--i:" + k + "'></i>"; return "<span class='" + cls + "'>" + s + "</span>"; }
  function minis(n, cls) { var s = ""; for (var k = 0; k < n; k++) s += "<i class='" + cls + "' style='--i:" + k + "'></i>"; return s; }
  function html() {
    return "<div class='cs-ln a'><u>스토리 채널</u>" + tiles(18, "cs-t") + "<em>18번 고침</em></div>" +
      "<div class='cs-shelf'><u>쌓인 사례</u><span class='cs-rows'>" +
      "<span class='cs-row'><b class='g'>좋은 사례</b><span class='cs-m'>" + minis(18, "ok") + "</span></span>" +
      "<span class='cs-row'><b class='r'>실패 사례</b><span class='cs-m'>" + minis(17, "ng") + "</span></span></span></div>" +
      "<div class='cs-ln b'><u>보겸 채널</u><b class='cs-arrow'>쌓인 사례를 보고 시작 →</b>" + tiles(3, "cs-t") + "<em>3번 고침</em></div>";
  }
  window.TG_BUILD = window.TG_BUILD || {};
  window.TG_BUILD.cases = {
    steps: ["고칠 때마다, 안 된 부분은 실패 사례로, 된 부분은 좋은 사례로 남김", "다음 편집은, 쌓인 사례를 보고 시작", "18번 들던 수정이, 3번으로"],
    times: [4600, 2900, 3200],
    html: html
  };
})();
