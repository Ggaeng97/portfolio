// 'AI와 일하는 방식' 그림 2: 영상은 프레임 단위로 잰다 — 자막 위치 · 글꼴과 크기 · 상자 여백 · 한 장 글자 수 · 반응 밈의 크기와 자리.
// 잰 값은 규칙으로 학습시켜 다음 편부터 자동으로. 숫자는 기록 그대로만(한 장 최대 20자 · 원본 밈 20개를 재서 폭 40~56%, 자막 바로 위). 도식.
(function () {
  var LIST = ["자막 위치, 높이", "글꼴, 글자 크기", "상자 여백", "한 장 글자 수", "밈 특징, 자리"];
  function html() {
    return "<div class='f-phone'><i class='f-head'></i><i class='f-body'></i>" +
      "<span class='f-meme'><b>밈</b></span><span class='f-mw'><em>폭 40~56%</em></span>" +
      "<span class='f-sub'><i></i><i></i></span>" +
      "<span class='f-gy'></span><span class='f-gx'></span><span class='f-pad l'></span><span class='f-pad r'></span>" +
      "<em class='f-scan'></em></div>" +
      "<ol class='f-list'>" + LIST.map(function (t, k) { return "<li class='l" + k + "'>" + t + "</li>"; }).join("") + "</ol>";
  }
  window.TG_BUILD = window.TG_BUILD || {};
  window.TG_BUILD.frame = {
    steps: ["프레임마다 자막을 찾아", "자막 위치와 높이를 측정하고", "글꼴, 글자 크기, 상자 여백까지", "반응 밈은 원본 20개를 측정해, 폭 40~56%, 자막 바로 위",
      "측정한 값을 규칙으로 학습, 다음 편은 자동으로"],
    times: [1600, 1800, 2000, 2600, 2800],
    html: html
  };
})();
