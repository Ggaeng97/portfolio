// 투명 바탕 영상(video[data-alpha]) — 06 '받은 마스코트 그대로' 카드(사용자 11-22: "이것도 투명으로 다시 렌더").
// 브라우저마다 투명 영상 지원이 다르다(사파리 = HEVC 만, 크롬 · 파이어폭스 = VP9 만, 윈도우 크롬은 HEVC 를 틀어도 투명이 빠짐).
// 그래서 어디서나 트는 보통 영상(H.264) 한 개에 색(위 절반, 검정 위에 얹은 색) + 투명도(아래 절반, 흰색 = 불투명)를 위아래로 붙여 두고,
// 여기서 WebGL 로 합쳐 캔버스에 그린다(_tools/alpha_video.py 가 영상을 만든다).
// 영상 요소는 재생 · 멈춤(vidplay.js 의 data-inview)만 맡고 보이지 않는다. WebGL 이 안 되거나 재생이 막히면 밑에 깔린 포스터 그림(투명 webp)이 그대로 보인다.
(function () {
  var VS = "attribute vec2 p; varying vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }";
  // 텍스처는 위아래를 뒤집어 올린다(v = 1 이 영상 맨 위): 색 = 위 절반(v .5~1), 투명도 = 아래 절반(v 0~.5)
  var FS = "precision mediump float; uniform sampler2D t; varying vec2 uv; void main() {" +
    " vec3 c = texture2D(t, vec2(uv.x, .5 + uv.y * .5)).rgb; float a = texture2D(t, vec2(uv.x, uv.y * .5)).r;" +
    " a = clamp((a - .03) / .94, 0., 1.); gl_FragColor = vec4(min(c, vec3(a)), a); }";   // 압축 잡음으로 색이 투명도를 넘지 않게
  function start(video) {
    var box = video.parentNode, canvas = document.createElement("canvas");
    var gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return;
    function shader(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    box.appendChild(canvas);
    var shown = false;
    function draw() {
      if (video.readyState < 2 || !video.videoWidth) return;
      var w = video.videoWidth, h = video.videoHeight >> 1;
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); } catch (e) { return; }
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!shown) { shown = true; box.classList.add("on"); }   // 첫 장을 그린 뒤에야 포스터를 거둔다(둘이 겹쳐 보이지 않게)
    }
    if (video.requestVideoFrameCallback) {
      var onFrame = function () { draw(); video.requestVideoFrameCallback(onFrame); };
      video.requestVideoFrameCallback(onFrame);
    } else {
      var loop = function () { if (!video.paused && !video.ended) draw(); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
    video.addEventListener("seeked", draw);
  }
  document.querySelectorAll("video[data-alpha]").forEach(start);
})();
