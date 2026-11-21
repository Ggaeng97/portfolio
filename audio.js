// 소리 엔진(sound.js 가 씀): 배경음 층 여섯(snd/bgm2_*, _tools/make_bgm_bright.py)을 한꺼번에 틀어 두고 층마다 크기만 바꾼다 + 짧은 효과음(타자 · 분필).
//  · 웹 주소(http)에선 웹 오디오 — 층끼리 한 표본도 안 어긋나고(디코드 길이 = 원래 길이 = 이음새 없음, 11-21 크롬에서 잼), 휴대폰에서도 크기가 바뀐다.
//    소리 상자(AudioContext)는 열자마자 만들어 본다(허락되면 바로, 막히면 첫 클릭 때). 파일(4 MB)은 페이지가 다 뜬 뒤나 소리가 허락되는 즉시 받아 풀어 둔다.
//  · 파일 주소(index.html 더블클릭)에선 브라우저가 웹 오디오의 파일 불러오기를 막아서, 일반 오디오 요소 넷으로 같은 일을 한다.
window.SiteAudio = (function () {
  var LAYERS = ["keys", "warm", "bell", "beat", "lead", "outro"], FX = ["type", "chalk"];
  var want = LAYERS.map(function () { return 0; }), master = 0, stopped = false;
  var AC = window.AudioContext || window.webkitAudioContext, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  var impl = location.protocol !== "file:" && AC && OAC && window.fetch ? webAudio() : mediaEls();
  return {
    mix: function (levels) { want = levels.slice(); impl.apply(); },
    volume: function (v) { master = v; impl.apply(); },
    start: function () { stopped = false; return impl.start(); },
    unlock: function () { stopped = false; return impl.unlock(); },   // 첫 클릭 · 키 · 터치(sound.js)
    state: function () { return impl.state(); },                       // 점검용: 소리 상자 · 층이 실제로 도는지
    stop: function () { stopped = true; impl.apply(); impl.stop(); },
    playing: function () { return !stopped && impl.playing(); },
    fx: function (name, vol, rate) { if (!stopped && impl.playing()) impl.fx(name, vol, rate || 1); }
  };

  function webAudio() {
    var dec = new OAC(2, 1, 48000), bufs = {}, ctx = null, out, gains, begun = false, asked = false, unlocked = false;
    function load(n, path) {
      return fetch(path).then(function (r) { if (!r.ok) throw new Error(path); return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (ok, no) { dec.decodeAudioData(b, ok, no); }); })
        .then(function (buf) { bufs[n] = buf; begin(); });
    }
    function fetchAll() {
      if (asked) return; asked = true;
      LAYERS.forEach(function (n) { load(n, "snd/bgm2_" + n + ".mp3").catch(function () {}); });
      FX.forEach(function (n) { load(n, "snd/" + n + ".mp3").catch(function () {}); });
    }
    if (document.readyState === "complete") setTimeout(fetchAll, 500); else window.addEventListener("load", function () { setTimeout(fetchAll, 500); });
    function begin() {                                   // 층 넷이 다 풀리고 소리 상자가 있으면, 같은 순간에 함께 시작
      if (begun || !ctx || !LAYERS.every(function (n) { return bufs[n]; })) return;
      begun = true; var t = ctx.currentTime + 0.05;
      LAYERS.forEach(function (n, i) { var s = ctx.createBufferSource(); s.buffer = bufs[n]; s.loop = true; s.connect(gains[i]); s.start(t); });
      me.apply();
    }
    var me = {
      start: function () {                                // 열자마자 한 번 시도 — 이 사이트에서 소리를 자주 들은 브라우저는 클릭 없이도 허락한다(크롬의 미디어 이용 점수).
        if (!ctx) {                                      // 막히면 소리 상자는 멈춘 채로 있다가 첫 클릭 · 키 · 터치의 resume() 때 시작(브라우저 콘솔에 경고 한 줄은 남음)
          ctx = new AC(); out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
          gains = LAYERS.map(function () { var g = ctx.createGain(); g.gain.value = 0; g.connect(out); return g; });
          ctx.onstatechange = function () { if (ctx.state === "running") { fetchAll(); me.apply(); } };
        }
        if (ctx.state === "running") fetchAll();
        begin();
        return ctx.resume().then(function () { fetchAll(); me.apply(); });
      },
      // 첫 손짓: 열 때부터 '켜짐'으로 돌던 소리는 다시 0 에서 서서히 — 손짓 전엔 소리를 내보내지 않는 브라우저가 있다
      // (11-21 Claude 앱 미리보기: 소리 상자는 켜져 있는데 안 들려서 ♪ 를 누르면 꺼져 버림 → 두 번 눌러야 나옴)
      unlock: function () {
        var was = unlocked; unlocked = true;
        if (!was && ctx && ctx.state === "running" && begun && !stopped) { var t = ctx.currentTime; out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(0.0001, t); }
        return me.start();
      },
      state: function () { return { ctx: ctx ? ctx.state : "없음", begun: begun, loaded: Object.keys(bufs).length, out: out ? +out.gain.value.toFixed(4) : 0, gains: gains ? gains.map(function (g) { return +g.gain.value.toFixed(3); }) : [] }; },
      stop: function () { setTimeout(function () { if (stopped && ctx) ctx.suspend(); }, 600); },
      playing: function () { return !!ctx && ctx.state === "running"; },
      apply: function () {
        if (!ctx) return; var t = ctx.currentTime;
        gains.forEach(function (g, i) { g.gain.setTargetAtTime(want[i], t, 0.3); });       // 층 크기는 1초 안쪽으로 따라감(멈춘 뒤 더 커지지 않게 — 천천히는 sound.js 가)
        out.gain.setTargetAtTime(stopped ? 0 : master, t, stopped ? 0.12 : 0.8);   // 켤 땐 2.5초쯤에 걸쳐 서서히(페이드 인)
      },
      fx: function (name, vol, rate) {
        var b = bufs[name]; if (!b) return;
        var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.playbackRate.value = rate; g.gain.value = vol;
        s.connect(g); g.connect(ctx.destination); s.start();
      }
    };
    return me;
  }

  function mediaEls() {
    var tracks = LAYERS.map(function (n) { var a = new Audio("snd/bgm2_" + n + ".mp3"); a.loop = true; a.preload = "auto"; a.volume = 0; return a; });
    var pools = {}, now = LAYERS.map(function () { return 0; }), fade = 0, on = false, last = 0, unlocked = false;
    FX.forEach(function (n) { pools[n] = { k: 0, list: [0, 1, 2, 3].map(function () { var a = new Audio("snd/" + n + ".mp3"); a.preload = "auto"; return a; }) }; });
    (function loop(ts) {                                  // 층 크기를 목표로 서서히 + 1초마다 층끼리 어긋났으면 맞춤
      fade = Math.max(0, Math.min(1, fade + (on && !stopped ? 0.008 : -0.06)));
      for (var i = 0; i < tracks.length; i++) { now[i] += (want[i] - now[i]) * 0.08; tracks[i].volume = Math.max(0, Math.min(1, now[i] * master * fade)); }
      if (on && ts - last > 1000) {
        last = ts; var t0 = tracks[0].currentTime, d = tracks[0].duration || 0;
        if (t0 > 1 && t0 < d - 1) tracks.forEach(function (a, k) { if (k && Math.abs(a.currentTime - t0) > 0.05) a.currentTime = t0; });
      }
      requestAnimationFrame(loop);
    })(0);
    return {
      start: function () {
        var t0 = tracks[0].currentTime || 0;
        return Promise.all(tracks.map(function (a) { a.currentTime = t0; return a.play(); }))
          .then(function () { on = true; }, function (e) { tracks.forEach(function (a) { a.pause(); }); on = false; throw e; });
      },
      stop: function () { setTimeout(function () { if (stopped) { tracks.forEach(function (a) { a.pause(); }); on = false; } }, 600); },
      playing: function () { return on; },
      unlock: function () { var was = unlocked; unlocked = true; if (!was && on && !stopped) { fade = 0; return Promise.resolve(); } return this.start(); },
      state: function () { return { tracks: tracks.map(function (a) { return a.paused ? "멈춤" : "돎"; }), fade: +fade.toFixed(2) }; },
      apply: function () {},
      fx: function (name, vol, rate) {
        var p = pools[name], a = p.list[p.k++ % p.list.length];
        try { a.currentTime = 0; a.volume = Math.min(1, vol); a.playbackRate = rate; a.play().catch(function () {}); } catch (e) {}
      }
    };
  }
})();
