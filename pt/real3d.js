// 들머리의 '실시간 3D 모델' 층(ES 모듈 · three.js) — scene.js 가 그림 자리마다 PT.realLayer(fig, name) 로 만든다(하늘섬 · 표정 · 클리커, 마지막 우파는 없음).
// 입자가 모이면서 모델이 되고, 퍼지면서 모델이 입자로 — 그 사이 내내 모델로 머물며 천천히 흔들리고, 마우스를 올리면 마우스 쪽으로 돈다.
// 모델은 입자와 같은 공간 · 같은 각도(L.yaw)로 그려서 입자 ↔ 모델로 바뀌는 순간에도 각도가 맞는다.
//   11-21 사용자: "60프레임으로 자연스럽게 · 모델링 파일 셋 다 쓰기 · 입체적으로 · 파티클-모델링 전환 간 각도 싱크".
// 데이터 = pt/data/real3d.js · models/<이름>.glb.js (_tools/pt/build_3d.py). 파일 주소로 열어도 되게 모두 글자(data URL)로 싣는다.
// 일반 스크립트에서 three.js 를 import() 로 불러온다 — 크롬은 파일 주소(index.html 더블클릭)에서 모듈 스크립트 파일을 막지만, CDN 의 모듈은 import() 로 받을 수 있다.
(function () {
const SRC = document.currentScript ? document.currentScript.src : "";
Promise.all([import("three"), import("three/addons/loaders/GLTFLoader.js"), import("three/addons/loaders/DRACOLoader.js"), import("three/addons/environments/RoomEnvironment.js")])
  .then(([THREE, { GLTFLoader }, { DRACOLoader }, { RoomEnvironment }]) => {

const PT = window.PT = window.PT || {};
const HOVER = matchMedia("(hover: hover) and (pointer: fine)").matches;   // 마우스가 있는 기기만 마우스로 돌린다
const M = PT.mouse || (PT.mouse = { x: 0, y: 0, on: false });
addEventListener("mousemove", (e) => { M.x = e.clientX; M.y = e.clientY; M.on = true; }, { passive: true });
document.addEventListener("mouseleave", () => { M.on = false; });
const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/draco/gltf/"));
const clamp1 = (v) => Math.max(-1, Math.min(1, v));
function bytes(s) { const b = atob(s), a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i); return a; }
function script(src) { return new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
async function glb(name) {
  if (!(window.GLB && window.GLB[name])) await script("models/" + name + ".glb.js");
  const u = window.GLB[name], a = bytes(u.slice(u.indexOf(",") + 1));
  return new Promise((ok, no) => loader.parse(a.buffer, "", ok, no));
}
function tex(url, flipY) { return new Promise((ok) => new THREE.TextureLoader().load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.flipY = flipY; t.anisotropy = 4; ok(t); })); }

// 그림마다: 화면 틀(입자 좌표의 [왼 · 오 · 위 · 아래]) · 카메라 · 프레임마다 할 일
const KINDS = {
  clicker(D, scene, L) {                                   // 입자 좌표 = s·(glTF − c), 정면 직교 · 세로축 회전 = 입자와 정확히 같음
    const h = D.half, cam = new THREE.OrthographicCamera(-h, h, h, -h, 0.01, 100), yawG = new THREE.Group(), inner = new THREE.Group();
    cam.position.set(0, 0, 10);
    inner.scale.setScalar(D.s); inner.position.set(-D.s * D.c[0], -D.s * D.c[1], -D.s * D.c[2]);
    yawG.add(inner); scene.add(yawG);
    glb(D.glb).then((g) => { inner.add(g.scene); L.ready = true; });
    return { rect: [-h, h, h, -h], camera: cam, frame(t, shape, yaw) { yawG.rotation.y = yaw; } };
  },
  face(D, scene, L) {                                      // 입자를 뽑은 표정 카메라 그대로 · 카메라 세로축(입자 가운데 점을 지남)으로 돈다
    const C = D.cam, cam = new THREE.PerspectiveCamera(C.fov_y, C.aspect, C.near, C.far), m = new THREE.Matrix4().set(...C.cam);
    m.decompose(cam.position, cam.quaternion, cam.scale); cam.updateMatrixWorld();
    const P = new THREE.Vector3(...C.pivot), up = new THREE.Vector3(...C.up), pivot = new THREE.Group(), holder = new THREE.Group();
    pivot.position.copy(P); holder.position.copy(P).multiplyScalar(-1); pivot.add(holder); scene.add(pivot);
    const U = { cellA: { value: null }, cellB: { value: null }, mixAB: { value: 0 } };
    Promise.all([glb(D.glb), Promise.all(D.cells.map((u) => tex(u, false)))]).then(([g, T]) => {
      g.scene.traverse((o) => {
        if (!o.isMesh) return;
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: C.rough[o.name] || 0.62, metalness: 0 });
        if (/Head/.test(o.name) && o.geometry.attributes.uv) {     // 얼굴 = 아틀라스의 표정 칸을 'face' UV 로 얹는다(블렌더 재질과 같은 섞기)
          o.geometry.setAttribute("faceUv", o.geometry.attributes.uv);
          mat.onBeforeCompile = (sh) => {
            Object.assign(sh.uniforms, U);
            sh.vertexShader = "attribute vec2 faceUv;\nvarying vec2 vFaceUv;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvFaceUv = faceUv;");
            sh.fragmentShader = "uniform sampler2D cellA, cellB;\nuniform float mixAB;\nvarying vec2 vFaceUv;\n" + sh.fragmentShader.replace("#include <color_fragment>",
              "#include <color_fragment>\n{ vec2 f = clamp(vFaceUv, 0.002, 0.998); vec4 c = mix(texture2D(cellA, f), texture2D(cellB, f), mixAB); diffuseColor.rgb = mix(diffuseColor.rgb, c.rgb, c.a); }");
          };
        }
        o.material = mat;
      });
      holder.add(g.scene); L.T = T; L.ready = true;
    });
    const cell = (k, t) => (k < 3 ? k : D.spiral[Math.floor(t * D.rate) % D.spiral.length]);   // 소용돌이 눈은 칸 다섯을 돌아가며(블렌더 드라이버와 같은 빠르기)
    return {
      rect: [-D.x0 * D.k, (D.w - D.x0) * D.k, D.y0 * D.k, -(D.h - D.y0) * D.k], camera: cam,
      frame(t, shape, yaw) {
        pivot.quaternion.setFromAxisAngle(up, yaw);
        if (!L.T) return;
        const k = shape && shape.looks > 1 ? shape.k : 0, to = shape && shape.looks > 1 ? shape.to : 0;
        U.cellA.value = L.T[cell(k, t)]; U.cellB.value = L.T[cell(to, t)]; U.mixAB.value = shape && shape.mix ? shape.mix : 0;   // 입자 표정과 같은 때에
      },
    };
  },
  sky(D, scene, L) {                                       // 입자 공간(엔진 원근을 푼 공간)에 뒤층 · 앞층 입체 판 + 실제 고리 메쉬. 카메라 = 엔진의 원근(z = 1/0.22 에서 봄)
    const h = D.half, dist = 1 / D.orrery.persp, cam = new THREE.PerspectiveCamera(2 * Math.atan(h / dist) * 180 / Math.PI, 1, 0.05, 40), g = new THREE.Group();
    cam.position.set(0, 0, dist); cam.lookAt(0, 0, 0); scene.add(g);
    const G = D.grid, n = G * G, idx = [];
    for (let i = 0; i < G - 1; i++) for (let j = 0; j < G - 1; j++) { const a = i * G + j; idx.push(a, a + G, a + 1, a + 1, a + G, a + G + 1); }
    const uv = new Float32Array(n * 2);
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { uv[(i * G + j) * 2] = j / (G - 1); uv[(i * G + j) * 2 + 1] = 1 - i / (G - 1); }
    function plate(b64, t, front) {
      const q = new Int16Array(bytes(b64).buffer), p = new Float32Array(n * 3);
      for (let i = 0; i < n * 3; i++) p[i] = q[i] / 32767 * D.q;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(p, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
      const mat = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: true, alphaTest: front ? 0.02 : 0, side: THREE.DoubleSide });
      mat.onBeforeCompile = (sh) => {                     // 가장자리를 서서히 투명하게 — 홀이 네모로 딱 끊기지 않고 바탕으로 스며든다(앞층도 같은 비율)
        sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\n" +
          "diffuseColor.a *= smoothstep(0.0, 0.16, vMapUv.x) * smoothstep(0.0, 0.16, 1.0 - vMapUv.x) * smoothstep(0.0, 0.2, vMapUv.y) * smoothstep(0.0, 0.12, 1.0 - vMapUv.y);");
      };
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = front ? 2 : 0; mesh.frustumCulled = false; g.add(mesh);
    }
    const R = D.rings, o = D.orrery, vec = new Int16Array(bytes(R.vec).buffer), nrm = new Int8Array(bytes(R.nrm).buffer), grp = bytes(R.grp), kind = bytes(R.kind);
    const parts = [new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 1, roughness: 0.3 }), new THREE.MeshBasicMaterial({ color: 0xfff1cc, toneMapped: false }),
      new THREE.MeshBasicMaterial({ color: 0xfffbea, toneMapped: false })].map((mat, kd) => {
      const ids = []; for (let v = 0; v < R.n; v++) if (kind[v] === kd) ids.push(v);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ids.length * 3), 3)); geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(ids.length * 3), 3));
      const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 1; g.add(mesh);
      return { ids, geo };
    });
    function rings(cs, sn) {                               // 입자의 고리(shapes_model.js PT.orrery)와 같은 식 · 같은 각
      const E = o.eye, Rm = o.R, Gs = o.groups;
      for (const pt of parts) {
        const P = pt.geo.attributes.position.array, N = pt.geo.attributes.normal.array;
        pt.ids.forEach((v, i) => {
          const k = grp[v] - 1, c = Gs[k].c, ck = cs ? cs[k] : 1, sk = cs ? sn[k] : 0, dx = vec[v * 3] / 32767 * R.unit, dy = vec[v * 3 + 1] / 32767 * R.unit;
          const wx = c[0] + dx * ck - dy * sk - E[0], wy = c[1] + dx * sk + dy * ck - E[1], wz = c[2] + vec[v * 3 + 2] / 32767 * R.unit - E[2];
          const dep = -(Rm[6] * wx + Rm[7] * wy + Rm[8] * wz);
          let z = 1 / o.persp - 1 / (o.a + o.b / dep);
          if (z > o.zn) z = o.zn + o.soft * Math.tanh((z - o.zn) / o.soft); else if (z < o.zf) z = o.zf - o.soft * Math.tanh((o.zf - z) / o.soft);
          const kk = (1 - o.persp * z) * o.scale, dt = dep * o.tan, q = i * 3;
          P[q] = ((Rm[0] * wx + Rm[1] * wy + Rm[2] * wz) / dt - o.off[0]) * kk; P[q + 1] = ((Rm[3] * wx + Rm[4] * wy + Rm[5] * wz) / dt - o.off[1]) * kk; P[q + 2] = z;
          const nx0 = nrm[v * 3] / 127, ny0 = nrm[v * 3 + 1] / 127, nz = nrm[v * 3 + 2] / 127, nx = nx0 * ck - ny0 * sk, ny = nx0 * sk + ny0 * ck;
          N[q] = Rm[0] * nx + Rm[1] * ny + Rm[2] * nz; N[q + 1] = Rm[3] * nx + Rm[4] * ny + Rm[5] * nz; N[q + 2] = Rm[6] * nx + Rm[7] * ny + Rm[8] * nz;
        });
        pt.geo.attributes.position.needsUpdate = true; pt.geo.attributes.normal.needsUpdate = true;
      }
    }
    Promise.all([tex(D.bg, true), tex(D.fg, true)]).then(([b, f]) => { plate(D.bgPos, b, false); plate(D.fgPos, f, true); rings(null, null); L.ready = true; });
    let last = "";
    return {
      rect: [-h, h, h, -h], camera: cam,
      frame(t, shape, yaw) {
        g.rotation.y = yaw;
        if (shape && shape.cs) { const key = Array.from(shape.cs).join(","); if (key !== last) { last = key; rings(shape.cs, shape.sn); } }
      },
    };
  },
};

