// 영상 편집 시간 비교 그림: 편집자와 EDITRA 가 같은 영상을 같이 시작해 **같은 속도로** 차오른다.
// EDITRA 는 단계를 차례로 거치고 20~30분에 끝나고, 편집자 막대는 그 뒤로도 그대로 계속 차올라 2~4시간(늦으면 하루 이틀).
// 사용자 11-15: "단계별로 대략 쪼개고(일정 간격 X), 사람도 쪼개고, 두 막대 모두 단계 글자, 둘 다 같은 속도로 AI 끝난 뒤 사람이 쭉 차오르게".
// 막대 길이 = 시간 비율(약 25분 : 3시간 ≈ 11 : 75).
// EDITRA 조각 = 실제 기록 한 편(에디트라 세션 #43 · #45: 2026-10-17 스토리 쇼츠, 시간.txt 의 date 시각) 구간 그대로, 사용자 11-15 "기록대로 나눠".
//   준비 0:48(입력 읽기 + 편집기 띄우기 — 이 편엔 영상 분석 기록 없음) · 자료 조사+대본 3:00 · 목소리 7:17 과 자료 모으기 10:16 이 동시(→ 10:16)
//   · 컷 · 배치 · 자막 · 타이밍 한 덩어리 12:08 · 내용 확인 3:48 = 30:00. 내보내기 6:21 과 버린 배경음악은 단계 밖이라 뺌.
// 편집자 조각 = 대략치 — 사용자 11-15 "대략치 그대로" 결정(경험값을 받으면 HUM 숫자만 바꾼다).
(function () {
  var HUM = [[8, "① 영상 분석"], [16, "② 자료 조사"], [14, "③ 이야기 대본"], [10, "④ 목소리 만들고 고르기"], [16, "⑤ 컷 편집"],
    [14, "⑥ 자료 배치"], [9, "⑦ 자막"], [8, "⑧ 배치 타이밍 맞추기"], [5, "⑨ 내용 확인"]];
  var AI = [[48, "준비"], [180, "②③ 자료 조사, 이야기 대본"], [616, "④ 목소리, 자료 모으기 동시"],
    [728, "⑤~⑧ 컷, 자료 배치, 자막, 배치 타이밍"], [228, "⑨ 내용 확인"]];   // 초
  var RATE = 100;                                // 막대 1% 를 차오르는 데 걸리는 시간(ms) — 두 막대 같은 속도
  function lane(parts, total) {
    var sum = parts.reduce(function (a, p) { return a + p[0]; }, 0), x = 0, segs = "", labs = "";
    parts.forEach(function (p) {
      var ww = p[0] / sum * total, tm = "--d:" + Math.round(x * RATE) + "ms;--t:" + Math.round(ww * RATE) + "ms";
      segs += "<s style='left:" + x.toFixed(2) + "%;width:" + ww.toFixed(2) + "%;" + tm + "'></s>";
      labs += "<b style='left:" + x.toFixed(2) + "%;--x:" + x.toFixed(1) + ";" + tm + "'>" + p[1] + "</b>";
      x += ww;
    });
    return "<span class='rc-tr'>" + segs + "</span><span class='rc-now'>" + labs + "</span>";
  }
  function html() {
    return "<div class='rc'>" +
      "<div class='rc-ln a'><u>편집자가 직접</u><div class='rc-bar'>" + lane(HUM, 75) + "<em class='rc-lb a'><b>2~4시간</b>, 늦으면 하루 이틀</em></div></div>" +
      "<div class='rc-ln b'><u>영상 편집기</u><div class='rc-bar'>" + lane(AI, 11) + "<em class='rc-lb b'><b>20~30분</b>, 대본부터 내용 확인까지</em></div></div>" +
      "</div>";
  }
  window.TG_BUILD = window.TG_BUILD || {};
  window.TG_BUILD.race = {
    steps: ["같은 영상 한 편을 같이 시작", "같은 속도로, 영상 편집기는 단계를 차례로", "영상 편집기는 20~30분에 끝, 편집자는 계속", "편집자가 직접 하면 2~4시간, 늦으면 하루 이틀"],
    times: [700, 1300, 6400, 3200],   // 1300 = EDITRA 11% × 100ms + 여유 · 1300+6400 ≈ 편집자 75% × 100ms + 여유
    html: html
  };
})();
