// 앱 02 카드 그림: '먹었어' 뒤 광고는 홈 버튼으로 꺼져 먹는 흐름만 방해 → 먹는 흐름에선 광고를 빼고,
// 강제 소리가 필요할 때 광고를 끝까지 보면 3회 충전 → 수익은 광고 · 구독 · 영양제 제휴. 사용자 확정 설계(11-13) 그대로, 앱 화면이 아닌 도식.
(function () {
  function n(txt, cls, k) { return "<b class='ad-n " + (cls || "") + "' style='--i:" + k + "'>" + txt + "</b>"; }
  var AR = "<i class='ad-ar'>→</i>";
  function html() {
    var g0 = n("✓ 먹었어", "ok", 0) + AR + n("광고", "ad", 1) + AR + n("홈 버튼으로 끔", "", 2) + AR + n("✕ 끝까지 안 봄, 먹는 흐름만 방해", "bad", 3);
    var g1 = n("✓ 먹었어", "ok", 0) + AR + n("광고", "ad gone", 1) + AR + n("칭찬, 바로 끝", "ok", 2);
    var g2 = n("강제 소리 남은 횟수 0", "", 0) + AR + n("광고 끝까지 보기<i class='ad-pg'><s></s></i>", "ad", 1) + AR + n("+3회 충전", "ok", 2) + AR +
      n("소리 최대로 울림<span class='ad-vol'><i></i><i></i><i></i><i></i></span>", "", 3);
    var g3 = "<b class='ad-m' style='--i:0'><u>광고</u>강제 소리 횟수를 광고로 충전</b><b class='ad-m' style='--i:1'><u>구독, 우파에게 팝콘 사주기</u>월 1,990원, 강제 소리 무제한, 광고 없음</b>" +
      "<b class='ad-m' style='--i:2'><u>영양제 추천</u>대화로 고른 영양제 광고 카드, 제휴 수수료</b>";
    return "<div class='ad-g g0'>" + g0 + "</div><div class='ad-g g1'>" + g1 + "</div><div class='ad-g g2'>" + g2 + "</div><div class='ad-g g3'>" + g3 + "</div>";
  }
  window.TG_BUILD = window.TG_BUILD || {};
  window.TG_BUILD.ad = {
    steps: ["원래, '먹었어' 뒤에 광고", "약 먹는 흐름에서는 광고를 빼고", "강제 소리가 필요할 때만, 광고를 끝까지 보면 3회 충전", "수익 구조, 광고, 구독, 영양제 추천"],
    times: [4000, 3300, 4400, 3600],
    html: html
  };
})();
