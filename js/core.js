/* =====================================================================
   LENTERA IFP — core.js
   Utilitas • ikon • Store • API (retry+idempotensi) • SWR • UI • grafik • router • shell
   Pola gas-instant-ux-pro: render dari cache dulu, sinkron di latar belakang.
   ===================================================================== */
(function () {
  'use strict';
  const CFG = window.APP_CONFIG || {};
  const IFP = window.IFP = { pages: {}, state: { token: '', user: null, boot: null, lastMs: 0, page: '', param: '' }, ui: {}, u: {}, subs: [] };
  const state = IFP.state;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  Object.assign(IFP.u, { $, $$, esc, sleep, uid, debounce });

  // ---------------------------------------------------------------- waktu
  const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const BLN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const p2 = n => ('0' + n).slice(-2);
  function nowWIB() { const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60000); return { tgl: d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()), jam: p2(d.getHours()) + ':' + p2(d.getMinutes()), d }; }
  const parseD = s => { const p = String(s).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); };
  const addDays = (s, n) => { const d = parseD(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dow = s => parseD(s).getUTCDay();
  const weekStart = s => { const w = dow(s); return addDays(s, w === 0 ? -6 : 1 - w); };
  const fmtTgl = s => { if (!s) return '-'; const p = String(s).split('-'); return (+p[2]) + ' ' + BLN3[+p[1] - 1] + ' ' + p[0]; };
  const fmtTglL = s => HARI[dow(s)] + ', ' + fmtTgl(s);
  const toMin = h => { const p = String(h || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); };
  const fromMin = m => p2(Math.floor(m / 60)) + ':' + p2(m % 60);
  const initials = n => String(n || '?').replace(/[^A-Za-zÀ-ž ]/g, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const fmtWaktu = s => { if (!s) return '-'; const d = String(s).replace('T', ' '); return fmtTgl(d.slice(0, 10)) + ' ' + d.slice(11, 16); };
  const num = n => Number(n || 0).toLocaleString('id-ID');
  Object.assign(IFP.u, { BLN, BLN3, HARI, nowWIB, parseD, addDays, dow, weekStart, fmtTgl, fmtTglL, toMin, fromMin, initials, fmtWaktu, num, p2 });
  IFP.u.bulanLabel = k => BLN3[+k.slice(5, 7) - 1];

  // ---------------------------------------------------------------- ikon (SVG inline, tanpa CDN)
  const IC = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
    plus: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
    pdf: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    users: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    bell: '<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    checkc: '<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/>',
    download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15"/>',
    tv: '<rect x="2" y="7" width="20" height="13" rx="2"/><path d="M17 2l-5 5-5-5"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    chevL: '<path d="M15 18l-6-6 6-6"/>', chevR: '<path d="M9 18l6-6-6-6"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    chat: '<path d="M21 11.5a8.4 8.4 0 01-12.6 7.3L3 21l1.8-5.2A8.4 8.4 0 1121 11.5z"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.7-4 3-9 3s-9-1.3-9-3M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
    user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    chart: '<path d="M18 20V10M12 20V4M6 20v-6"/>',
    bolt: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    open: '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>',
    stop: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>',
    more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    star: '<path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    eyeoff: '<path d="M17.9 17.9A10.1 10.1 0 0112 20c-7 0-11-8-11-8a18.5 18.5 0 015.1-5.9M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M1 1l22 22M14.1 14.1a3 3 0 11-4.2-4.2"/>',
    layers: '<path d="M12 2L2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>'
  };
  const ic = (n, s, cls) => '<svg class="ic ' + (cls || '') + '" width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || IC.info) + '</svg>';
  IFP.u.ic = ic;

  // ---------------------------------------------------------------- penyimpanan lokal
  const LS = 'ifp:v1:';
  const Store = IFP.Store = {
    get(k, d) { try { const v = localStorage.getItem(LS + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(LS + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(LS + k); } catch (e) {} },
    clear(keep) { try { Object.keys(localStorage).filter(k => k.indexOf(LS) === 0 && !(keep || []).some(x => k === LS + x)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  };

  // ---------------------------------------------------------------- API
  let pending = 0;
  function prog(on) {
    pending += on ? 1 : -1; const b = $('#topbarProg'); if (!b) return;
    if (pending > 0) { b.style.opacity = 1; b.style.width = '72%'; } else { b.style.width = '100%'; setTimeout(() => { if (pending <= 0) { b.style.opacity = 0; b.style.width = '0'; } }, 250); }
  }
  const WRITE_RE = /\.(save|batal|resetPin|import|jalankan|blastCreate|blastStop|sync|bulk|interaksi|merge|pdf|retry|configSave|processNow|kirim|validate)$|^(ubahPin|logoutSemua)$/;
  async function api(action, data, opt) {
    opt = opt || {};
    if (!CFG.GAS_URL || /GANTI/.test(CFG.GAS_URL)) return { success: false, message: 'Alamat backend (GAS_URL) belum diisi di js/config.js.', data: { code: 'CONFIG' } };
    const reqId = WRITE_RE.test(action) ? (opt.reqId || uid()) : '';
    const body = JSON.stringify({ action, data: data || {}, token: state.token || '', reqId });
    if (!opt.quiet) prog(true);
    try {
      for (let i = 0; i < 3; i++) {
        const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), opt.timeout || 50000);
        try {
          const r = await fetch(CFG.GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow', signal: ctrl.signal });
          clearTimeout(to);
          let res; try { res = JSON.parse(await r.text()); } catch (e) { throw new Error('Respons server tidak valid'); }
          state.lastMs = res.ms || 0; IFP.emit('latency');
          if (res.data && res.data.code === 'AUTH' && state.token && action !== 'login') IFP.logout('Sesi berakhir. Silakan masuk lagi.');
          return res;
        } catch (e) { clearTimeout(to); if (i < 2) await sleep(600 * (i + 1)); }
      }
      return { success: false, message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', data: { code: 'NET' } };
    } finally { if (!opt.quiet) prog(false); }
  }
  /** Seperti api() tetapi melempar Error bila gagal; mengembalikan data. */
  async function A(action, data, opt) { const r = await api(action, data, opt); if (!r.success) { const e = new Error(r.message || 'Gagal'); e.res = r; throw e; } return r.data; }
  IFP.api = api; IFP.A = A;

  /** Stale-while-revalidate: render cache seketika, lalu data terbaru bila berbeda. */
  async function swr(key, action, data, render, opt) {
    const ck = 'c:' + (state.user ? state.user.email : '') + ':' + key, hit = Store.get(ck);
    if (hit) render(hit.d, true);
    try {
      const res = await api(action, data, Object.assign({ quiet: !!hit }, opt));
      if (res.success) { const s = JSON.stringify(res.data); if (!hit || s !== JSON.stringify(hit.d)) { if (state.persist !== false) Store.set(ck, { d: res.data, t: Date.now() }); render(res.data, false); } return res.data; }
      if (!hit) throw new Error(res.message);
    } catch (e) { if (!hit) throw e; }
  }
  IFP.swr = swr;

  // ---------------------------------------------------------------- event bus
  IFP.on = (ev, fn) => { IFP.subs.push([ev, fn]); };
  IFP.emit = ev => { IFP.subs.forEach(s => { if (s[0] === ev) { try { s[1](); } catch (e) { console.error(e); } } }); };

  // ---------------------------------------------------------------- data boot
  IFP.setBoot = function (b, persist) {
    state.boot = b;
    if (b && b.user && persist !== false && state.persist !== false) Store.set('boot:' + b.user.email, b);
    IFP.emit('boot');
  };
  IFP.refresh = async function (force) {
    const r = await api('bootstrap', { force: !!force }, { quiet: true });
    if (r.success) IFP.setBoot(r.data);
    return r.success;
  };
  /** Patch lokal (optimistic) tanpa menunggu server. */
  IFP.patchJadwal = function (j) {
    const b = state.boot; if (!b) return; const i = b.jadwal.findIndex(x => x.id_jadwal === j.id_jadwal);
    if (i > -1) b.jadwal[i] = Object.assign({}, b.jadwal[i], j); else b.jadwal.push(j);
    IFP.emit('boot');
  };
  IFP.ensureRange = async function (dari, sampai) {
    const b = state.boot; if (!b || state.user.role !== 'admin') return;
    const has = {}; b.jadwal.forEach(j => { has[j.id_jadwal] = 1; });
    const r = await api('jadwal.list', { dari, sampai }, { quiet: true });
    if (r.success) { let n = 0; r.data.forEach(j => { if (!has[j.id_jadwal]) { b.jadwal.push(j); n++; } }); if (n) IFP.emit('boot'); }
  };

  // ---------------------------------------------------------------- logika jadwal (lokal, tanpa delay)
  const S = () => (state.boot && state.boot.setting) || {};
  IFP.sesiState = function (j, n) {
    n = n || nowWIB(); if (j.status === 'Dibatalkan') return 'cancel';
    const now = n.tgl + ' ' + n.jam, st = j.tanggal + ' ' + j.jam_mulai, en = j.tanggal + ' ' + j.jam_selesai;
    if (now >= st && now < en) return 'live';
    if (now >= en) return j.status_jurnal === 'Sudah Diisi' ? 'done' : 'wait';
    return 'next';
  };
  IFP.findConflict = (tgl, m, s, ex) => { const a = toMin(m), b = toMin(s); return (state.boot ? state.boot.jadwal : []).filter(j => j.tanggal === tgl && j.status !== 'Dibatalkan' && j.id_jadwal !== ex && toMin(j.jam_mulai) < b && toMin(j.jam_selesai) > a)[0] || null; };
  IFP.suggestSlots = (tgl, dur, prefer, ex) => {
    const o0 = toMin(S().JAM_OPS_MULAI || '07:00'), o1 = toMin(S().JAM_OPS_SELESAI || '16:00'), gaps = [];
    const busy = (state.boot ? state.boot.jadwal : []).filter(j => j.tanggal === tgl && j.status !== 'Dibatalkan' && j.id_jadwal !== ex).map(j => [toMin(j.jam_mulai), toMin(j.jam_selesai)]).sort((x, y) => x[0] - y[0]);
    let cur = o0; busy.forEach(b => { if (b[0] - cur >= dur) gaps.push([cur, b[0]]); cur = Math.max(cur, b[1]); }); if (o1 - cur >= dur) gaps.push([cur, o1]);
    return gaps.map(g => ({ mulai: fromMin(g[0]), selesai: fromMin(g[0] + dur) })).sort((x, y) => Math.abs(toMin(x.mulai) - prefer) - Math.abs(toMin(y.mulai) - prefer)).slice(0, 3);
  };
  const KOND = { 'Baik': ['ok', 'Baik / Normal'], 'Perlu Perhatian': ['warn', 'Perlu Perhatian'], 'Rusak': ['bad', 'Rusak / Gangguan'] };
  IFP.u.kondBadge = k => { const x = KOND[k] || ['mute', k || '-']; return '<span class="badge ' + x[0] + '">' + (k === 'Rusak' ? '<i class="pulse"></i>' : '') + esc(x[1]) + '</span>'; };
  IFP.u.stBadge = st => ({ done: '<span class="badge ok">' + ic('check', 12) + ' Jurnal Sudah Diisi</span>', live: '<span class="badge info">● LIVE</span>', wait: '<span class="badge warn">Menunggu Pengisian Jurnal</span>', next: '<span class="badge mute">Terjadwal</span>', cancel: '<span class="badge mute">Dibatalkan</span>' }[st]);

  // ---------------------------------------------------------------- UI
  const ui = IFP.ui;
  ui.toast = function (msg, type, ms) {
    const el = document.createElement('div'); el.className = 'toast ' + (type || ''); el.setAttribute('role', 'status');
    el.innerHTML = ic(type === 'bad' ? 'alert' : type === 'ok' ? 'checkc' : 'info', 18) + '<div>' + esc(msg) + '</div>';
    $('#toasts').appendChild(el); setTimeout(() => { el.style.opacity = 0; el.style.transition = 'opacity .25s'; setTimeout(() => el.remove(), 260); }, ms || (type === 'bad' ? 6000 : 3200));
  };
  ui.modal = function (html, o) {
    o = o || {}; const sc = document.createElement('div'); sc.className = 'scrim'; sc.innerHTML = '<div class="modal ' + (o.wide ? 'wide' : '') + '" role="dialog" aria-modal="true">' + html + '</div>';
    const close = v => { sc.remove(); document.removeEventListener('keydown', esck); if (o.onClose) o.onClose(v); };
    const esck = e => { if (e.key === 'Escape') close(); };
    sc.addEventListener('mousedown', e => { if (e.target === sc) close(); }); document.addEventListener('keydown', esck);
    $('#overlay').appendChild(sc); $$('[data-close]', sc).forEach(b => b.addEventListener('click', () => close(b.dataset.close)));
    const f = $('input,select,textarea', sc); if (f && !o.noFocus) f.focus();
    return { el: sc, $: s => $(s, sc), $$: s => $$(s, sc), close };
  };
  ui.confirm = (title, msg, o) => new Promise(res => {
    o = o || {}; let done = false; const m = ui.modal('<h3>' + esc(title) + '</h3><p class="muted">' + msg + '</p><div class="acts"><button class="btn s" data-close="0">Batal</button><button class="btn ' + (o.danger ? 'd' : 'p') + '" data-close="1">' + esc(o.ok || 'Ya, lanjutkan') + '</button></div>', { noFocus: true, onClose: v => { if (!done) { done = true; res(v === '1'); } } });
  });
  ui.drawer = function (html) {
    const sc = document.createElement('div'); sc.className = 'scrim'; sc.style.justifyContent = 'flex-end'; sc.style.padding = 0;
    sc.innerHTML = '<aside class="drawer" role="dialog" aria-modal="true">' + html + '</aside>'; const close = () => sc.remove();
    sc.addEventListener('mousedown', e => { if (e.target === sc) close(); }); $('#overlay').appendChild(sc); $$('[data-close]', sc).forEach(b => b.addEventListener('click', close));
    return { el: sc, $: s => $(s, sc), $$: s => $$(s, sc), close };
  };
  /** Jalankan aksi async pada tombol: disable + spinner, aman dari klik ganda. */
  ui.busy = async function (btn, fn) {
    if (!btn || btn.disabled) return; const h = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> ' + (btn.dataset.busy || 'Memproses…');
    try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = h; }
  };
  ui.fld = (label, inner, hint, cls) => '<div class="fld ' + (cls || '') + '"><label>' + label + '</label>' + inner + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</div>';
  ui.empty = (icon, t, s) => '<div class="empty">' + ic(icon || 'info', 36) + '<div><b>' + esc(t) + '</b></div>' + (s ? '<div class="t-sm">' + esc(s) + '</div>' : '') + '</div>';
  ui.skeleton = n => Array.from({ length: n || 3 }, () => '<div class="sk" style="height:56px;margin-bottom:10px"></div>').join('');
  ui.copy = async t => { try { await navigator.clipboard.writeText(t); ui.toast('Disalin ke papan klip', 'ok'); } catch (e) { ui.toast('Salin manual: ' + t, 'warn', 8000); } };
  ui.pageHtml = (el, key, html) => { if (el['_h' + key] !== html) { el['_h' + key] = html; el.innerHTML = html; return true; } return false; };

  // ---------------------------------------------------------------- CSV
  const csvCell = v => { const s = String(v == null ? '' : v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  IFP.u.toCSV = (rows, cols) => '\ufeff' + [cols.map(c => csvCell(c[1])).join(',')].concat(rows.map(r => cols.map(c => csvCell(typeof c[0] === 'function' ? c[0](r) : r[c[0]])).join(','))).join('\r\n');
  IFP.u.download = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  IFP.u.parseCSV = text => {
    text = String(text).replace(/^\ufeff/, ''); const first = text.split(/\r?\n/)[0] || '', delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : (first.indexOf('\t') > -1 ? '\t' : ',');
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === delim) { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (c !== '\r') cur += c;
    }
    row.push(cur); rows.push(row); const filled = rows.filter(r => r.join('').trim() !== ''); if (!filled.length) return [];
    const h = filled[0].map(x => x.toLowerCase().replace(/[^a-z0-9]/g, ''));
    return filled.slice(1).map(r => { const o = {}; h.forEach((k, i) => { o[k] = (r[i] || '').trim(); }); return o; });
  };

  // ---------------------------------------------------------------- grafik SVG ringan
  const niceStep = v => { const e = Math.pow(10, Math.floor(Math.log10(v || 1))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
  IFP.chart = {
    bars(d, o) {
      o = o || {}; const W = 640, H = 270, pl = 38, pb = 34, pt = 12, pr = 8, mx = Math.max(4, ...d.map(x => Math.max(x.a || 0, x.b || 0, x.t || 0)));
      const step = niceStep(mx * 1.1 / 4), top = step * 4, y = v => pt + (H - pt - pb) * (1 - v / top), band = (W - pl - pr) / d.length, bw = Math.min(26, band / 3.2);
      let g = '', bars = '', lab = '', tp = [];
      for (let i = 0; i <= 4; i++) { const v = i * step; g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#E2E8F0" stroke-dasharray="' + (i ? '3 3' : '0') + '"/><text x="' + (pl - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>'; }
      d.forEach((x, i) => {
        const cx = pl + band * i + band / 2;
        bars += '<rect x="' + (cx - bw - 1) + '" y="' + y(x.a) + '" width="' + bw + '" height="' + Math.max(0, y(0) - y(x.a)) + '" rx="4" fill="#1E40AF"><title>' + esc(x.label) + ': ' + x.a + ' sesi</title></rect>';
        bars += '<rect x="' + (cx + 1) + '" y="' + y(x.b) + '" width="' + bw + '" height="' + Math.max(0, y(0) - y(x.b)) + '" rx="4" fill="#059669"><title>' + esc(x.label) + ': ' + x.b + ' jurnal terisi</title></rect>';
        lab += '<text x="' + cx + '" y="' + (H - 16) + '" text-anchor="middle" font-weight="600">' + esc(x.label) + '</text><text x="' + cx + '" y="' + (H - 3) + '" text-anchor="middle">' + (x.sub || '') + '</text>';
        if (x.t != null) tp.push(cx + ',' + y(x.t));
      });
      const line = tp.length > 1 ? '<polyline points="' + tp.join(' ') + '" fill="none" stroke="#D97706" stroke-width="2" stroke-dasharray="5 4"/>' : '';
      return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik batang') + '">' + g + bars + line + lab + '</svg></div>';
    },
    donut(items, centerTop, centerSub) {
      const tot = items.reduce((s, x) => s + x.val, 0) || 1; let a = -90, p = '';
      items.forEach(x => { if (!x.val) return; const f = x.val / tot, ang = f * 360, r = 52, c = 2 * Math.PI * r; p += '<circle r="' + r + '" cx="70" cy="70" fill="none" stroke="' + x.color + '" stroke-width="16" stroke-dasharray="' + (f * c - 1) + ' ' + c + '" transform="rotate(' + a + ' 70 70)"/>'; a += ang; });
      return '<div class="chart" style="max-width:200px;margin:0 auto"><svg viewBox="0 0 140 140" role="img" aria-label="Distribusi"><circle r="52" cx="70" cy="70" fill="none" stroke="#F1F5F9" stroke-width="16"/>' + p + '<text x="70" y="72" text-anchor="middle" style="font:700 22px var(--font);fill:#0F172A">' + esc(centerTop) + '</text><text x="70" y="88" text-anchor="middle" style="font-size:9px;letter-spacing:.06em">' + esc(centerSub || '') + '</text></svg></div>';
    }
  };

  // ---------------------------------------------------------------- router & shell
  const NAV = [
    { g: 'UTAMA', items: [{ k: 'dashboard', t: 'Dashboard & Statistik', i: 'dash' }, { k: 'jadwal-saya', t: 'Jadwal Saya', i: 'cal', roles: ['guru'] }, { k: 'jadwal', t: 'Jadwal IFP & Deteksi Bentrok', i: 'cal', roles: ['admin'] }] },
    { g: 'JURNAL KBM', items: [{ k: 'jurnal', t: 'Jurnal Saya', i: 'edit', roles: ['guru'] }, { k: 'jurnal', t: 'Semua Jurnal', i: 'book', roles: ['admin'] }, { k: 'jurnal-baru', t: 'Input Jurnal Baru', i: 'plus' }] },
    { g: 'KELOLA & LAPORAN', roles: ['admin'], items: [{ k: 'rekap', t: 'Rekap Laporan & Cetak PDF', i: 'pdf' }, { k: 'guru', t: 'Kelola Guru & Akun', i: 'users' }, { k: 'notifikasi', t: 'WhatsApp & Notifikasi', i: 'chat' }, { k: 'crm', t: 'CRM Kontak', i: 'tag' }, { k: 'migrasi', t: 'Migrasi Data', i: 'db' }, { k: 'pengaturan', t: 'Pengaturan', i: 'gear' }] }
  ];
  const TITLES = { dashboard: 'Dashboard & Statistik', 'jadwal-saya': 'Jadwal Saya', jadwal: 'Kelola Jadwal', jurnal: 'Jurnal', 'jurnal-baru': 'Input Jurnal', rekap: 'Rekap Laporan', guru: 'Kelola Guru', notifikasi: 'WhatsApp & Notifikasi', crm: 'CRM Kontak', migrasi: 'Migrasi Data', pengaturan: 'Pengaturan' };
  const ADMIN_PAGES = ['jadwal', 'rekap', 'guru', 'notifikasi', 'crm', 'migrasi', 'pengaturan'];
  ADMIN_PAGES.forEach(k => { IFP.pages[k] = { title: TITLES[k], roles: ['admin'], lazy: true }; });
  IFP.register = (name, def) => { IFP.pages[name] = Object.assign({ title: TITLES[name] || name }, IFP.pages[name], def, { lazy: false }); };
  IFP.nav = (name, param) => { location.hash = '#/' + name + (param ? '/' + encodeURIComponent(param) : ''); };
  let adminLoad = null;
  IFP.loadAdmin = () => adminLoad || (adminLoad = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/pages-admin.js'; s.onload = res; s.onerror = () => { adminLoad = null; rej(new Error('Gagal memuat modul admin')); }; document.head.appendChild(s); }));

  const navItems = () => NAV.filter(g => !g.roles || g.roles.includes(state.user.role)).map(g => ({ g: g.g, items: g.items.filter(i => !i.roles || i.roles.includes(state.user.role)) }));
  function buildShell() {
    const u = state.user, s = S(), items = navItems();
    $('#sidebar').innerHTML = '<div class="brand"><div class="logo">' + ic('tv', 22) + '</div><div><b>Lentera IFP</b><small>SISTEM JADWAL &amp; JURNAL</small></div></div>' +
      '<div class="unit-chip">' + ic('tv', 16) + '<span>Unit Aktif:</span><b>' + esc(s.LOKASI_IFP || '-') + '</b></div><nav class="nav" aria-label="Menu utama">' +
      items.map(g => '<div class="nav-g">' + g.g + '</div>' + g.items.map(i => '<a href="#/' + i.k + '" data-k="' + i.k + '" title="' + esc(i.t) + '">' + ic(i.i, 20) + '<span>' + esc(i.t) + '</span></a>').join('')).join('') + '</nav>' +
      '<div class="side-foot" id="sideFoot"><i></i><span>GAS Backend Connected<br>v' + esc(CFG.VERSI || '1.0') + ' • Apps Script API</span></div>';
    $('#topbar').innerHTML = '<span class="tchip hide-m">' + ic('book', 14) + ' T.A. ' + esc(s.TAHUN_AJARAN || '') + '</span><span class="tchip ok hide-m"><i></i>Unit IFP: ' + esc(s.UNIT_IFP || '') + '</span><span class="grow"></span>' +
      '<div class="rolechip"><span class="' + (u.role === 'admin' ? 'on' : '') + '">Operator IFP</span><span class="' + (u.role === 'guru' ? 'on' : '') + '">Guru KBM</span></div>' +
      '<button class="ibtn" id="bellBtn" aria-label="Notifikasi">' + ic('bell', 20) + '<span class="dot hide" id="bellDot"></span></button>' +
      '<button class="userbtn" id="userBtn" aria-label="Menu akun"><div><b>' + esc(u.nama) + '</b><small>' + (u.role === 'admin' ? 'Operator IFP' : 'Guru KBM') + '</small></div><span class="avatar">' + esc(initials(u.nama)) + '</span></button>';
    const bn = u.role === 'admin' ? [['dashboard', 'Beranda', 'dash'], ['jadwal', 'Jadwal', 'cal'], ['jurnal', 'Jurnal', 'book'], ['rekap', 'Rekap', 'pdf']] : [['dashboard', 'Beranda', 'dash'], ['jadwal-saya', 'Jadwal', 'cal'], ['jurnal-baru', 'Isi Jurnal', 'plus'], ['jurnal', 'Jurnal', 'edit']];
    $('#bottomnav').innerHTML = bn.map(x => '<a href="#/' + x[0] + '" data-k="' + x[0] + '">' + ic(x[2], 22) + x[1] + '</a>').join('') + '<button id="moreBtn">' + ic('more', 22) + 'Lainnya</button>';
    $('#verTxt').textContent = '© ' + new Date().getFullYear() + ' Lentera IFP • ' + (s.NAMA_SEKOLAH || '');
    $('#userBtn').onclick = e => { e.stopPropagation(); toggleMenu('<button id="mPin">' + ic('key', 18) + ' Ubah PIN</button><button id="mOut">' + ic('logout', 18) + ' Keluar</button>', { '#mPin': changePin, '#mOut': () => IFP.logout() }); };
    $('#bellBtn').onclick = e => { e.stopPropagation(); bellMenu(); };
    $('#moreBtn').onclick = () => { const m = ui.modal('<h3>Menu</h3><div class="nav" style="margin:-8px">' + navItems().map(g => g.items.map(i => '<a href="#/' + i.k + '" data-close="1">' + ic(i.i, 20) + '<span style="display:inline">' + esc(i.t) + '</span></a>').join('')).join('') + '<a href="#" id="mm1" data-close="1">' + ic('key', 20) + '<span style="display:inline">Ubah PIN</span></a><a href="#" id="mm2" data-close="1">' + ic('logout', 20) + '<span style="display:inline">Keluar</span></a></div>', { noFocus: true }); m.$('#mm1').onclick = e => { e.preventDefault(); changePin(); }; m.$('#mm2').onclick = e => { e.preventDefault(); IFP.logout(); }; };
    updateBell(); updateNavActive();
  }
  function toggleMenu(html, handlers) {
    const old = $('.menu'); if (old) { old.remove(); return; }
    const m = document.createElement('div'); m.className = 'menu'; m.innerHTML = html; $('#topbar').appendChild(m);
    Object.keys(handlers).forEach(sel => { const b = $(sel, m); if (b) b.onclick = () => { m.remove(); handlers[sel](); }; });
    setTimeout(() => document.addEventListener('click', function f() { m.remove(); document.removeEventListener('click', f); }), 0);
  }
  function bellMenu() {
    const t = (state.boot && state.boot.tertunggak) || [];
    const h = t.length ? '<div class="t-xs muted" style="padding:6px 12px">' + t.length + ' jurnal belum diisi</div>' + t.slice(0, 5).map((j, i) => '<button data-i="' + i + '"><span><b class="t-sm">' + esc(j.kelas) + ' • ' + esc(j.mata_pelajaran) + '</b><br><span class="t-xs muted">' + fmtTgl(j.tanggal) + ' ' + j.jam_mulai + (state.user.role === 'admin' ? ' • ' + esc(j.nama_guru) : '') + '</span></span></button>').join('') : '<div class="t-sm muted" style="padding:12px">Semua jurnal sudah terisi 🎉</div>';
    const m = $('.menu'); if (m) { m.remove(); return; }
    toggleMenu(h, {}); const mm = $('.menu'); if (mm) { mm.style.minWidth = '260px'; $$('button', mm).forEach(b => { b.onclick = () => { const j = t[+b.dataset.i]; mm.remove(); IFP.nav('jurnal-baru', j.id_jadwal); }; }); }
  }
  function updateBell() { const d = $('#bellDot'); if (d) d.classList.toggle('hide', !((state.boot && state.boot.tertunggak) || []).length); }
  IFP.on('boot', updateBell);
  function updateNavActive() { const k = state.page; $$('#sidebar .nav a,#bottomnav a').forEach(a => a.classList.toggle('on', a.dataset.k === k)); }
  function changePin() {
    const m = ui.modal('<h3>Ubah PIN</h3><div class="col">' + ui.fld('PIN lama', '<input id="pl" type="password" inputmode="numeric" maxlength="8">') + ui.fld('PIN baru (4–8 angka)', '<input id="pb" type="password" inputmode="numeric" maxlength="8">') + '</div><div class="acts"><button class="btn s" data-close="1">Batal</button><button class="btn p" id="ok">Simpan</button></div>');
    m.$('#ok').onclick = e => ui.busy(e.currentTarget, async () => { try { await A('ubahPin', { pinLama: m.$('#pl').value, pinBaru: m.$('#pb').value }); ui.toast('PIN berhasil diubah', 'ok'); m.close(); } catch (er) { ui.toast(er.message, 'bad'); } });
  }

  async function show(name, param) {
    let def = IFP.pages[name];
    if (!def) { IFP.nav('dashboard'); return; }
    if (def.roles && !def.roles.includes(state.user.role)) { IFP.nav('dashboard'); return; }
    if (def.lazy) { try { await IFP.loadAdmin(); } catch (e) { ui.toast(e.message, 'bad'); return; } def = IFP.pages[name]; if (!def || def.lazy) return; }
    const host = $('#pages'); let el = $('#p-' + name);
    if (!el) { el = document.createElement('section'); el.className = 'page'; el.id = 'p-' + name; host.appendChild(el); if (def.init) def.init(el); }
    const same = state.page === name;
    $$('.page', host).forEach(p => p.classList.toggle('active', p === el));
    state.page = name; state.param = param || ''; document.title = (def.title || name) + ' • Lentera IFP'; updateNavActive();
    if (def.show) def.show(el, param || '');
    if (!same) window.scrollTo(0, 0);
  }
  IFP.route = function () {
    const h = location.hash.replace(/^#\/?/, '').split('/'), name = h[0] || 'dashboard', param = h[1] ? decodeURIComponent(h[1]) : '';
    if (!state.token || !state.user) return;
    show(name, param);
  };
  IFP.rerender = () => { const def = IFP.pages[state.page]; const el = $('#p-' + state.page); if (def && el && def.update) def.update(el); };
  IFP.on('boot', () => IFP.rerender());
  window.addEventListener('hashchange', () => IFP.route());

  // ---------------------------------------------------------------- sesi
  IFP.start = function (token, user, boot, opt) {
    state.persist = !(opt && opt.persist === false);
    state.token = token; state.user = user; if (state.persist) { Store.set('token', token); Store.set('user', user); }
    IFP.setBoot(boot); document.body.classList.add('in'); buildShell();
    if (!location.hash || location.hash === '#/' || location.hash === '#') location.hash = '#/dashboard'; else IFP.route();
    if (user.role === 'admin') { const pre = () => IFP.loadAdmin().catch(() => {}); if (window.requestIdleCallback) window.requestIdleCallback(pre, { timeout: 2000 }); else setTimeout(pre, 1200); }
  };
  IFP.logout = function (msg) {
    const email = state.user && state.user.email; state.token = ''; state.user = null; state.boot = null; state.page = '';
    Store.clear(['lastEmail']); Store.set('lastEmail', email || Store.get('lastEmail', ''));
    document.body.classList.remove('in'); $('#pages').innerHTML = ''; $('#overlay').innerHTML = ''; location.hash = '';
    const e = $('#lgEmail'); if (e) e.value = Store.get('lastEmail', ''); const er = $('#lgErr'); if (er) { er.classList.toggle('hide', !msg); er.textContent = msg || ''; } const p = $('#lgPin'); if (p) p.value = '';
  };
  IFP.sidebarLatency = () => { const f = $('#sideFoot span'); if (f) f.innerHTML = 'GAS Backend Connected<br>' + (state.lastMs ? state.lastMs + ' ms' : 'v' + esc(CFG.VERSI || '1.0')) + ' • Apps Script API'; };
  IFP.on('latency', () => IFP.sidebarLatency());
})();
