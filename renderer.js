/* renderer.js — URLio frontend logic */

// ── Detect platform ──────────────────────────────────────────────────────────
if (navigator.userAgent.includes('Mac')) {
  document.body.classList.add('darwin');
}

// ── Three.js 3D Background ────────────────────────────────────────────────────
(function initThree() {
  const canvas = document.getElementById('bg-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5);

  // Torus knot (the "link" icon in 3D)
  const torusGeo = new THREE.TorusKnotGeometry(1.1, 0.32, 128, 20, 2, 3);
  const torusMat = new THREE.MeshPhongMaterial({
    color: 0x7c3aed,
    emissive: 0x3b0764,
    specular: 0xf472b6,
    shininess: 80,
    wireframe: false,
    transparent: true,
    opacity: 0.18,
  });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(3.5, -0.5, -1);
  scene.add(torus);

  // Second smaller torus on the left
  const torus2Geo = new THREE.TorusKnotGeometry(0.7, 0.2, 100, 16, 3, 4);
  const torus2Mat = new THREE.MeshPhongMaterial({
    color: 0xf472b6,
    emissive: 0x831843,
    transparent: true,
    opacity: 0.12,
    wireframe: false,
  });
  const torus2 = new THREE.Mesh(torus2Geo, torus2Mat);
  torus2.position.set(-4, 1.5, -2);
  scene.add(torus2);

  // Icosahedron (gem) top-center
  const gemGeo = new THREE.IcosahedronGeometry(0.6, 1);
  const gemMat = new THREE.MeshPhongMaterial({
    color: 0xa78bfa,
    emissive: 0x4c1d95,
    wireframe: true,
    transparent: true,
    opacity: 0.25,
  });
  const gem = new THREE.Mesh(gemGeo, gemMat);
  gem.position.set(-2.5, -2.5, -1.5);
  scene.add(gem);

  // Particle field
  const particleCount = 200;
  const pGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xa78bfa,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
  });
  scene.add(new THREE.Points(pGeo, pMat));

  // Lights
  scene.add(new THREE.AmbientLight(0x1a0a2e, 3));
  const pLight = new THREE.PointLight(0xa78bfa, 2, 15);
  pLight.position.set(3, 2, 3);
  scene.add(pLight);
  const pLight2 = new THREE.PointLight(0xf472b6, 1.5, 12);
  pLight2.position.set(-3, -2, 2);
  scene.add(pLight2);

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Mouse parallax
  let mx = 0, my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 0.3;
    my = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  // Animate
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    torus.rotation.x = t * 0.18;
    torus.rotation.y = t * 0.25;
    torus2.rotation.x = t * -0.2;
    torus2.rotation.z = t * 0.15;
    gem.rotation.y = t * 0.3;
    gem.rotation.x = t * 0.2;

    // Subtle camera drift
    camera.position.x += (mx - camera.position.x) * 0.02;
    camera.position.y += (-my - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
})();

// ── GSAP Intro Animations ────────────────────────────────────────────────────
const gsapTimeline = gsap.timeline({ delay: 0.1 });
gsapTimeline
  .to('#header',    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
  .to('#hero',      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
  .to('#main-card', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '-=0.4')
  .to('#stats-bar', { opacity: 1,        duration: 0.5, ease: 'power2.out' }, '-=0.2');

// GSAP hover animations for the action buttons
document.querySelectorAll('.action-btn').forEach((btn) => {
  btn.addEventListener('mouseenter', () =>
    gsap.to(btn, { scale: 1.02, duration: 0.2, ease: 'power2.out' }));
  btn.addEventListener('mouseleave', () =>
    gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out' }));
});

// ── State ─────────────────────────────────────────────────────────────────────
let history = JSON.parse(localStorage.getItem('urlio-history') || '[]');
let currentQRUrl = '';
let stats = JSON.parse(localStorage.getItem('urlio-stats') || '{"shortened":0,"expanded":0}');

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const shortenInput    = $('shorten-input');
const expandInput     = $('expand-input');
const shortenBtn      = $('shorten-btn');
const expandBtn       = $('expand-btn');
const shortenResult   = $('shorten-result');
const expandResult    = $('expand-result');
const shortenResultUrl = $('shorten-result-url');
const expandResultUrl  = $('expand-result-url');
const shortenError    = $('shorten-error');
const expandError     = $('expand-error');
const historyBadge    = $('history-badge');
const historySidebar  = $('history-sidebar');
const sidebarOverlay  = $('sidebar-overlay');
const historyList     = $('history-list');
const qrModal         = $('qr-modal');
const qrCodeContainer = $('qr-code-container');
const qrUrlLabel      = $('qr-url-label');
const toast           = $('toast');
const statShortened   = $('stat-shortened');
const statExpanded    = $('stat-expanded');
const statTotal       = $('stat-total');

// ── Tabs ──────────────────────────────────────────────────────────────────────
const tabs       = document.querySelectorAll('.tab');
const indicator  = document.querySelector('.tab-indicator');
const panelShorten = $('panel-shorten');
const panelExpand  = $('panel-expand');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const which = tab.dataset.tab;

    if (which === 'shorten') {
      indicator.classList.remove('expand');
      gsap.to(panelShorten, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
        onStart: () => { panelShorten.classList.remove('hidden'); panelExpand.classList.add('hidden'); }
      });
    } else {
      indicator.classList.add('expand');
      gsap.to(panelExpand, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
        onStart: () => { panelExpand.classList.remove('hidden'); panelShorten.classList.add('hidden'); }
      });
    }
  });
});

