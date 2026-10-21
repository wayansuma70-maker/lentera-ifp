/* =====================================================================
   LENTERA IFP — app.js : halaman login, pemulihan sesi, warm-up server
   ===================================================================== */
(function () {
  'use strict';
  const IFP = window.IFP, U = IFP.u, $ = U.$, $$ = U.$$, ui = IFP.ui, CFG = window.APP_CONFIG || {}, Store = IFP.Store;
  const configured = !!CFG.GAS_URL && !/GANTI/.test(CFG.GAS_URL);
  const yr = new Date().getFullYear();

  // ---- isi ikon & teks dinamis halaman login
  $$('#login [data-ic]').forEach(e => { e.innerHTML = U.ic(e.dataset.ic, +e.dataset.s || 18); });
  $('#lgVer').textContent = 'V' + (CFG.VERSI || '1.0'); $('#lgYr').textContent = yr; $('#lgCopy').textContent = '© ' + yr + ' Lentera IFP. Hak Cipta Dilindungi.';
  if (!configured) $('#cfgWarn').classList.remove('hide');
  $('#lgEmail').value = Store.get('lastEmail', '');

  // ---- tab peran (Guru Pengajar / Operator IFP)
  let role = Store.get('lastRole', 'guru');
  function setRole(r) {
    role = r === 'admin' ? 'admin' : 'guru';
    $$('.lg-tabs button').forEach(b => { const on = b.dataset.role === role; b.classList.toggle('on', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
    $('#lgEmail').placeholder = role === 'admin' ? 'operator@sekolah.sch.id' : 'nama@guru.sekolah.sch.id';
  }
  setRole(role);
  $$('.lg-tabs button').forEach(b => b.addEventListener('click', () => { setRole(b.dataset.role); $('#lgErr').classList.add('hide'); $('#lgEmail').focus(); }));

  // ---- tampil/sembunyi PIN
  $('#lgEye').addEventListener('click', () => {
    const p = $('#lgPin'), show = p.type === 'password'; p.type = show ? 'text' : 'password';
    $('#lgEye').innerHTML = U.ic(show ? 'eyeoff' : 'eye', 20); $('#lgEye').setAttribute('aria-label', show ? 'Sembunyikan PIN' : 'Tampilkan PIN');
  });

  // ---- bantuan PIN (reset dilakukan Operator)
  const bantuan = e => { e.preventDefault(); ui.modal('<h3>Lupa PIN atau belum punya akun?</h3><p class="muted">PIN dikelola oleh <b>Operator IFP</b> sekolah demi keamanan. Hubungi Operator untuk <b>reset PIN</b> atau untuk didaftarkan ke jadwal pemakaian IFP. Setelah PIN diberikan, Anda bisa langsung masuk dan menggantinya lewat menu akun → <b>Ubah PIN</b>.</p><div class="acts"><button class="btn p" data-close="1">Mengerti</button></div>', { noFocus: true }); };
  ['lgLupa', 'lgDiberi', 'lgHub'].forEach(id => $('#' + id).addEventListener('click', bantuan));

  // ---- status server (sekaligus menghangatkan Apps Script)
  const srv = $('#lgSrv'), srvSet = (c, t) => { srv.className = 'lg-pill ' + c; srv.querySelector('b').textContent = t; };
  if (!configured) srvSet('warn', 'Belum Dikonfigurasi');
  else IFP.api('ping', {}, { quiet: true, timeout: 20000 }).then(r => (r.success ? srvSet('ok', 'Siap Digunakan') : srvSet('bad', 'Tidak Terjangkau')));

  // ---- proses masuk
  async function login() {
    const email = $('#lgEmail').value.trim(), pin = $('#lgPin').value.trim(), err = $('#lgErr'), btn = $('#lgBtn');
    const show = m => { err.textContent = m; err.classList.toggle('hide', !m); };
    show('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { show('Masukkan alamat email yang valid.'); $('#lgEmail').focus(); return; }
    if (!pin) { show('Masukkan kode PIN Anda.'); $('#lgPin').focus(); return; }
    btn.dataset.busy = 'Memeriksa…';
    await ui.busy(btn, async () => {
      const r = await IFP.api('login', { email: email, pin: pin });
      if (!r.success) return show(r.message || 'Gagal masuk.');
      const real = r.data.user.role;
      if (real !== role) {
        setRole(real);
        return show(real === 'admin' ? 'Akun ini terdaftar sebagai Operator IFP. Pilihan tab sudah disesuaikan — tekan Masuk sekali lagi.' : 'Akun ini terdaftar sebagai Guru Pengajar. Pilihan tab sudah disesuaikan — tekan Masuk sekali lagi.');
      }
      const rem = $('#lgRem').checked;
      Store.clear(rem ? ['lastEmail', 'lastRole'] : []);
      if (rem) { Store.set('lastEmail', email); Store.set('lastRole', role); }
      IFP.start(r.data.token, r.data.user, r.data.boot, { persist: rem });
      $('#lgPin').value = '';
    });
  }
  $('#lgBtn').addEventListener('click', login);
  ['lgEmail', 'lgPin'].forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') login(); }));

  // ---- pulihkan sesi: tampilkan cache seketika, segarkan di latar belakang
  const tok = Store.get('token', ''), user = Store.get('user', null);
  if (tok && user) {
    const boot = Store.get('boot:' + user.email, null);
    if (boot) { IFP.start(tok, user, boot); IFP.refresh(false); }
    else { IFP.state.token = tok; IFP.state.user = user; IFP.api('bootstrap', {}).then(r => { if (r.success) IFP.start(tok, user, r.data); else IFP.logout(); }); }
  }

  if (configured) {
    try { const o = new URL(CFG.GAS_URL).origin; ['preconnect', 'dns-prefetch'].forEach(rel => { const l = document.createElement('link'); l.rel = rel; l.href = o; document.head.appendChild(l); }); } catch (e) {}
    const warm = () => { fetch(CFG.GAS_URL + '?w=' + Date.now(), { mode: 'no-cors' }).catch(() => {}); };
    setInterval(() => { if (!document.hidden && IFP.state.token) warm(); }, 240000);          // cegah cold-start
    setInterval(() => { if (!document.hidden && IFP.state.token) IFP.refresh(false); }, 90000);   // data tetap segar
    document.addEventListener('visibilitychange', () => { if (!document.hidden && IFP.state.token) IFP.refresh(false); });
  }
})();
