// 성당 장면(theatre.js) 자동 재생 시간표(autoscene.js). 진행 자리는 theatre.js 의 단계(PH) · 설명 자리(data-at)에서 계산한다.
// 제목 → 처음 모습 → 첫 설명 → (날아가기 영상, 끝날 때까지 기다림) → 설명마다 머묾 → 끝 문구 → 탁자로 겹쳐 바뀜 → 탁자 제목
// → 확대 두 번(각각 확대가 끝날 때까지 기다린 뒤 설명을 읽을 시간) → 끝. 초는 보통 속도 기준, 휠로 빨리 감기 · 되감기.
(function () {
  var A = window.TheatreApi;
  if (!A || !window.AutoScene) return;
  var PH = A.PH, caps = A.caps1;
  function f1p(q) { return PH.f1[0] + (PH.f1[1] - PH.f1[0]) * q + 0.006; }   // 설명 구간 첫머리(theatre_rails.js 와 같음)
  var at = Array.prototype.map.call(caps, function (c) { return parseFloat(c.dataset.at); });
  var c0 = f1p(at[0]), a1 = f1p(at[1]), a0 = c0 + (a1 - c0) * 0.45;          // 날아가기 영상이 시작되는 자리(theatre.js 와 같음)
  var keys = [
    { p: 0, stay: 1.6 },                                  // 제목
    { p: 0.075, go: 1.2, stay: 1.3 },                      // '처음엔 이랬습니다' + 액자가 떠오름
    { p: c0, go: 0.8, stay: 1.7 },                         // 첫 설명
    { p: a0 + 0.003, go: 0.7, stay: 0.2 }                  // 여기서 날아가기 영상(기다림)
  ];
  for (var j = 1; j < at.length; j++) keys.push({ p: f1p(at[j]), go: 1.1, stay: 1.9 });
  keys.push(
    { p: PH.end[0] + 0.02, go: 1.0, stay: 2.2 },           // '같은 자리를 56번 보고, 짚고, 고쳐서'
    { p: PH.mix[1], go: 2.4, stay: 0.2 },                  // 탁자로 겹쳐 바뀜
    { p: PH.head2 + 0.025, go: 0.4, stay: 1.6 }            // '다가가 보면'
  );
  A.zAT.forEach(function (z) { keys.push({ p: z + 0.008, go: 0.7, stay: 2.3 }); });   // 확대(끝날 때까지 기다림) → 탁자 설명
  keys.push({ p: 1, go: 1.0, stay: 0 });
  window.AutoScene.add(A.sec, keys, { busy: A.busy, fast: A.fast });
})();