// ── Clear buttons ─────────────────────────────────────────────────────────────
function setupClear(inputEl, clearBtnEl) {
  inputEl.addEventListener('input', () => {
    clearBtnEl.classList.toggle('visible', inputEl.value.length > 0);
  });
  clearBtnEl.addEventListener('click', () => {
    inputEl.value = '';
    clearBtnEl.classList.remove('visible');
    inputEl.focus();
  });
}
setupClear(shortenInput, $('shorten-clear'));
setupClear(expandInput,  $('expand-clear'));

// ── Shorten ───────────────────────────────────────────────────────────────────
shortenBtn.addEventListener('click', doShorten);
shortenInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doShorten(); });

async function doShorten() {
  const url = shortenInput.value.trim();
  if (!url) { shake($('shorten-input-wrapper')); return; }
  if (!isValidUrl(url)) { showError(shortenError, 'Please enter a valid URL (e.g. https://example.com)'); return; }

  setLoading(shortenBtn, true);
  hideResult(shortenResult);
  hideError(shortenError);

  try {
    const short = await window.api.shortenUrl(url);
    shortenResultUrl.textContent = short;
    shortenResultUrl.href = short;
    showResult(shortenResult);

    // Store button urls for actions
    $('shorten-copy').dataset.url = short;
    $('shorten-open').dataset.url = short;
    $('shorten-qr').dataset.url  = short;

    addHistory('shorten', url, short);
    stats.shortened++;
    saveStats();
  } catch (err) {
    showError(shortenError, String(err));
  } finally {
    setLoading(shortenBtn, false);
  }
}

// ── Expand ────────────────────────────────────────────────────────────────────
expandBtn.addEventListener('click', doExpand);
expandInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doExpand(); });

async function doExpand() {
  const url = expandInput.value.trim();
  if (!url) { shake($('expand-input-wrapper')); return; }
  if (!isValidUrl(url)) { showError(expandError, 'Please enter a valid URL.'); return; }

  setLoading(expandBtn, true);
  hideResult(expandResult);
  hideError(expandError);

  try {
    const full = await window.api.expandUrl(url);
    expandResultUrl.textContent = full;
    expandResultUrl.href = full;
    showResult(expandResult);

    $('expand-copy').dataset.url = full;
    $('expand-open').dataset.url = full;

    addHistory('expand', url, full);
    stats.expanded++;
    saveStats();
  } catch (err) {
    showError(expandError, String(err));
  } finally {
    setLoading(expandBtn, false);
  }
}

// ── Copy buttons ──────────────────────────────────────────────────────────────
$('shorten-copy').addEventListener('click', async () => {
  await window.api.copyToClipboard($('shorten-copy').dataset.url);
  showToast('✓ Copied to clipboard!', 'success');
  pulseBtn($('shorten-copy'));
});
$('expand-copy').addEventListener('click', async () => {
  await window.api.copyToClipboard($('expand-copy').dataset.url);
  showToast('✓ Copied to clipboard!', 'success');
  pulseBtn($('expand-copy'));
});

// ── Open buttons ──────────────────────────────────────────────────────────────
$('shorten-open').addEventListener('click', () =>
  window.api.openExternal($('shorten-open').dataset.url));
$('expand-open').addEventListener('click', () =>
  window.api.openExternal($('expand-open').dataset.url));

// ── QR Code ───────────────────────────────────────────────────────────────────
$('shorten-qr').addEventListener('click', () =>
  openQRModal($('shorten-qr').dataset.url));

$('qr-close-btn').addEventListener('click', closeQRModal);
qrModal.addEventListener('click', (e) => { if (e.target === qrModal) closeQRModal(); });

function openQRModal(url) {
  currentQRUrl = url;
  qrUrlLabel.textContent = url;
  qrCodeContainer.innerHTML = '';
  new QRCode(qrCodeContainer, {
    text: url,
    width: 220,
    height: 220,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });
  qrModal.classList.add('open');
}

function closeQRModal() {
  qrModal.classList.remove('open');
}

$('qr-copy-url').addEventListener('click', async () => {
  await window.api.copyToClipboard(currentQRUrl);
  showToast('✓ URL copied!', 'success');
});

