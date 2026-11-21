// 영상 편집 05 카드 그림: 사람의 작업 순서 아홉 단계로 타임라인이 하나씩 채워짐.
// (첫 장면이던 '한 번에 편집해 줘 · AI 티가 남'은 뺌 — 사용자 11-22: "가독성도 없고 그 페이지가 필요 없어 보여". CSS 의 단계 번호 p1~p10 은 그대로 쓰려고 base: 1)
// 사용자 11-15 "아무것도 없는 카드는 채워 줘 · 시각적으로 표현 가능한 건 전부 그렇게". 도식이며 숫자(20~30분)는 기록 그대로.
// techart.js 가 window.TG_BUILD 를 읽어 돌린다(이 파일을 techart.js 보다 먼저 불러야 함).
(function () {
  var NAMES = ["영상 분석", "자료 조사", "이야기 대본", "목소리 만들고 고르기", "컷 편집", "자료 배치", "자막", "배치 타이밍 맞추기", "내용 확인"];
  var CIRC = "①②③④⑤⑥⑦⑧⑨";
  // 목소리 문장 다섯 덩이(%): 자료 · 자막 · 컷 위치가 모두 여기에 맞춰진다
  var PH = [[4, 20], [24, 41], [45, 59], [63, 78], [81, 96]];
  var MC = [["#ffd59a", "#ff9f6b"], ["#9fe6ff", "#5bb6ff"], ["#d6b8ff", "#9b7bff"], ["#a8f2cf", "#5fd3a0"], ["#ffc0d0", "#ff7fa3"]];
  var OFF = [-3, 4, -4, 3, -3];   // ⑥ 자료를 처음 놓은 자리(덩이 시작에서 어긋남) → ⑧ 에서 덩이 시작으로 맞춤
  function seeded(n) { var x = Math.sin(n * 78.233) * 43758.5453; return x - Math.floor(x); }
  function lane(label, inner) { return "<div class='o-row'><u>" + label + "</u><div class='o-lane'>" + inner + "</div></div>"; }
  function html() {
    var dots = "<div class='o-dots'>" + NAMES.map(function (n, k) { return "<b>" + (k + 1) + "</b>"; }).join("") + "</div>";
    // 사람의 순서로 쌓이는 판(p1~)
    var cuts = [22, 43, 61, 80].map(function (x, k) { return "<s class='o-cut' style='left:" + x + "%;--i:" + k + "'></s>"; }).join("");
    var buildV = "<i class='o-v'></i><i class='o-scan'></i>" + cuts;
    var buildM = PH.map(function (p, k) {
      var w = Math.round((p[1] - p[0]) * 0.62);
      return "<i class='o-m' style='--l0:" + (p[0] + OFF[k]) + "%;--l1:" + p[0] + "%;width:" + w + "%;--c1:" + MC[k][0] + ";--c2:" + MC[k][1] + ";--i:" + k + "'></i>";
    }).join("");
    var buildA = PH.map(function (p, k) {
      var bars = ""; for (var j = 0; j < 9; j++) bars += "<i style='height:" + (30 + 66 * seeded(k * 9 + j)).toFixed(0) + "%'></i>";
      return "<span class='o-ph' style='left:" + p[0] + "%;width:" + (p[1] - p[0]) + "%;--i:" + k + "'>" + bars + "</span>";
    }).join("");
    var buildS = PH.map(function (p, k) { return "<i class='o-s' style='left:" + p[0] + "%;width:" + (p[1] - p[0] - 1) + "%;--i:" + k + "'></i>"; }).join("");
    var guides = "<div class='o-guide'>" + PH.map(function (p) { return "<s style='left:" + p[0] + "%'></s>"; }).join("") + "</div>";
    return dots + "<div class='o-tl'>" + guides +
      lane("영상", buildV) + lane("자료", buildM) + lane("목소리", buildA) + lane("자막", buildS) +
      "</div><b class='o-done'></b>";
  }
  var steps = NAMES.map(function (n, k) { return CIRC[k] + " " + n; }).concat(["디테일을 다 챙기고도, 한 편 20~30분"]);
  var times = [1100, 1000, 1000, 1100, 1100, 1100, 1000, 1300, 1200, 3000];
  window.TG_BUILD = window.TG_BUILD || {};
  window.TG_BUILD.order = { steps: steps, times: times, html: html, base: 1 };
})();