function make(fig, name) {
  const D = window.PT_3D && window.PT_3D[name]; if (!D) return null;
  const cv = document.createElement("canvas"); cv.className = "pt-real"; cv.setAttribute("aria-hidden", "true");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, premultipliedAlpha: true }); } catch (e) { return null; }
  fig.appendChild(cv);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = D.kind === "face" ? THREE.NeutralToneMapping : THREE.AgXToneMapping;   // 우파는 분홍이 바래지 않게(AgX 는 채도를 많이 눌렀다)
  renderer.toneMappingExposure = D.kind === "face" ? 0.95 : 1.05; renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-3, 4, 6); scene.add(key);
  const L = { o: 0, deg: 0, yaw: 0, inside: false, flat: D.kind !== "sky", ready: false, lay: "", vis: "", ph: Math.random() * 6 };
  const K = KINDS[D.kind](D, scene, L);
  // dt 초 · rect 그림 자리 · sc 입자 좌표 1 의 화소 · target 모델이 된 정도(0~1, 장면이 입자가 모인 정도로 잼) · shape 지금 입자 모양(표정 · 고리 각)
  L.update = function (dt, rect, sc, target, shape) {
    const t = performance.now() / 1000;
    const inside = HOVER && M.on && M.x >= rect.left && M.x <= rect.right && M.y >= rect.top && M.y <= rect.bottom;
    const want = inside ? clamp1((M.x - rect.left - rect.width / 2) / (rect.width / 2)) * D.lim : D.auto * Math.sin(t * 0.45 + L.ph);   // 가만히 있으면 천천히 흔들림
    L.inside = inside; L.deg += (want - L.deg) * Math.min(1, dt * (inside ? 6 : 2.5)); L.yaw = L.deg * Math.PI / 180;
    L.o = L.ready ? target : 0;
    if (L.o > 0.002) {
      const [ul, ur, ut, ub] = K.rect, w = Math.round((ur - ul) * sc), hh = Math.round((ut - ub) * sc);
      const lay = [Math.round(rect.width / 2 + ul * sc), Math.round(rect.height / 2 - ut * sc), w, hh].join(",");
      if (lay !== L.lay) { L.lay = lay; const v = lay.split(","); cv.style.left = v[0] + "px"; cv.style.top = v[1] + "px"; cv.style.width = v[2] + "px"; cv.style.height = v[3] + "px"; renderer.setSize(w, hh, false); }
      K.frame(t, shape, L.yaw);
      renderer.render(scene, K.camera);
    }
    const vis = L.o.toFixed(3);
    if (vis !== L.vis) { L.vis = vis; cv.style.opacity = vis; cv.style.filter = L.o > 0.995 ? "none" : "blur(" + ((1 - L.o) * 8).toFixed(1) + "px)"; }
    return L;
  };
  return L;
}

// 데이터(약 2 MB)는 페이지가 다 뜬 뒤에 불러오고, 그다음부터 장면이 그림 자리마다 층을 만든다
function start() { script("pt/data/real3d.js" + (SRC.indexOf("?") > 0 ? SRC.slice(SRC.indexOf("?")) : "")).then(() => { PT.realLayer = make; }); }
if (document.readyState === "complete") setTimeout(start, 300); else addEventListener("load", () => setTimeout(start, 300));
  }).catch(() => {});                                       // three.js 를 못 받으면(오프라인) 입자만
})();