$('qr-download').addEventListener('click', () => {
  const canvas = qrCodeContainer.querySelector('canvas');
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'qrcode.png';
  link.href = canvas.toDataURL();
  link.click();
  showToast('✓ QR Code downloaded!', 'success');
});

// ── History Sidebar ───────────────────────────────────────────────────────────
$('open-history-btn').addEventListener('click', openHistory);
$('close-history-btn').addEventListener('click', closeHistory);
sidebarOverlay.addEventListener('click', closeHistory);
$('clear-history-btn').addEventListener('click', clearHistory);

function openHistory() {
  renderHistory();
  historySidebar.classList.add('open');
  sidebarOverlay.classList.add('active');
  gsap.fromTo('#history-sidebar',
    { x: 380 },
    { x: 0, duration: 0.4, ease: 'power3.out' }
  );
}

function closeHistory() {
  gsap.to('#history-sidebar', {
    x: 380, duration: 0.3, ease: 'power3.in',
    onComplete: () => {
      historySidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    }
  });
}

function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
  showToast('History cleared', 'success');
}

function addHistory(type, input, output) {
  history.unshift({
    type,
    input,
    output,
    time: new Date().toLocaleString(),
  });
  if (history.length > 100) history.pop();
  saveHistory();
}

function saveHistory() {
  localStorage.setItem('urlio-history', JSON.stringify(history));
  historyBadge.textContent = history.length;
}

function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="history-empty">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="1.5"/><path d="M24 16v8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <p>No history yet.<br/>Start shortening or expanding!</p>
      </div>`;
    return;
  }

  historyList.innerHTML = history.map((item, idx) => `
    <div class="history-item" data-idx="${idx}">
      <div class="history-item-meta">
        <span class="history-type ${item.type}">${item.type === 'shorten' ? '🔗 Shortened' : '🔍 Expanded'}</span>
        <span class="history-time">${item.time}</span>
      </div>
      <div class="history-input" title="${item.input}">${item.input}</div>
      <div class="history-output" title="${item.output}">${item.output}</div>
      <div class="history-item-actions">
        <button class="hi-btn" onclick="copyHistoryItem(${idx})">Copy result</button>
        <button class="hi-btn" onclick="window.api.openExternal('${item.output}')">Open</button>
        ${item.type === 'shorten' ? `<button class="hi-btn" onclick="openQRModal('${item.output}')">QR Code</button>` : ''}
      </div>
    </div>
  `).join('');
}

window.copyHistoryItem = async (idx) => {
  await window.api.copyToClipboard(history[idx].output);
  showToast('✓ Copied!', 'success');
};

// ── Stats ─────────────────────────────────────────────────────────────────────
function saveStats() {
  localStorage.setItem('urlio-stats', JSON.stringify(stats));
  gsap.to(statShortened, {
    innerText: stats.shortened,
    snap: { innerText: 1 },
    duration: 0.5,
    ease: 'power2.out',
  });
  gsap.to(statExpanded, {
    innerText: stats.expanded,
    snap: { innerText: 1 },
    duration: 0.5,
    ease: 'power2.out',
  });
  gsap.to(statTotal, {
    innerText: stats.shortened + stats.expanded,
    snap: { innerText: 1 },
    duration: 0.5,
    ease: 'power2.out',
  });
}

// ── Title bar controls ────────────────────────────────────────────────────────
$('tb-min').addEventListener('click',   () => window.api.minimize());
$('tb-max').addEventListener('click',   () => window.api.maximize());
$('tb-close').addEventListener('click', () => window.api.close());

// ── Helpers ───────────────────────────────────────────────────────────────────
function isValidUrl(str) {
  try { return ['http:', 'https:'].includes(new URL(str).protocol); }
  catch { return false; }
}

function setLoading(btn, on) {
  btn.disabled = on;
  btn.querySelector('.btn-text').style.display = on ? 'none' : 'inline';
  btn.querySelector('.btn-loader').style.display = on ? 'block' : 'none';
  btn.querySelector('.btn-icon').style.display = on ? 'none' : 'block';
}

function showResult(el) {
  el.classList.add('show');
  gsap.fromTo(el,
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
  );
}
function hideResult(el) {
  el.classList.remove('show');
}

function showError(el, msg) {
  el.textContent = '⚠ ' + msg;
  el.classList.add('show');
  gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3 });
}
function hideError(el) {
  el.classList.remove('show');
}

function shake(el) {
  gsap.fromTo(el,
    { x: -8 },
    { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
  );
}

function pulseBtn(btn) {
  gsap.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' });
}

let toastTimer;
function showToast(msg, type = '') {
  toast.textContent = msg;
  toast.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 2500);
}

// ── Initialize ────────────────────────────────────────────────────────────────
historyBadge.textContent = history.length;
statShortened.textContent = stats.shortened;
statExpanded.textContent  = stats.expanded;
statTotal.textContent     = stats.shortened + stats.expanded;
