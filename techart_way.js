// 'AI와 일하는 방식' 그림: 맡기기만 하는 '해줘' 줄은 지적과 고침이 끝없이 되풀이되고,
// 제 방식은 ① 문제 → ② AI에게 원인을 묻고 → ③ AI의 제안을 비교해 더 나은 쪽을 고르고 → ④ 그 방법까지 학습시키는 고리를 돌아
// 다음 채널에선 요청할 일이 준다(완성까지 요청한 횟수: 학습 전 스토리 채널 18번 → 학습 후 보겸 채널 3번 — 분석 세션이 센 기록, 사용자 11-15 이름). 사용자 11-15 "해줘가 아니라 상호 소통하며 발전".
(function () {
  var NODES = ["문제가 보이면", "AI에게 원인을 묻고", "AI의 제안을 비교해 고르고", "그 방법까지 학습시킴"];
  function html() {
    var a = ""; for (var k = 0; k < 8; k++) a += "<i>" + (k % 2 ? "고침" : "지적") + "</i>";
    var n = NODES.map(function (t, k) {
      var opt = k === 2 ? "<span class='w-opt'><b>안 A</b><b class='pick'>안 B</b><b>안 C</b></span>" : "";
      return "<span class='w-n n" + (k + 1) + "'><em>" + (k + 1) + "</em>" + t + opt + "</span>" + (k < 3 ? "<s>→</s>" : "<s class='back'>↺</s>");
    }).join("");
    return "<div class='w-row a'><u>해줘 방식</u><span class='w-a'>" + a + "</span><b class='w-cnt'>같은 지적이 되풀이</b></div>" +
      "<div class='w-row b'><u>제 방식</u><span class='w-flow'>" + n + "</span><b class='w-round'>두 번째 채널, 쌓인 방법으로 시작</b></div>" +
      "<div class='w-row c'><u>완성까지 요청</u><span class='w-bars'><i class='b1'><em>학습 전, 스토리 채널 18번</em></i><i class='b2'><em>학습 후, 보겸 채널 3번</em></i></span></div>";
  }
  window.TG_BUILD = window.TG_BUILD || {};
  window.TG_BUILD.way = {
    steps: ["문제가 보이면", "AI에게 원인을 묻고", "AI가 제안한 방법을 비교해, 더 나은 쪽을 고르고", "고친 방법까지 학습시킵니다, 스토리 채널 18번",
      "다음 채널에서는", "AI가 쌓인 방법으로 먼저 만들고", "남은 것만 확인해 고르면", "보겸 채널 3번, 요청할 일이 줄었습니다"],
    times: [1500, 1500, 2300, 2500, 1400, 1500, 1500, 3000],
    html: html
  };
})();
