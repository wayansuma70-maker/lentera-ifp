/* =====================================================================
   LENTERA IFP — pages-admin.js  (dimuat otomatis saat Operator login)
   Kelola Jadwal • Rekap & PDF • Kelola Guru • Pengaturan • Notifikasi • CRM • Migrasi
   ===================================================================== */
(function () {
  'use strict';
  const IFP = window.IFP, U = IFP.u, ui = IFP.ui, A = IFP.A, esc = U.esc, ic = U.ic, $ = U.$, $$ = U.$$;
  const B = () => IFP.state.boot;
  const SET = () => (B() && B().setting) || {};
  const pillSw = (id, on) => '<label class="sw"><input type="checkbox" id="' + id + '" ' + (on ? 'checked' : '') + '><i></i></label>';
  const pager = (hal, per, total, act) => '<div class="pager"><span>Menampilkan ' + Math.min(total, (hal - 1) * per + 1) + '–' + Math.min(total, hal * per) + ' dari ' + total + '</span><span class="row"><button class="btn sm s" data-act="' + act + '" data-h="' + (hal - 1) + '" ' + (hal <= 1 ? 'disabled' : '') + '>Sebelumnya</button><span>Hal ' + hal + ' dari ' + Math.max(1, Math.ceil(total / per)) + '</span><button class="btn sm s" data-act="' + act + '" data-h="' + (hal + 1) + '" ' + (hal * per >= total ? 'disabled' : '') + '>Berikutnya</button></span></div>';
  let guruCache = null;
  async function loadGuru(force) { if (!guruCache || force) { guruCache = await A('guru.list', {}, { quiet: true }); IFP.guruOpts = guruCache.filter(x => x.peran === 'Guru').map(x => ({ id: x.id_pengguna, nama: x.nama })); } return guruCache; }

  // =================================================================== KELOLA JADWAL
  const JD = { week: null, view: 'cal', sel: null, form: null, aud: { hal: 1, cari: '' }, audit: null, saving: false };
  function jdForm(f) {
    const guru = (guruCache || []).filter(g => g.status === 'Aktif' && g.peran === 'Guru');
    const conf = f.tanggal && f.jam_mulai && f.jam_selesai && U.toMin(f.jam_mulai) < U.toMin(f.jam_selesai) ? IFP.findConflict(f.tanggal, f.jam_mulai, f.jam_selesai, f.id_jadwal || '') : null;
    const sar = conf ? IFP.suggestSlots(f.tanggal, U.toMin(f.jam_selesai) - U.toMin(f.jam_mulai), U.toMin(f.jam_mulai), f.id_jadwal || '') : [];
    return '<div class="card"><div class="card-h"><h3>' + ic(f.id_jadwal ? 'edit' : 'plus', 20) + (f.id_jadwal ? 'Ubah Jadwal IFP' : 'Tambah Jadwal IFP Baru') + '</h3><span class="badge info">1 Unit Only</span></div><div class="col">' +
      ui.fld('Pilih Guru Pengampu <span class="faint" style="text-transform:none">(' + guru.length + ' guru aktif)</span>', '<select id="jfG"><option value="">— Pilih nama guru —</option>' + guru.map(g => '<option value="' + g.id_pengguna + '" ' + (f.id_guru === g.id_pengguna ? 'selected' : '') + '>' + esc(g.nama) + '</option>').join('') + '</select>') +
      ui.fld('Tanggal Pelaksanaan', '<input type="date" id="jfT" value="' + esc(f.tanggal || '') + '">') +
      '<div class="f2">' + ui.fld('Jam Mulai', '<input type="time" id="jfM" value="' + esc(f.jam_mulai || '') + '">') + ui.fld('Jam Selesai', '<input type="time" id="jfS" value="' + esc(f.jam_selesai || '') + '">') + '</div>' +
      '<div class="f2">' + ui.fld('Kelas Sasaran', '<input id="jfK" maxlength="40" value="' + esc(f.kelas || '') + '" placeholder="XI MIPA 2">') + ui.fld('Mata Pelajaran', '<input id="jfP" maxlength="80" value="' + esc(f.mata_pelajaran || '') + '" placeholder="Matematika Peminatan">') + '</div>' +
      ui.fld('Topik Materi IFP (Opsional)', '<input id="jfTp" maxlength="200" value="' + esc(f.topik || '') + '" placeholder="Cth: Eksplorasi Geogebra 3D">') +
      (conf ? '<div class="alert bad" id="jfConf">' + ic('alert', 20) + '<div><b>Bentrok Jadwal Terdeteksi (1 Unit IFP)!</b><div class="t-sm">Tabrakan dengan ' + esc(conf.nama_guru) + ' (' + esc(conf.mata_pelajaran) + ' ' + esc(conf.kelas) + ') pada ' + conf.jam_mulai + '–' + conf.jam_selesai + '.</div>' +
        (sar.length ? '<div class="mt-s t-sm"><b>Rekomendasi slot kosong terdekat:</b></div><div class="row wrap mt-s">' + sar.map(s => '<button class="btn sm s" data-act="slot" data-m="' + s.mulai + '" data-s="' + s.selesai + '">Gunakan ' + s.mulai + ' – ' + s.selesai + '</button>').join('') + '</div>' : '<div class="t-sm mt-s">Tidak ada slot kosong sepanjang jam operasional pada hari itu.</div>') + '</div></div>' : '') +
      '<button class="btn p lg" id="jfSave" ' + (conf ? 'disabled' : '') + ' data-busy="Menyimpan…">' + ic('check', 18) + ' ' + (f.id_jadwal ? 'Simpan Perubahan' : 'Simpan ke Google Sheets') + '</button>' +
      '<div class="row">' + (f.id_jadwal ? '<button class="btn od grow" data-act="cancel">' + ic('trash', 16) + ' Batalkan Sesi</button>' : '') + '<button class="btn s grow" data-act="reset">Reset Form</button></div></div></div>';
  }
  function jdCal(today) {
    const b = B(), ws = JD.week, days = []; const has6 = b.jadwal.some(j => j.status !== 'Dibatalkan' && U.dow(j.tanggal) === 6 && j.tanggal >= ws && j.tanggal <= U.addDays(ws, 6));
    for (let i = 0; i < (has6 ? 6 : 5); i++) days.push(U.addDays(ws, i));
    return '<div class="cal ' + (has6 ? 'six' : '') + '">' + days.map(d => {
      const list = b.jadwal.filter(j => j.tanggal === d).sort((a, c) => a.jam_mulai.localeCompare(c.jam_mulai));
      return '<div class="cal-d ' + (d === today ? 'today' : '') + '"><h4>' + U.HARI[U.dow(d)] + '<small>' + U.fmtTgl(d) + (d === today ? ' • Hari Ini' : '') + '</small></h4>' + (list.map(j => {
        const st = IFP.sesiState(j), cls = j.status === 'Dibatalkan' ? 'cancel' : j.status_jurnal === 'Sudah Diisi' ? 'ok' : (st === 'wait' || st === 'live') ? 'wait' : '';
        return '<button class="cal-c ' + cls + (JD.sel === j.id_jadwal ? ' sel' : '') + '" data-act="edit" data-id="' + j.id_jadwal + '"><span class="tm">' + j.jam_mulai + ' – ' + j.jam_selesai + '</span> ' + (j.status === 'Dibatalkan' ? '<span class="badge mute">Batal</span>' : j.status_jurnal === 'Sudah Diisi' ? '<span class="badge ok">✓</span>' : st === 'next' ? '' : '<span class="badge warn">Belum</span>') + '<b>' + esc(j.mata_pelajaran) + '</b><small>' + esc(j.nama_guru) + '</small><br><small class="mono">' + esc(j.kelas) + '</small></button>';
      }).join('') || '<div class="faint t-xs center" style="padding:16px 4px">Slot tersedia</div>') + '</div>';
    }).join('') + '</div>';
  }
  function jdTable() {
    const b = B(), ws = JD.week, we = U.addDays(ws, 6), list = b.jadwal.filter(j => j.tanggal >= ws && j.tanggal <= we).sort((a, c) => (a.tanggal + a.jam_mulai).localeCompare(c.tanggal + c.jam_mulai));
    return list.length ? '<div class="tw"><table class="t"><thead><tr><th>Tanggal</th><th>Jam</th><th>Guru</th><th>Kelas</th><th>Mapel</th><th>Jurnal</th><th></th></tr></thead><tbody>' + list.map(j => '<tr' + (j.status === 'Dibatalkan' ? ' style="opacity:.5"' : '') + '><td class="nowrap">' + U.fmtTglL(j.tanggal) + '</td><td class="mono nowrap">' + j.jam_mulai + '–' + j.jam_selesai + '</td><td>' + esc(j.nama_guru) + '</td><td>' + esc(j.kelas) + '</td><td>' + esc(j.mata_pelajaran) + '</td><td>' + (j.status === 'Dibatalkan' ? '<span class="badge mute">Dibatalkan</span>' : j.status_jurnal === 'Sudah Diisi' ? '<span class="badge ok">Sudah</span>' : '<span class="badge warn">Belum</span>') + '</td><td class="right"><button class="btn sm s" data-act="edit" data-id="' + j.id_jadwal + '">Ubah</button></td></tr>').join('') + '</tbody></table></div>' : ui.empty('cal', 'Tidak ada jadwal pada minggu ini');
  }
  function jdHtml() {
    const b = B(), today = U.nowWIB().tgl, ws = JD.week, we = U.addDays(ws, 6), wk = b.jadwal.filter(j => j.tanggal >= ws && j.tanggal <= we && j.status !== 'Dibatalkan');
    const due = wk.filter(j => IFP.sesiState(j) === 'done' || IFP.sesiState(j) === 'wait'), terisi = wk.filter(j => j.status_jurnal === 'Sudah Diisi').length;
    let menit = 0; wk.forEach(j => { menit += U.toMin(j.jam_selesai) - U.toMin(j.jam_mulai); });
    const kapMenit = 5 * (U.toMin(SET().JAM_OPS_SELESAI || '16:00') - U.toMin(SET().JAM_OPS_MULAI || '07:00')), kosong = Math.max(0, Math.round((kapMenit - menit) / 60));
    return '<div class="row between wrap mb"><div><span class="eyebrow">' + esc(SET().LOKASI_IFP) + ' • ' + esc(SET().SERIAL_IFP) + '</span><h1>Kelola Jadwal Giliran IFP</h1><p class="muted">Sistem pencegah tabrakan jadwal otomatis untuk 1 Unit Interaktif Flat Panel secara terpusat.</p></div>' +
      '<div class="col" style="gap:8px;align-items:flex-end"><div class="tabs" style="margin:0"><button data-act="view" data-v="cal" class="' + (JD.view === 'cal' ? 'on' : '') + '">Kalender Minggu</button><button data-act="view" data-v="tbl" class="' + (JD.view === 'tbl' ? 'on' : '') + '">Tampilan Daftar Tabel</button></div>' +
      '<div class="row wrap" style="justify-content:flex-end"><button class="btn s sm" data-act="wk" data-d="-7" aria-label="Minggu lalu">' + ic('chevL', 16) + '</button><b class="t-sm nowrap">' + U.fmtTgl(ws) + ' – ' + U.fmtTgl(U.addDays(ws, 5)) + '</b><button class="btn s sm" data-act="wk" data-d="7" aria-label="Minggu depan">' + ic('chevR', 16) + '</button><button class="btn s sm" data-act="wk" data-d="0">Hari ini</button></div></div></div>' +
      '<div class="card mb row wrap" style="background:var(--primary-bg)"><span class="ico b" style="width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:#fff;color:var(--primary)">' + ic('shield', 22) + '</span><div class="grow" style="min-width:220px"><b>Aturan Sistem 1 Unit IFP Aktif</b> <span class="badge ok">Google Sheets LockService Ready</span><div class="t-sm muted">Hanya tersedia 1 unit IFP untuk seluruh guru. Sistem otomatis mendeteksi dan menolak pemesanan pada jam dan tanggal yang sama untuk mencegah tabrakan; setiap transaksi dikunci atomik dan tercatat di audit trail.</div></div><button class="btn s sm" data-act="sim">Uji Simulasi Bentrok</button></div>' +
      '<div class="grid g-jadwal"><div class="stack"><div class="card"><div class="row between wrap mb"><div class="legend"><span><i style="background:var(--ok)"></i>Jurnal Sudah Diisi</span><span><i style="background:var(--warn)"></i>Jurnal Belum Diisi</span><span><i style="background:var(--bad)"></i>Slot Terkunci / Bentrok</span></div><span class="t-xs faint">Klik kartu untuk ubah</span></div>' + (JD.view === 'cal' ? jdCal(today) : jdTable()) + '</div>' +
      '<div class="grid g3"><div class="card kpi"><span class="ico b">' + ic('cal', 20) + '</span><div class="lab">Total Terjadwal Minggu Ini</div><div class="val">' + wk.length + '<small>Sesi KBM</small></div><div class="foot">' + Math.round(menit / 60) + ' jam pelajaran aktif</div></div>' +
      '<div class="card kpi"><span class="ico g">' + ic('checkc', 20) + '</span><div class="lab">Jurnal Terisi Lengkap</div><div class="val">' + terisi + '<small>Sesi (' + (due.length ? Math.round(terisi * 1000 / Math.max(1, due.length)) / 10 : 0) + '%)</small></div><div class="foot">' + Math.max(0, due.length - terisi) + ' sesi menunggu guru</div></div>' +
      '<div class="card kpi"><span class="ico a">' + ic('clock', 20) + '</span><div class="lab">Sisa Kuota IFP Minggu Ini</div><div class="val">' + kosong + '<small>Jam kosong</small></div><div class="foot">Siap direservasi guru</div></div></div></div>' +
      '<div id="jdForm">' + jdForm(JD.form) + '</div></div>' +
      '<div class="card p0 mt"><div class="card-h" style="padding:20px 24px 0"><div><h3>' + ic('list', 20) + 'Audit Log & Riwayat Perubahan Jadwal</h3><p class="muted t-sm">Tercatat permanen pada lembar Google Spreadsheet.</p></div><div class="row"><input class="inp" id="auCari" placeholder="Cari guru, mapel, aksi…" value="' + esc(JD.aud.cari) + '"><button class="btn s" data-act="auCsv">' + ic('download', 16) + ' Ekspor CSV</button></div></div><div id="auBody">' + auditHtml() + '</div></div>';
  }
  function auditHtml() {
    const a = JD.audit; if (!a) return '<div style="padding:16px 24px">' + ui.skeleton(3) + '</div>';
    const cls = { 'Reservasi Baru': 'info', 'Reschedule Sesi': 'warn', 'Ditolak Bentrok': 'bad', 'Dibatalkan': 'mute' };
    return '<div class="tw"><table class="t"><thead><tr><th>Waktu</th><th>Guru & Mapel</th><th>Jadwal Sesi</th><th>Aksi Sistem</th><th>Dibuat Oleh</th><th>Status Lock</th></tr></thead><tbody>' + (a.rows.map(r => '<tr class="' + (r.aksi === 'Ditolak Bentrok' ? 'hl' : '') + '"><td class="mono nowrap t-xs">' + U.fmtWaktu(r.waktu) + '</td><td><b>' + esc(r.nama_guru) + '</b><br><span class="muted t-xs">' + esc(r.mata_pelajaran) + '</span></td><td class="mono t-xs">' + esc(r.sesi) + '</td><td><span class="badge ' + (cls[r.aksi] || 'mute') + '">' + esc(r.aksi) + '</span></td><td>' + esc(r.oleh) + '</td><td class="t-xs ' + (r.status_lock.indexOf('Aborted') > -1 ? '' : '') + '" style="color:' + (r.status_lock.indexOf('Aborted') > -1 ? 'var(--bad)' : 'var(--ok)') + ';font-weight:700">' + esc(r.status_lock) + '</td></tr>').join('') || '<tr><td colspan="6" class="center muted" style="padding:24px">Belum ada riwayat</td></tr>') + '</tbody></table></div>' + pager(a.halaman, a.per, a.total, 'auPage');
  }
  const loadAudit = U.debounce(async el => { try { JD.audit = await A('audit.list', { halaman: JD.aud.hal, per: 8, cari: JD.aud.cari }, { quiet: true }); const b = $('#auBody', el); if (b) b.innerHTML = auditHtml(); } catch (e) {} }, 250);
  function readJd(el) { return { id_jadwal: JD.form.id_jadwal || '', id_guru: $('#jfG', el).value, tanggal: $('#jfT', el).value, jam_mulai: $('#jfM', el).value, jam_selesai: $('#jfS', el).value, kelas: $('#jfK', el).value.trim(), mata_pelajaran: $('#jfP', el).value.trim(), topik: $('#jfTp', el).value.trim() }; }
  function redrawForm(el) { const f = $('#jdForm', el); const act = document.activeElement && document.activeElement.id; f.innerHTML = jdForm(JD.form); if (act) { const n = $('#' + act, f); if (n && n.type !== 'time' && n.type !== 'date') n.focus(); } }
  const newForm = () => ({ id_jadwal: '', id_guru: '', tanggal: U.nowWIB().tgl, jam_mulai: '', jam_selesai: '', kelas: '', mata_pelajaran: '', topik: '' });
  IFP.register('jadwal', {
    init(el) {
      el.addEventListener('input', e => {
        const id = e.target.id;
        if (id === 'auCari') { JD.aud.cari = e.target.value; JD.aud.hal = 1; loadAudit(el); return; }
        if (/^jf/.test(id)) { JD.form = readJd(el); if (id === 'jfT' || id === 'jfM' || id === 'jfS') redrawForm(el); }
      });
      el.addEventListener('change', e => { if (/^jf(T|M|S)$/.test(e.target.id)) { JD.form = readJd(el); redrawForm(el); } });
      el.addEventListener('click', async e => {
        const t = e.target.closest('[data-act],#jfSave'); if (!t) return; const a = t.dataset.act || 'save';
        if (a === 'view') { JD.view = t.dataset.v; this.update(el); }
        else if (a === 'wk') { JD.week = t.dataset.d === '0' ? U.weekStart(U.nowWIB().tgl) : U.addDays(JD.week, +t.dataset.d); this.update(el); IFP.ensureRange(JD.week, U.addDays(JD.week, 6)); }
        else if (a === 'edit') { const j = B().jadwal.find(x => x.id_jadwal === t.dataset.id); if (j) { JD.sel = j.id_jadwal; JD.form = { id_jadwal: j.id_jadwal, id_guru: j.id_guru, tanggal: j.tanggal, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, kelas: j.kelas, mata_pelajaran: j.mata_pelajaran, topik: j.topik || '' }; this.update(el); $('#jdForm', el).scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } }
        else if (a === 'reset') { JD.sel = null; JD.form = newForm(); this.update(el); }
        else if (a === 'slot') { JD.form = readJd(el); JD.form.jam_mulai = t.dataset.m; JD.form.jam_selesai = t.dataset.s; redrawForm(el); }
        else if (a === 'sim') {
          const j = B().jadwal.filter(x => x.status !== 'Dibatalkan' && x.tanggal >= U.nowWIB().tgl)[0] || B().jadwal.filter(x => x.status !== 'Dibatalkan')[0];
          if (!j) { ui.toast('Belum ada jadwal untuk disimulasikan. Buat satu jadwal dulu.', 'warn'); return; }
          JD.form = { id_jadwal: '', id_guru: j.id_guru, tanggal: j.tanggal, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai, kelas: 'SIMULASI', mata_pelajaran: 'Uji Bentrok', topik: '' }; JD.week = U.weekStart(j.tanggal); this.update(el); ui.toast('Form diisi dengan jam yang sama dengan jadwal yang ada. Perhatikan peringatan bentrok.', 'warn', 5000);
        }
        else if (a === 'cancel') {
          if (!await ui.confirm('Batalkan sesi ini?', 'Jadwal akan ditandai <b>Dibatalkan</b> dan slot IFP dibebaskan. Guru dapat diberi tahu lewat notifikasi.', { danger: true, ok: 'Ya, batalkan' })) return;
          const id = JD.form.id_jadwal, j = B().jadwal.find(x => x.id_jadwal === id), old = j.status; IFP.patchJadwal({ id_jadwal: id, status: 'Dibatalkan' });
          try { await A('jadwal.batal', { id_jadwal: id }); ui.toast('Jadwal dibatalkan', 'ok'); JD.form = newForm(); JD.sel = null; this.update(el); loadAudit(el); IFP.refresh(true); } catch (er) { IFP.patchJadwal({ id_jadwal: id, status: old }); ui.toast(er.message, 'bad'); }
        }
        else if (a === 'auPage') { JD.aud.hal = +t.dataset.h; loadAudit(el); }
        else if (a === 'auCsv') { const d = await A('audit.list', { halaman: 1, per: 50, cari: JD.aud.cari }); U.download('audit_jadwal.csv', U.toCSV(d.rows, [['waktu', 'Waktu'], ['nama_guru', 'Guru'], ['mata_pelajaran', 'Mapel'], ['sesi', 'Sesi'], ['aksi', 'Aksi'], ['oleh', 'Oleh'], ['status_lock', 'Status Lock']])); }
        else if (a === 'save') {
          const f = readJd(el); JD.form = f;
          if (!f.id_guru) { ui.toast('Pilih guru pengampu', 'bad'); return; }
          if (!f.tanggal || !f.jam_mulai || !f.jam_selesai) { ui.toast('Lengkapi tanggal dan jam', 'bad'); return; }
          if (!f.kelas || !f.mata_pelajaran) { ui.toast('Kelas dan mata pelajaran wajib diisi', 'bad'); return; }
          if (U.toMin(f.jam_mulai) >= U.toMin(f.jam_selesai)) { ui.toast('Jam selesai harus setelah jam mulai', 'bad'); return; }
          if (IFP.findConflict(f.tanggal, f.jam_mulai, f.jam_selesai, f.id_jadwal)) { redrawForm(el); return; }
          await ui.busy(t, async () => {
            const r = await IFP.api('jadwal.save', f);
            if (!r.success) { if (r.data && r.data.code === 'BENTROK') { ui.toast(r.message, 'bad', 7000); IFP.refresh(true); } else ui.toast(r.message, 'bad'); return; }
            IFP.patchJadwal(r.data.jadwal); ui.toast(r.message, 'ok'); JD.week = U.weekStart(f.tanggal); JD.form = newForm(); JD.sel = null; this.update(el); loadAudit(el); IFP.refresh(true);
          });
        }
      });
    },
    update(el) { if (!JD.form) JD.form = newForm(); if (!JD.week) JD.week = U.weekStart(U.nowWIB().tgl); el.innerHTML = jdHtml(); },
    async show(el, param) {
      if (!JD.form || param === 'baru') { JD.form = newForm(); JD.sel = null; if (param === 'baru') history.replaceState(null, '', '#/jadwal'); }
      this.update(el); try { await loadGuru(); const f = $('#jdForm', el); if (f) f.innerHTML = jdForm(JD.form); } catch (e) { ui.toast(e.message, 'bad'); }
      JD.audit = null; loadAudit(el); IFP.ensureRange(JD.week, U.addDays(JD.week, 6));
    }
  });

  // =================================================================== REKAP & PDF
  const RK = { dari: '', sampai: '', guru: '', data: null, arsip: null };
  function rekapHtml() {
    const d = RK.data, s = SET(), n = U.nowWIB();
    if (!RK.dari) { RK.dari = n.tgl.slice(0, 8) + '01'; RK.sampai = n.tgl; }
    const head = '<div class="row between wrap mb"><div><span class="eyebrow">' + ic('shield', 14) + ' Modul F10 • Validasi Administrasi & Pelaporan</span><h1>Rekap Laporan & Cetak PDF IFP</h1><p class="muted">Pusat pembuatan laporan pertanggungjawaban pemakaian fasilitas IFP dan ekspor dokumen PDF resmi siap cetak.</p></div></div>' +
      '<div class="card mb"><div class="row wrap" style="align-items:flex-end;gap:14px">' + ui.fld('Dari tanggal', '<input type="date" id="rkD" value="' + RK.dari + '">') + ui.fld('Sampai tanggal', '<input type="date" id="rkS" value="' + RK.sampai + '">') +
      ui.fld('Guru', '<select id="rkG"><option value="">Semua guru</option>' + (IFP.guruOpts || []).map(g => '<option value="' + g.id + '" ' + (RK.guru === g.id ? 'selected' : '') + '>' + esc(g.nama) + '</option>').join('') + '</select>') +
      '<span class="grow"></span><button class="btn s" data-act="csv">' + ic('download', 16) + ' Ekspor CSV</button><button class="btn s" data-act="print">' + ic('pdf', 16) + ' Cetak / Simpan PDF Browser</button><button class="btn p" data-act="pdf" data-busy="Membuat PDF…">' + ic('upload', 16) + ' Buat PDF & Simpan ke Drive</button></div></div>';
    if (!d) return head + '<div class="grid g4">' + [1, 2, 3, 4].map(() => '<div class="card"><div class="sk" style="height:70px"></div></div>').join('') + '</div>';
    const r = d.ringkas;
    const kp = '<div class="grid g4 kp mb">' + [['Total Terjadwal', r.terjadwal, 'Sesi', 'b', 'cal', 'Utilisasi ' + r.utilisasi + '% dari kapasitas'], ['Jurnal Terverifikasi', r.terverifikasi, '(' + r.pctTerisi + '%)', 'g', 'checkc', 'Lengkap dengan data KBM'], ['Jurnal Tertunggak', r.tertunggak, 'Jadwal', 'a', 'clock', 'Pengingat otomatis aktif'], ['Kendala Alat / Insiden', r.kendala, 'Catatan', 'r', 'alert', 'Perlu tindak lanjut sarpras']]
      .map(x => '<div class="card kpi"><span class="ico ' + x[3] + '">' + ic(x[4], 20) + '</span><div class="lab">' + x[0] + '</div><div class="val">' + x[1] + '<small>' + x[2] + '</small></div><div class="foot">' + x[5] + '</div></div>').join('') + '</div>';
    const rows = d.rows.slice(0, 300);
    const doc = '<div class="a4" id="rekapDoc"><div class="kop"><h4>' + esc(s.NAMA_INSTANSI) + '</h4><h3>' + esc(s.NAMA_SEKOLAH) + '</h3><div>' + esc(s.ALAMAT_SEKOLAH) + ' ' + esc(s.KONTAK_SEKOLAH) + '</div></div>' +
      '<h3 class="center" style="text-decoration:underline;font-size:15px">LAPORAN REKAPITULASI PENGGUNAAN INTERAKTIF FLAT PANEL (IFP)</h3><p class="center">PERIODE OPERASIONAL: ' + U.fmtTgl(d.dari).toUpperCase() + ' S.D. ' + U.fmtTgl(d.sampai).toUpperCase() + '<br>Unit Perangkat: ' + esc(s.UNIT_IFP) + ' – ' + esc(s.MERK_IFP) + '</p>' +
      '<div class="f2 mt mb" style="background:var(--primary-bg);padding:12px 16px;border-radius:10px"><div>Tahun Pelajaran: <b>' + esc(s.TAHUN_AJARAN) + ' – Semester ' + esc(s.SEMESTER) + '</b><br>Total Jam Terpakai: <b>' + r.jamTerpakai + ' jam</b></div><div>Tingkat Utilisasi: <b class="mono" style="color:var(--ok)">' + r.utilisasi + '% dari kapasitas</b><br>Jurnal Terisi: <b>' + r.pctTerisi + '%</b></div></div>' +
      '<table><thead><tr><th>No</th><th>Tanggal & Jam</th><th>Nama Guru</th><th>Kelas</th><th>Mata Pelajaran</th><th>Materi</th><th>Kondisi Alat</th><th>Bukti</th></tr></thead><tbody>' + (rows.map((j, i) => '<tr><td>' + (i + 1) + '</td><td class="mono">' + U.fmtTgl(j.tanggal) + '<br>' + j.jam_mulai + '–' + j.jam_selesai + '</td><td>' + esc(j.nama_guru) + '</td><td>' + esc(j.kelas) + '</td><td>' + esc(j.mata_pelajaran) + '</td><td>' + esc(j.materi) + '</td><td>' + esc(j.kondisi_ifp) + (j.kendala ? '<br><i>' + esc(j.kendala) + '</i>' : '') + '</td><td>' + (j.link_foto ? 'Foto Drive' : '-') + '</td></tr>').join('') || '<tr><td colspan="8" class="center">Tidak ada jurnal pada periode ini</td></tr>') + '</tbody></table>' +
      '<p class="muted t-xs mt-s">Menampilkan ' + rows.length + ' dari ' + d.rows.length + ' jurnal pada periode.</p><div class="ttd"><div>Mengetahui & Memverifikasi,<br><b>Pengelola / Operator Sarpras IFP</b><br><br><br><br><u><b>' + esc(s.NAMA_OPERATOR || '..................') + '</b></u><br>NIP. ' + esc(s.NIP_OPERATOR || '') + '</div><div>' + U.fmtTgl(n.tgl) + '<br><b>Kepala Sekolah</b><br><br><br><br><u><b>' + esc(s.NAMA_KEPALA || '..................') + '</b></u><br>NIP. ' + esc(s.NIP_KEPALA || '') + '</div></div></div>';
    const arsip = '<div class="card mt"><div class="card-h"><h3>' + ic('db', 20) + 'Arsip Rekap PDF di Google Drive</h3><span class="t-sm muted">Google Drive › IFP-Rekap-PDF</span></div>' + (RK.arsip ? (RK.arsip.length ? '<div class="grid g3">' + RK.arsip.map(a => '<a class="card flat row" href="' + esc(a.url) + '" target="_blank" rel="noopener" style="color:inherit">' + ic('pdf', 28) + '<div class="grow"><b class="t-sm" style="word-break:break-all">' + esc(a.nama_file) + '</b><div class="t-xs muted mono">' + a.ukuran_kb + ' KB • ' + U.fmtWaktu(a.dibuat_pada) + '</div></div>' + ic('open', 16) + '</a>').join('') + '</div>' : '<span class="muted">Belum ada arsip.</span>') : ui.skeleton(1)) + '</div>';
    return head + kp + '<div class="eyebrow mb">Pratinjau Dokumen Resmi Siap Cetak (A4)</div>' + doc + arsip;
  }
  const loadRekap = U.debounce(async el => {
    try { RK.data = await A('rekap.data', { dari: RK.dari, sampai: RK.sampai, guru: RK.guru }, { quiet: true }); } catch (e) { ui.toast(e.message, 'bad'); }
    keep(el);
  }, 300);
  function keep(el) { const a = document.activeElement && document.activeElement.id; el.innerHTML = rekapHtml(); if (a) { const n = $('#' + a, el); if (n) n.focus(); } }
  IFP.register('rekap', {
    init(el) {
      el.addEventListener('change', e => { const t = e.target; if (t.id === 'rkD') RK.dari = t.value; else if (t.id === 'rkS') RK.sampai = t.value; else if (t.id === 'rkG') RK.guru = t.value; else return; RK.data = null; keep(el); loadRekap(el); });
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-act]'); if (!t || !RK.data) return; const a = t.dataset.act;
        if (a === 'csv') U.download('rekap_ifp_' + RK.dari + '_' + RK.sampai + '.csv', U.toCSV(RK.data.rows, [['tanggal', 'Tanggal'], ['jam_mulai', 'Mulai'], ['jam_selesai', 'Selesai'], ['nama_guru', 'Guru'], ['kelas', 'Kelas'], ['mata_pelajaran', 'Mapel'], ['materi', 'Materi'], ['kondisi_ifp', 'Kondisi IFP'], ['kendala', 'Kendala'], ['link_foto', 'Foto']]));
        else if (a === 'print') { document.body.classList.add('printing'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); }, 80); }
        else if (a === 'pdf') ui.busy(t, async () => { try { const r = await A('rekap.pdf', { dari: RK.dari, sampai: RK.sampai, guru: RK.guru }); ui.toast('PDF tersimpan di Google Drive', 'ok'); window.open(r.url, '_blank', 'noopener'); RK.arsip = await A('rekap.arsip', {}, { quiet: true }); keep(el); } catch (er) { ui.toast(er.message, 'bad'); } });
      });
    },
    update(el) { if (!el._rk) keep(el); },
    async show(el) { el._rk = 1; await loadGuru().catch(() => {}); keep(el); loadRekap(el); try { RK.arsip = await A('rekap.arsip', {}, { quiet: true }); keep(el); } catch (e) {} }
  });

  // =================================================================== KELOLA GURU & AKUN
  const GR = { q: '' };
  function guruHtml() {
    const all = guruCache, q = GR.q.toLowerCase(), rows = all ? all.filter(g => !q || (g.nama + ' ' + g.email + ' ' + g.nip).toLowerCase().indexOf(q) > -1) : [];
    const waBadge = g => !g.no_wa ? '<span class="faint">-</span>' : g.status_wa === 'Terdaftar' ? '<span class="badge ok">WA aktif</span>' : g.status_wa === 'Tidak Terdaftar' ? '<span class="badge bad">Bukan WA</span>' : '<span class="badge mute">Belum dicek</span>';
    return '<div class="row between wrap mb"><div><h1>Kelola Guru & Akun</h1><p class="muted">Akun login guru (email + PIN), nomor WhatsApp, dan status akses.</p></div><div class="row wrap"><button class="btn s" data-act="imp">' + ic('upload', 16) + ' Impor CSV</button><button class="btn p" data-act="add">' + ic('plus', 16) + ' Tambah Guru</button></div></div>' +
      '<div class="card p0"><div style="padding:16px 16px 0"><div class="tools"><div class="row grow" style="position:relative"><input class="inp" id="grQ" placeholder="Cari nama, email, NIP…" value="' + esc(GR.q) + '" style="padding-left:38px;width:100%"><span style="position:absolute;left:12px;top:12px;color:var(--ink3)">' + ic('search', 18) + '</span></div></div></div>' +
      (all ? '<div class="tw"><table class="t"><thead><tr><th>Nama</th><th>Email</th><th>NIP</th><th>WhatsApp</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody>' + rows.map(g => '<tr><td><b>' + esc(g.nama) + '</b></td><td class="mono t-xs">' + esc(g.email) + '</td><td class="mono t-xs">' + esc(g.nip || '-') + '</td><td class="mono t-xs">' + esc(g.no_wa || '-') + '<br>' + waBadge(g) + '</td><td><span class="badge ' + (g.peran === 'Admin' ? 'info' : 'mute') + '">' + (g.peran === 'Admin' ? 'Operator' : 'Guru') + '</span></td><td><span class="badge ' + (g.status === 'Aktif' ? 'ok' : 'mute') + '">' + esc(g.status) + '</span></td><td class="right nowrap"><button class="btn sm s" data-act="edit" data-id="' + g.id_pengguna + '">Ubah</button> <button class="btn sm s" data-act="pin" data-id="' + g.id_pengguna + '" title="Reset PIN">' + ic('key', 14) + '</button></td></tr>').join('') + '</tbody></table></div><div class="pager"><span>' + rows.length + ' akun</span></div>' : '<div style="padding:16px">' + ui.skeleton(5) + '</div>') + '</div>';
  }
  function pinModal(title, list) {
    const m = ui.modal('<h3>' + esc(title) + '</h3><div class="alert warn mb">' + ic('alert', 18) + '<div>Catat/unduh PIN sekarang. PIN <b>tidak dapat dilihat lagi</b> setelah jendela ini ditutup.</div></div><div class="tw"><table class="t"><thead><tr><th>Nama</th><th>Email</th><th>PIN</th></tr></thead><tbody>' + list.map(x => '<tr><td>' + esc(x.nama) + '</td><td class="mono t-xs">' + esc(x.email) + '</td><td class="mono"><b>' + esc(x.pin) + '</b></td></tr>').join('') + '</tbody></table></div><div class="acts"><button class="btn s" id="pCsv">' + ic('download', 16) + ' Unduh CSV</button><button class="btn p" data-close="1">Selesai</button></div>', { wide: list.length > 1, noFocus: true });
    m.$('#pCsv').onclick = () => U.download('akun_baru_ifp.csv', U.toCSV(list, [['nama', 'Nama'], ['email', 'Email'], ['pin', 'PIN']]));
  }
  function guruForm(g) {
    g = g || {}; const edit = !!g.id_pengguna;
    const m = ui.modal('<h3>' + (edit ? 'Ubah Data Guru' : 'Tambah Guru Baru') + '</h3><div class="col">' + ui.fld('Nama lengkap *', '<input id="gN" value="' + esc(g.nama || '') + '" maxlength="80">') + ui.fld('Email (untuk login) *', '<input id="gE" type="email" value="' + esc(g.email || '') + '">') +
      '<div class="f2">' + ui.fld('NIP / ID Guru', '<input id="gI" value="' + esc(g.nip || '') + '">') + ui.fld('No. WhatsApp', '<input id="gW" inputmode="tel" value="' + esc(g.no_wa || '') + '" placeholder="0812xxxxxxxx">') + '</div>' +
      '<div class="f2">' + ui.fld('Peran', '<select id="gP"><option value="Guru" ' + (g.peran !== 'Admin' ? 'selected' : '') + '>Guru</option><option value="Admin" ' + (g.peran === 'Admin' ? 'selected' : '') + '>Operator (Admin)</option></select>') + ui.fld('Status', '<select id="gS"><option ' + (g.status !== 'Nonaktif' ? 'selected' : '') + '>Aktif</option><option ' + (g.status === 'Nonaktif' ? 'selected' : '') + '>Nonaktif</option></select>') + '</div>' +
      (edit ? '' : ui.fld('PIN awal (kosongkan = dibuat acak)', '<input id="gPin" inputmode="numeric" maxlength="8" placeholder="6 digit acak otomatis">')) + '</div><div class="acts"><button class="btn s" data-close="1">Batal</button><button class="btn p" id="gOk" data-busy="Menyimpan…">Simpan</button></div>');
    m.$('#gOk').onclick = e => ui.busy(e.currentTarget, async () => {
      try {
        const r = await A('guru.save', { id_pengguna: g.id_pengguna || '', nama: m.$('#gN').value, email: m.$('#gE').value, nip: m.$('#gI').value, no_wa: m.$('#gW').value, peran: m.$('#gP').value, status: m.$('#gS').value, pin: edit ? '' : m.$('#gPin').value });
        m.close(); await loadGuru(true); IFP.rerender(); const el = $('#p-guru'); if (el) el.innerHTML = guruHtml(); IFP.refresh(true);
        if (r.pinBaru) pinModal('Akun guru dibuat', [{ nama: r.guru.nama, email: r.guru.email, pin: r.pinBaru }]); else ui.toast('Data guru diperbarui', 'ok');
      } catch (er) { ui.toast(er.message, 'bad', 6000); }
    });
  }
  IFP.register('guru', {
    init(el) {
      el.addEventListener('input', e => { if (e.target.id === 'grQ') { GR.q = e.target.value; const p = e.target.selectionStart; el.innerHTML = guruHtml(); const n = $('#grQ', el); n.focus(); n.setSelectionRange(p, p); } });
      el.addEventListener('click', async e => {
        const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act, g = guruCache && guruCache.find(x => x.id_pengguna === t.dataset.id);
        if (a === 'add') guruForm(); else if (a === 'edit' && g) guruForm(g);
        else if (a === 'pin' && g) { if (!await ui.confirm('Reset PIN ' + esc(g.nama) + '?', 'PIN lama tidak berlaku lagi dan perangkat yang sedang login akan keluar.', { ok: 'Reset PIN' })) return; try { const r = await A('guru.resetPin', { id_pengguna: g.id_pengguna }); pinModal('PIN baru', [{ nama: g.nama, email: g.email, pin: r.pinBaru }]); } catch (er) { ui.toast(er.message, 'bad'); } }
        else if (a === 'imp') {
          const m = ui.modal('<h3>Impor Guru dari CSV</h3><p class="muted t-sm mb">Kolom: <b class="mono">nama, email, nip, no_wa</b> (baris pertama = judul kolom). Email yang sudah terdaftar dilewati; PIN dibuat acak.</p><input type="file" id="iF" accept=".csv,text/csv" class="inp"><div class="t-xs muted mt-s">atau tempel isi CSV:</div><textarea id="iT" class="inp" rows="5" style="padding:10px;min-height:110px" placeholder="nama,email,nip,no_wa\nBudi Santoso,budi@sekolah.sch.id,1980…,0812…"></textarea><div class="acts"><button class="btn s" data-close="1">Batal</button><button class="btn p" id="iOk" data-busy="Mengimpor…">Impor</button></div>', { noFocus: true });
          m.$('#iF').onchange = async ev => { const f = ev.target.files[0]; if (f) m.$('#iT').value = await f.text(); };
          m.$('#iOk').onclick = ev => ui.busy(ev.currentTarget, async () => { try { const rows = U.parseCSV(m.$('#iT').value).map(r => ({ nama: r.nama || r.namaguru, email: r.email, nip: r.nip, no_wa: r.nowa || r.wa || r.hp })); if (!rows.length) throw new Error('Tidak ada data. Pastikan baris pertama berisi judul kolom.'); const r = await A('guru.import', { rows }); m.close(); await loadGuru(true); el.innerHTML = guruHtml(); IFP.refresh(true); if (r.akun.length) pinModal(r.ditambah + ' akun dibuat' + (r.dilewati.length ? ' • ' + r.dilewati.length + ' dilewati' : ''), r.akun); else ui.toast('Tidak ada akun baru. ' + r.dilewati.slice(0, 3).join('; '), 'warn', 7000); } catch (er) { ui.toast(er.message, 'bad'); } });
        }
      });
    },
    update(el) { el.innerHTML = guruHtml(); },
    async show(el) { el.innerHTML = guruHtml(); try { await loadGuru(true); el.innerHTML = guruHtml(); } catch (e) { ui.toast(e.message, 'bad'); } }
  });

  // =================================================================== PENGATURAN
  IFP.register('pengaturan', {
    init(el) {
      el.addEventListener('click', e => {
        const t = e.target.closest('#pgSave'); if (!t) return;
        ui.busy(t, async () => {
          const s = {}; $$('[data-k]', el).forEach(i => { s[i.dataset.k] = i.type === 'checkbox' ? (i.checked ? 'YA' : 'TIDAK') : i.value; });
          try { await A('pengaturan.save', { setting: s }); ui.toast('Pengaturan disimpan', 'ok'); await IFP.refresh(true); } catch (er) { ui.toast(er.message, 'bad'); }
        });
      });
    },
    update() {},
    async show(el) {
      el.innerHTML = '<h1>Pengaturan</h1>' + ui.skeleton(4); let s; try { s = await A('pengaturan.get'); } catch (e) { ui.toast(e.message, 'bad'); return; }
      const f = (k, l, h, type) => ui.fld(l, '<input data-k="' + k + '" type="' + (type || 'text') + '" value="' + esc(s[k] || '') + '">', h);
      el.innerHTML = '<div class="mb"><h1>Pengaturan</h1><p class="muted">Identitas sekolah, unit IFP, jam operasional, dan pengingat otomatis.</p></div><div class="grid g2">' +
        '<div class="card"><h3 class="mb">' + ic('book', 20) + ' Identitas & Kop Laporan</h3><div class="col">' + f('NAMA_INSTANSI', 'Instansi (baris atas kop)') + f('NAMA_SEKOLAH', 'Nama sekolah / madrasah') + f('ALAMAT_SEKOLAH', 'Alamat') + f('KONTAK_SEKOLAH', 'Telepon / email / website') + '<div class="f2">' + f('TAHUN_AJARAN', 'Tahun ajaran') + f('SEMESTER', 'Semester') + '</div></div></div>' +
        '<div class="card"><h3 class="mb">' + ic('tv', 20) + ' Unit IFP & Operasional</h3><div class="col">' + f('UNIT_IFP', 'Label unit (header)') + f('LOKASI_IFP', 'Lokasi IFP') + '<div class="f2">' + f('MERK_IFP', 'Merk / ukuran') + f('SERIAL_IFP', 'Nomor seri') + '</div><div class="f3">' + f('JAM_OPS_MULAI', 'Jam operasional mulai', '', 'time') + f('JAM_OPS_SELESAI', 'Selesai', '', 'time') + f('TARGET_KEPATUHAN', 'Target kepatuhan (%)', '', 'number') + '</div></div></div>' +
        '<div class="card"><h3 class="mb">' + ic('bell', 20) + ' Pengingat Jurnal Otomatis (H+1)</h3><div class="col"><div class="row between"><div><b>Aktifkan pengingat harian</b><div class="t-sm muted">Mengirim pengingat ke guru yang jurnalnya belum diisi sehari setelah jadwal.</div></div>' + pillSw('pgRem', s.PENGINGAT_AKTIF === 'YA').replace('id="pgRem"', 'id="pgRem" data-k="PENGINGAT_AKTIF"') + '</div><div class="f2">' + f('PENGINGAT_JAM', 'Jam kirim (0–23)', 'Waktu server Asia/Jakarta', 'number') + f('PENGINGAT_MAKS', 'Maksimal pengingat per jadwal', '', 'number') + '</div><div class="alert info">' + ic('info', 18) + '<div class="t-sm">Saluran pengiriman (WhatsApp / Email) diatur di menu <b>WhatsApp & Notifikasi</b>.</div></div></div></div>' +
        '<div class="card"><h3 class="mb">' + ic('pdf', 20) + ' Penandatangan Laporan</h3><div class="col"><div class="f2">' + f('NAMA_OPERATOR', 'Nama operator') + f('NIP_OPERATOR', 'NIP operator') + '</div><div class="f2">' + f('NAMA_KEPALA', 'Nama kepala sekolah') + f('NIP_KEPALA', 'NIP kepala sekolah') + '</div></div></div></div>' +
        '<div class="row mt" style="justify-content:flex-end"><button class="btn p lg" id="pgSave" data-busy="Menyimpan…">' + ic('check', 18) + ' Simpan Pengaturan</button></div>';
    }
  });

  // =================================================================== WHATSAPP & NOTIFIKASI
  const NF = { tab: 'cfg', cfg: null, queue: null, blasts: null, aud: null, auto: false, qf: { status: '', kanal: '' },
    bf: { judul: '', sumber: 'crm', segmen: '', tag: '', statusWA: '', teks: '', pesan: 'Assalamu\'alaikum {nama}, ', ukuran: 20, jeda: '5' } };
  const PH = { AKUN_DIBUAT: '{nama} {email} {pin} {link} {institusi}', JADWAL_BARU: '{nama} {tanggal} {jam} {kelas} {mapel} {link}', JADWAL_DIUBAH: '{nama} {tanggal} {jam} {kelas} {mapel}', JADWAL_DIBATALKAN: '{nama} {tanggal} {jam} {kelas} {mapel}', JURNAL_TERKIRIM: '{nama} {tanggal} {jam} {kelas} {mapel} {materi} {kondisi}', PENGINGAT_JURNAL: '{nama} {jumlah} {daftar} {link}', KENDALA_IFP: '{guru} {tanggal} {jam} {kelas} {kondisi} {kendala}' };
  function nfHead() {
    return '<div class="mb"><h1>WhatsApp & Notifikasi</h1><p class="muted">Pengingat jurnal, tanda terima, dan blast pesan lewat WhatsApp (Fonnte) serta Email. Semua pengiriman melalui antrean agar aman dari kuota.</p></div>' +
      '<div class="tabs">' + [['cfg', 'Konfigurasi'], ['mat', 'Matriks & Template'], ['que', 'Antrean & Riwayat'], ['bls', 'Blast WhatsApp']].map(x => '<button data-tab="' + x[0] + '" class="' + (NF.tab === x[0] ? 'on' : '') + '">' + x[1] + '</button>').join('') + '</div>';
  }
  function nfCfg() {
    const c = NF.cfg; if (!c) return ui.skeleton(4);
    return '<div class="grid g2"><div class="card"><h3 class="mb">' + ic('chat', 20) + ' Saluran Pengiriman</h3><div class="col">' +
      '<div class="row between"><div><b>WhatsApp (Fonnte)</b><div class="t-sm muted">Saklar utama; butuh token Fonnte</div></div>' + pillSw('nfWa', c.waAktif) + '</div>' +
      '<div class="row between"><div><b>Email (Gmail)</b><div class="t-sm muted">Sisa kuota harian: <b>' + c.sisaKuotaEmail + '</b> email</div></div>' + pillSw('nfEm', c.emailAktif) + '</div>' +
      ui.fld('Token Fonnte', '<input id="nfTok" type="password" autocomplete="off" placeholder="' + (c.punyaToken ? 'Tersimpan: ' + esc(c.tokenMask) + ' (kosongkan bila tidak diubah)' : 'Tempel token dari dashboard Fonnte') + '">', 'Token disimpan di Script Properties server — tidak pernah ditampilkan utuh.') +
      '<div class="row wrap"><button class="btn s sm" data-act="dev">' + ic('tv', 14) + ' Cek Perangkat Fonnte</button>' + (c.punyaToken ? '<button class="btn od sm" data-act="rmTok">' + ic('trash', 14) + ' Hapus Token</button>' : '') + '</div><div id="nfDev"></div>' +
      '<div class="f2">' + ui.fld('Tes WhatsApp ke', '<input id="nfTW" inputmode="tel" placeholder="0812…">') + ui.fld('Tes Email ke', '<input id="nfTE" type="email" placeholder="email@…">') + '</div><div class="row"><button class="btn s sm grow" data-act="tw">Kirim tes WA</button><button class="btn s sm grow" data-act="te">Kirim tes Email</button></div></div></div>' +
      '<div class="card"><h3 class="mb">' + ic('gear', 20) + ' Pengaturan Pengiriman</h3><div class="col">' +
      '<div class="f2">' + ui.fld('Ukuran batch blast', '<select id="nfB">' + [10, 20, 50].map(n => '<option ' + (c.batchDefault === n ? 'selected' : '') + '>' + n + '</option>').join('') + '</select>') + ui.fld('Jeda antarpesan (detik)', '<input id="nfJ" value="' + esc(c.jeda) + '" placeholder="5 atau 3-8">') + '</div>' +
      '<div class="row between"><div><b>Deteksi nomor WA otomatis</b><div class="t-sm muted">Cek nomor baru terdaftar WhatsApp (maks 50 per panggilan)</div></div>' + pillSw('nfDet', c.deteksiOtomatis) + '</div>' +
      ui.fld('Nama pengirim email', '<input id="nfNm" maxlength="60" value="' + esc(c.namaPengirim) + '">') + ui.fld('URL aplikasi (untuk {link} di pesan)', '<input id="nfUrl" value="' + esc(c.appUrl) + '" placeholder="https://username.github.io/lentera-ifp/">', 'Isi alamat GitHub Pages Anda agar guru bisa klik tautan dari pesan.') +
      '<div class="alert ' + (c.trigger ? 'ok' : 'warn') + '">' + ic(c.trigger ? 'checkc' : 'alert', 18) + '<div class="t-sm">' + (c.trigger ? 'Trigger antrean aktif (diproses tiap 1 menit).' : 'Trigger antrean belum terpasang. Jalankan fungsi <b>pasangTrigger</b> di editor Apps Script.') + '</div></div>' +
      '<button class="btn p lg" data-act="save" data-busy="Menyimpan…">' + ic('check', 18) + ' Simpan Konfigurasi</button></div></div></div>';
  }
  function nfMat() {
    const c = NF.cfg; if (!c) return ui.skeleton(4);
    return '<div class="card p0"><div class="tw"><table class="t"><thead><tr><th>Peristiwa</th><th class="center">WhatsApp</th><th class="center">Email</th><th></th></tr></thead><tbody>' + c.matriks.map(m => '<tr><td><b>' + esc(m.label) + '</b><div class="t-xs muted mono">' + m.kode + '</div></td><td class="center">' + pillSw('mw_' + m.kode, m.wa) + '</td><td class="center">' + pillSw('me_' + m.kode, m.email) + '</td><td class="right"><button class="btn sm s" data-act="tpl" data-k="' + m.kode + '">' + ic('edit', 14) + ' Template</button></td></tr>').join('') + '</tbody></table></div><div style="padding:16px"><button class="btn p" data-act="save" data-busy="Menyimpan…">' + ic('check', 16) + ' Simpan Matriks</button> <span class="muted t-sm">Pesan hanya terkirim bila saklar utama kanal pada tab Konfigurasi juga aktif.</span></div></div>';
  }
  function nfQue() {
    const q = NF.queue; if (!q) return ui.skeleton(4); const r = q.ringkasan, cls = { Antri: 'warn', Terkirim: 'ok', Gagal: 'bad', Batal: 'mute' };
    return '<div class="row wrap mb"><span class="badge warn">Antri ' + r.Antri + '</span><span class="badge ok">Terkirim ' + r.Terkirim + '</span><span class="badge bad">Gagal ' + r.Gagal + '</span><span class="grow"></span><select class="inp" id="qfS"><option value="">Semua status</option>' + ['Antri', 'Terkirim', 'Gagal', 'Batal'].map(s => '<option ' + (NF.qf.status === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select><select class="inp" id="qfK"><option value="">Semua kanal</option><option ' + (NF.qf.kanal === 'WA' ? 'selected' : '') + '>WA</option><option ' + (NF.qf.kanal === 'EMAIL' ? 'selected' : '') + '>EMAIL</option></select><button class="btn s" data-act="retry">' + ic('refresh', 16) + ' Ulangi Gagal</button><button class="btn p" data-act="proc" data-busy="Memproses…">' + ic('send', 16) + ' Proses Sekarang</button></div>' +
      '<div class="card p0"><div class="tw"><table class="t"><thead><tr><th>Waktu</th><th>Kanal</th><th>Penerima</th><th>Peristiwa</th><th>Status</th><th>Respon</th></tr></thead><tbody>' + (q.rows.map(x => '<tr><td class="mono t-xs nowrap">' + U.fmtWaktu(x.DikirimPada || x.DibuatPada) + '</td><td><span class="badge mute">' + x.Kanal + '</span></td><td>' + esc(x.NamaPenerima || '-') + '<div class="t-xs muted mono">' + esc(x.Tujuan) + '</div></td><td class="t-xs">' + esc(x.Event) + '</td><td><span class="badge ' + (cls[x.Status] || 'mute') + '">' + x.Status + '</span></td><td class="t-xs muted">' + esc(x.Respon || '') + '</td></tr>').join('') || '<tr><td colspan="6" class="center muted" style="padding:24px">Antrean kosong</td></tr>') + '</tbody></table></div></div>';
  }
  function nfBls() {
    const f = NF.bf, a = NF.aud, bl = NF.blasts;
    const aud = a ? '<div class="row wrap t-sm mt-s"><span class="badge ok">Valid ' + a.ringkas.valid + '</span><span class="badge mute">Total ' + a.ringkas.total + '</span><span class="badge bad">Tidak valid ' + a.ringkas.tidakValid + '</span><span class="badge warn">Ganda ' + a.ringkas.ganda + '</span><span class="badge mute">Opt-out ' + a.ringkas.optOut + '</span><span class="badge info">WA terdaftar ' + a.ringkas.terdaftarWA + '</span></div>' : '';
    return '<div class="grid g-half"><div class="card"><h3 class="mb">' + ic('send', 20) + ' Buat Blast Baru</h3><div class="col">' + ui.fld('Judul', '<input id="bfJ" value="' + esc(f.judul) + '" placeholder="Pengumuman jadwal IFP minggu depan">') +
      ui.fld('Sumber penerima', '<select id="bfSm"><option value="crm" ' + (f.sumber === 'crm' ? 'selected' : '') + '>Kontak CRM</option><option value="manual" ' + (f.sumber === 'manual' ? 'selected' : '') + '>Tempel nomor manual</option></select>') +
      (f.sumber === 'crm' ? '<div class="f3">' + ui.fld('Segmen', '<select id="bfSg"><option value="">Semua</option><option ' + (f.segmen === 'Guru' ? 'selected' : '') + '>Guru</option><option ' + (f.segmen === 'Operator' ? 'selected' : '') + '>Operator</option></select>') + ui.fld('Tag', '<input id="bfTg" value="' + esc(f.tag) + '">') + ui.fld('Status WA', '<select id="bfSw"><option value="">Semua</option><option ' + (f.statusWA === 'Terdaftar' ? 'selected' : '') + '>Terdaftar</option><option ' + (f.statusWA === 'Belum' ? 'selected' : '') + ' value="Belum">Belum dicek</option></select>') + '</div>' :
        ui.fld('Nomor (satu per baris: nomor|nama)', '<textarea id="bfTx" style="min-height:90px" placeholder="081234567890|Bu Rina">' + esc(f.teks) + '</textarea>')) +
      '<button class="btn s" data-act="aud" data-busy="Menghitung…">' + ic('users', 16) + ' Hitung Audiens</button>' + aud +
      ui.fld('Isi pesan', '<textarea id="bfP" style="min-height:120px" maxlength="1500">' + esc(f.pesan) + '</textarea>', 'Variabel: {nama} {institusi} {link}') +
      '<div class="f2">' + ui.fld('Ukuran batch', '<select id="bfU">' + [10, 20, 50].map(n => '<option ' + (f.ukuran === n ? 'selected' : '') + '>' + n + '</option>').join('') + '</select>') + ui.fld('Jeda (detik)', '<input id="bfDj" value="' + esc(f.jeda) + '">') + '</div>' +
      '<button class="btn p lg" data-act="mk" data-busy="Membuat…">' + ic('send', 18) + ' Buat Blast</button></div></div>' +
      '<div class="card"><div class="card-h"><h3>' + ic('list', 20) + ' Riwayat & Progres Blast</h3><button class="btn s sm" data-act="rl">' + ic('refresh', 14) + '</button></div>' + (bl ? (bl.length ? bl.map(b => '<div class="bar-row" style="grid-template-columns:1fr;gap:6px"><div class="row between wrap"><b>' + esc(b.Judul) + '</b><span class="badge ' + ({ Berjalan: 'info', Selesai: 'ok', Dihentikan: 'mute' }[b.Status] || 'mute') + '">' + b.Status + '</span></div><div class="prog"><i style="width:' + b.persen + '%"></i></div><div class="row between wrap t-xs muted"><span>' + b.Terkirim + ' terkirim • ' + b.Gagal + ' gagal • ' + b.sisa + ' sisa (batch ' + b.UkuranBatch + ', jeda ' + b.JedaDetik + ' dtk)</span><span>' + U.fmtWaktu(b.Tanggal) + '</span></div>' +
        (b.Status === 'Berjalan' ? '<div class="row wrap"><button class="btn sm p" data-act="bp" data-id="' + b.BlastID + '">Proses batch berikutnya</button><button class="btn sm t" data-act="ba" data-id="' + b.BlastID + '">' + (NF.auto ? 'Otomatis berjalan…' : 'Jalankan otomatis') + '</button><button class="btn sm od" data-act="bs" data-id="' + b.BlastID + '">' + ic('stop', 14) + ' Hentikan</button></div>' : '') + '</div>').join('') : ui.empty('send', 'Belum ada blast')) : ui.skeleton(2)) + '</div></div>';
  }
  function nfDraw(el) { el.innerHTML = nfHead() + (NF.tab === 'cfg' ? nfCfg() : NF.tab === 'mat' ? nfMat() : NF.tab === 'que' ? nfQue() : nfBls()); }
  async function nfLoad(el, what) {
    try {
      if (what === 'cfg' || !NF.cfg) NF.cfg = await A('notif.config', {}, { quiet: true });
      if (NF.tab === 'que') NF.queue = await A('notif.queue', NF.qf, { quiet: true });
      if (NF.tab === 'bls') NF.blasts = await A('wa.blastList', {}, { quiet: true });
    } catch (e) { ui.toast(e.message, 'bad'); } nfDraw(el);
  }
  function nfCollect(el) {
    const g = id => $('#' + id, el), c = NF.cfg;
    if (g('nfWa')) { c.waAktif = g('nfWa').checked; c.emailAktif = g('nfEm').checked; c.batchDefault = +g('nfB').value; c.jeda = g('nfJ').value; c.deteksiOtomatis = g('nfDet').checked; c.namaPengirim = g('nfNm').value; c.appUrl = g('nfUrl').value; }
    if (g('mw_' + c.matriks[0].kode)) c.matriks.forEach(m => { m.wa = g('mw_' + m.kode).checked; m.email = g('me_' + m.kode).checked; });
  }
  function nfBf(el) { const g = id => $('#' + id, el), f = NF.bf; if (g('bfJ')) { f.judul = g('bfJ').value; f.sumber = g('bfSm').value; f.pesan = g('bfP').value; f.ukuran = +g('bfU').value; f.jeda = g('bfDj').value; if (g('bfSg')) { f.segmen = g('bfSg').value; f.tag = g('bfTg').value; f.statusWA = g('bfSw').value; } if (g('bfTx')) f.teks = g('bfTx').value; } }
  async function autoRun(el, id) {
    if (NF.auto) { NF.auto = false; return; } NF.auto = true;
    while (NF.auto) {
      try { const r = await A('wa.blastProcess', { blastId: id }, { quiet: true }); NF.blasts = await A('wa.blastList', {}, { quiet: true }); if (NF.tab === 'bls') nfDraw(el); if (!r.blast || r.blast.Status !== 'Berjalan') break; } catch (e) { ui.toast(e.message, 'bad'); break; }
      await U.sleep(2500);
    }
    NF.auto = false; if (NF.tab === 'bls') { NF.blasts = await A('wa.blastList', {}, { quiet: true }); nfDraw(el); }
  }
  IFP.register('notifikasi', {
    init(el) {
      el.addEventListener('input', e => { if (NF.tab === 'bls') nfBf(el); });
      el.addEventListener('change', e => {
        if (NF.tab === 'bls' && /^bf/.test(e.target.id)) { nfBf(el); if (e.target.id === 'bfSm') nfDraw(el); }
        if (e.target.id === 'qfS' || e.target.id === 'qfK') { NF.qf = { status: $('#qfS', el).value, kanal: $('#qfK', el).value }; nfLoad(el); }
      });
      el.addEventListener('click', async e => {
        const tb = e.target.closest('[data-tab]'); if (tb) { if (NF.cfg && (NF.tab === 'cfg' || NF.tab === 'mat')) nfCollect(el); NF.tab = tb.dataset.tab; nfDraw(el); nfLoad(el); return; }
        const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
        const run = fn => ui.busy(t, async () => { try { await fn(); } catch (er) { ui.toast(er.message, 'bad', 6500); } });
        if (a === 'save') run(async () => { nfCollect(el); const tok = $('#nfTok', el); const c = NF.cfg; const m = {}; c.matriks.forEach(x => { m[x.kode] = { wa: x.wa, email: x.email, subjek: x.subjek, pesan: x.pesan }; }); NF.cfg = await A('notif.configSave', { token: tok ? tok.value.trim() : '', waAktif: c.waAktif, emailAktif: c.emailAktif, batchDefault: c.batchDefault, jeda: c.jeda, deteksiOtomatis: c.deteksiOtomatis, namaPengirim: c.namaPengirim, appUrl: c.appUrl, matriks: m }); ui.toast('Konfigurasi notifikasi disimpan', 'ok'); nfDraw(el); });
        else if (a === 'rmTok') { if (await ui.confirm('Hapus token Fonnte?', 'Pengiriman WhatsApp akan berhenti sampai token diisi lagi.', { danger: true, ok: 'Hapus' })) { try { NF.cfg = await A('notif.configSave', { token: '__HAPUS__', waAktif: false, emailAktif: NF.cfg.emailAktif }); ui.toast('Token dihapus', 'ok'); nfDraw(el); } catch (er) { ui.toast(er.message, 'bad'); } } }
        else if (a === 'dev') run(async () => { const d = await A('wa.device'); $('#nfDev', el).innerHTML = '<div class="log">Nomor: ' + esc(d.nomor) + '\nStatus: ' + esc(d.status) + '\nPaket: ' + esc(d.paket) + '\nKuota: ' + esc(d.kuota) + (d.kadaluarsa ? '\nBerlaku s.d.: ' + esc(d.kadaluarsa) : '') + '</div>'; });
        else if (a === 'tw') run(async () => { await A('wa.test', { nomor: $('#nfTW', el).value }); ui.toast('Pesan tes WA terkirim', 'ok'); });
        else if (a === 'te') run(async () => { await A('email.test', { email: $('#nfTE', el).value }); ui.toast('Email tes terkirim', 'ok'); });
        else if (a === 'tpl') {
          nfCollect(el); const mt = NF.cfg.matriks.find(x => x.kode === t.dataset.k);
          const m = ui.modal('<h3>Template: ' + esc(mt.label) + '</h3><div class="col">' + ui.fld('Subjek email', '<input id="tS" value="' + esc(mt.subjek) + '">') + ui.fld('Isi pesan (WA & email)', '<textarea id="tP" style="min-height:160px">' + esc(mt.pesan) + '</textarea>', 'Variabel tersedia: <span class="mono">' + PH[mt.kode] + '</span>. Gunakan *teks* untuk huruf tebal.') + '</div><div class="acts"><button class="btn s" id="tR">Pulihkan default</button><button class="btn p" id="tO">Simpan template</button></div>', { noFocus: true });
          m.$('#tR').onclick = () => { m.$('#tS').value = mt.subjekDefault; m.$('#tP').value = mt.pesanDefault; }; m.$('#tO').onclick = () => { mt.subjek = m.$('#tS').value; mt.pesan = m.$('#tP').value; m.close(); ui.toast('Template diubah — tekan "Simpan Matriks" untuk menyimpan permanen', 'warn', 5000); };
        }
        else if (a === 'proc') run(async () => { const r = await A('notif.processNow'); ui.toast('Diproses: ' + (r.terkirim || 0) + ' terkirim, ' + (r.gagal || 0) + ' gagal', 'ok'); nfLoad(el); });
        else if (a === 'retry') run(async () => { await A('notif.retry', {}); ui.toast('Notifikasi gagal dijadwalkan ulang', 'ok'); nfLoad(el); });
        else if (a === 'aud') run(async () => { nfBf(el); const f = NF.bf; NF.aud = await A('wa.audience', { sumber: f.sumber, segmen: f.segmen, tag: f.tag, statusWA: f.statusWA, teks: f.teks }); nfDraw(el); });
        else if (a === 'mk') run(async () => {
          nfBf(el); const f = NF.bf; if (!NF.aud) NF.aud = await A('wa.audience', { sumber: f.sumber, segmen: f.segmen, tag: f.tag, statusWA: f.statusWA, teks: f.teks });
          const pen = NF.aud.rows.filter(r => r.valid && !r.ganda && !r.optOut).map(r => ({ nama: r.nama, hp: r.hp })); if (!pen.length) throw new Error('Tidak ada penerima valid.');
          if (!await ui.confirm('Buat blast ke ' + pen.length + ' penerima?', 'Pesan dikirim bertahap per batch ' + f.ukuran + ' dengan jeda ' + esc(f.jeda) + ' detik.', { ok: 'Buat Blast' })) return;
          const r = await A('wa.blastCreate', { judul: f.judul, pesan: f.pesan, ukuranBatch: f.ukuran, jeda: f.jeda, penerima: pen, sasaran: f.sumber === 'crm' ? 'CRM ' + (f.segmen || 'Semua') : 'Manual' });
          ui.toast('Blast dibuat: ' + r.total + ' penerima', 'ok'); NF.aud = null; NF.blasts = await A('wa.blastList', {}, { quiet: true }); nfDraw(el);
        });
        else if (a === 'rl') { NF.blasts = await A('wa.blastList', {}, { quiet: true }); nfDraw(el); }
        else if (a === 'bp') run(async () => { await A('wa.blastProcess', { blastId: t.dataset.id }); NF.blasts = await A('wa.blastList', {}, { quiet: true }); nfDraw(el); });
        else if (a === 'ba') autoRun(el, t.dataset.id);
        else if (a === 'bs') { if (await ui.confirm('Hentikan blast?', 'Pesan yang masih antri dibatalkan.', { danger: true, ok: 'Hentikan' })) { NF.auto = false; try { await A('wa.blastStop', { blastId: t.dataset.id }); NF.blasts = await A('wa.blastList', {}, { quiet: true }); nfDraw(el); } catch (er) { ui.toast(er.message, 'bad'); } } }
      });
    },
    update() {}, show(el) { nfDraw(el); nfLoad(el, 'cfg'); }
  });

  // =================================================================== CRM KONTAK
  const CR = { q: '', seg: '', wa: '', tag: '', opt: '', dup: '', hal: 1, per: 25, sel: {}, data: null, stats: null };
  function crmHtml() {
    const s = CR.stats, d = CR.data, nSel = Object.keys(CR.sel).length;
    const kp = s ? '<div class="grid g4 kp mb">' + [['Total Kontak', s.total, 'b', 'users', s.baru7 + ' baru 7 hari'], ['WA Terdaftar', s.terdaftarWA, 'g', 'chat', s.belumDicek + ' belum dicek'], ['Email Valid', s.emailValid, 'b', 'mail', s.tidakBisa + ' tanpa kontak'], ['Opt-out / Ganda', s.optOut + ' / ' + s.duplikat, 'a', 'alert', s.dihubungi30 + ' dihubungi 30 hari']].map(x => '<div class="card kpi"><span class="ico ' + x[2] + '">' + ic(x[3], 20) + '</span><div class="lab">' + x[0] + '</div><div class="val">' + x[1] + '</div><div class="foot">' + x[4] + '</div></div>').join('') + '</div>' : '<div class="grid g4 mb">' + [1, 2, 3, 4].map(() => '<div class="card"><div class="sk" style="height:70px"></div></div>').join('') + '</div>';
    const segs = s ? Object.keys(s.segmen) : [];
    return '<div class="row between wrap mb"><div><h1>CRM Kontak</h1><p class="muted">Basis kontak terpusat: guru & operator tersinkron otomatis, ditambah kontak manual (mis. wali murid).</p></div><div class="row wrap"><button class="btn s" data-act="exp">' + ic('download', 16) + ' Ekspor</button><button class="btn s" data-act="imp">' + ic('upload', 16) + ' Impor CSV</button><button class="btn p" data-act="sync" data-busy="Sinkron…">' + ic('refresh', 16) + ' Sinkron Sekarang</button></div></div>' + kp +
      '<div class="card p0"><div style="padding:16px 16px 0"><div class="tools"><div class="row grow" style="position:relative;min-width:200px"><input class="inp" id="cQ" placeholder="Cari nama, email, nomor…" value="' + esc(CR.q) + '" style="padding-left:38px;width:100%"><span style="position:absolute;left:12px;top:12px;color:var(--ink3)">' + ic('search', 18) + '</span></div>' +
      '<select class="inp" id="cSg"><option value="">Semua segmen</option>' + segs.map(x => '<option ' + (CR.seg === x ? 'selected' : '') + '>' + esc(x) + '</option>').join('') + '</select><select class="inp" id="cWa"><option value="">Status WA</option>' + ['Terdaftar', 'Tidak Terdaftar', 'Belum'].map(x => '<option ' + (CR.wa === x ? 'selected' : '') + '>' + x + '</option>').join('') + '</select>' +
      '<select class="inp" id="cOp"><option value="">Opt-out</option><option value="YA" ' + (CR.opt === 'YA' ? 'selected' : '') + '>Ya</option><option value="TIDAK" ' + (CR.opt === 'TIDAK' ? 'selected' : '') + '>Tidak</option></select><label class="row t-sm"><input type="checkbox" id="cDp" ' + (CR.dup ? 'checked' : '') + '> Ganda saja</label></div>' +
      (nSel ? '<div class="row wrap mb alert info" style="padding:10px 14px"><b>' + nSel + ' dipilih</b><span class="grow"></span><button class="btn sm s" data-act="b" data-a="tag">+ Tag</button><button class="btn sm s" data-act="b" data-a="untag">− Tag</button><button class="btn sm s" data-act="b" data-a="optout">Opt-out</button><button class="btn sm s" data-act="b" data-a="optin">Opt-in</button><button class="btn sm s" data-act="b" data-a="deteksiWA">Deteksi WA</button>' + (nSel > 1 ? '<button class="btn sm s" data-act="mg">Gabung</button>' : '') + '<button class="btn sm od" data-act="b" data-a="hapusManual">Hapus (manual)</button></div>' : '') + '</div>' +
      (d ? '<div class="tw"><table class="t"><thead><tr><th style="width:36px"><input type="checkbox" id="cAll"></th><th>Nama</th><th>Email</th><th>WhatsApp</th><th>Segmen</th><th>Tag</th><th>Dihubungi</th></tr></thead><tbody>' + (d.rows.map(k => '<tr class="' + (CR.sel[k.KontakID] ? 'sel' : '') + '"><td><input type="checkbox" class="cSel" data-id="' + k.KontakID + '" ' + (CR.sel[k.KontakID] ? 'checked' : '') + '></td><td><a href="#" data-act="det" data-id="' + k.KontakID + '"><b>' + esc(k.Nama) + '</b></a> ' + (k.dup ? '<span class="badge warn">Ganda</span>' : '') + (k.OptOut === 'YA' ? ' <span class="badge bad">Opt-out</span>' : '') + '</td><td class="t-xs mono">' + esc(k.Email || '-') + '</td><td class="t-xs mono">' + esc(k.NoWA || '-') + (k.StatusWA ? '<br><span class="badge ' + (k.StatusWA === 'Terdaftar' ? 'ok' : 'bad') + '">' + (k.StatusWA === 'Terdaftar' ? 'WA aktif' : 'Bukan WA') + '</span>' : '') + '</td><td><span class="badge mute">' + esc(k.Segmen) + '</span> <span class="t-xs faint">' + (k.Sumber === 'manual' ? 'manual' : '') + '</span></td><td class="t-xs">' + esc(k.Tag || '') + '</td><td class="t-xs muted">' + (k.TerakhirDihubungi ? U.fmtWaktu(k.TerakhirDihubungi) : '-') + '<br>' + (k.JumlahPesan || 0) + ' pesan</td></tr>').join('') || '<tr><td colspan="7" class="center muted" style="padding:24px">Tidak ada kontak. Tekan "Sinkron Sekarang".</td></tr>') + '</tbody></table></div>' + pager(d.halaman, d.per, d.total, 'pg') : '<div style="padding:16px">' + ui.skeleton(5) + '</div>') + '</div>';
  }
  const crmLoad = U.debounce(async el => {
    try { const q = { cari: CR.q, segmen: CR.seg, statusWA: CR.wa, optOut: CR.opt, duplikat: CR.dup, halaman: CR.hal, per: CR.per, tag: CR.tag }; const [d, s] = await Promise.all([A('crm.list', q, { quiet: true }), A('crm.stats', {}, { quiet: true })]); CR.data = d; CR.stats = s; } catch (e) { ui.toast(e.message, 'bad'); }
    crmDraw(el);
  }, 250);
  function crmDraw(el) { const a = document.activeElement && document.activeElement.id, p = document.activeElement && document.activeElement.selectionStart; el.innerHTML = crmHtml(); if (a) { const n = $('#' + a, el); if (n) { n.focus(); if (n.type === 'text' && p != null) try { n.setSelectionRange(p, p); } catch (e) {} } } }
  async function crmDetail(id, el) {
    const dr = ui.drawer('<div class="sk" style="height:200px"></div>');
    try {
      const d = await A('crm.detail', { kontakId: id }), k = d.kontak;
      dr.el.querySelector('.drawer').innerHTML = '<div class="row between mb"><h2>' + esc(k.Nama) + '</h2><button class="ibtn" data-close="1" aria-label="Tutup">' + ic('x', 20) + '</button></div><div class="col"><div class="row wrap"><span class="badge mute">' + esc(k.Segmen) + '</span>' + (k.OptOut === 'YA' ? '<span class="badge bad">Opt-out</span>' : '') + (k.StatusWA ? '<span class="badge ' + (k.StatusWA === 'Terdaftar' ? 'ok' : 'bad') + '">WA: ' + esc(k.StatusWA) + '</span>' : '') + '</div>' +
        '<div class="t-sm mono">' + esc(k.Email || '-') + '<br>' + esc(k.NoWA || '-') + '</div>' + Object.keys(d.info).filter(x => d.info[x]).map(x => '<div class="t-sm muted">' + esc(x) + ': ' + esc(d.info[x]) + '</div>').join('') +
        ui.fld('Tag (pisahkan koma)', '<input id="dT" value="' + esc(k.Tag || '') + '">') + ui.fld('Catatan', '<textarea id="dC" style="min-height:70px">' + esc(k.Catatan || '') + '</textarea>') + '<label class="row"><input type="checkbox" id="dO" ' + (k.OptOut === 'YA' ? 'checked' : '') + '> Opt-out (jangan kirim blast)</label><button class="btn p" id="dS">Simpan</button>' +
        '<h3 class="mt">Catat Interaksi</h3><div class="f2"><select class="inp" id="iK"><option>Telepon</option><option>WA Manual</option><option>Kunjungan</option><option>Catatan</option></select><input class="inp" id="iR" placeholder="Ringkasan…"></div><button class="btn s" id="iA">Tambah</button>' +
        '<h3 class="mt">Riwayat</h3>' + ((d.interaksi.length + d.notif.length) ? d.interaksi.map(i => '<div class="bar-row" style="grid-template-columns:1fr"><div><span class="badge info">' + esc(i.Kanal) + '</span> <span class="t-xs muted">' + U.fmtWaktu(i.Tanggal) + ' • ' + esc(i.Oleh) + '</span><div class="t-sm">' + esc(i.Ringkasan) + '</div></div></div>').join('') + d.notif.map(n => '<div class="bar-row" style="grid-template-columns:1fr"><div><span class="badge mute">' + n.kanal + '</span> <span class="badge ' + (n.status === 'Terkirim' ? 'ok' : 'warn') + '">' + n.status + '</span> <span class="t-xs muted">' + U.fmtWaktu(n.waktu) + '</span><div class="t-sm">' + esc(n.pesan) + '</div></div></div>').join('') : '<span class="muted t-sm">Belum ada riwayat.</span>') + '</div>';
      const g = s => $(s, dr.el);
      g('#dS').onclick = e => ui.busy(e.currentTarget, async () => { try { await A('crm.save', { kontakId: id, Tag: g('#dT').value, Catatan: g('#dC').value, OptOut: g('#dO').checked ? 'YA' : 'TIDAK' }); ui.toast('Kontak disimpan', 'ok'); dr.close(); crmLoad(el); } catch (er) { ui.toast(er.message, 'bad'); } });
      g('#iA').onclick = e => ui.busy(e.currentTarget, async () => { try { await A('crm.interaksi', { kontakId: id, kanal: g('#iK').value, ringkasan: g('#iR').value }); ui.toast('Interaksi dicatat', 'ok'); dr.close(); crmDetail(id, el); } catch (er) { ui.toast(er.message, 'bad'); } });
    } catch (er) { dr.close(); ui.toast(er.message, 'bad'); }
  }
  IFP.register('crm', {
    init(el) {
      el.addEventListener('input', e => { if (e.target.id === 'cQ') { CR.q = e.target.value; CR.hal = 1; crmLoad(el); } });
      el.addEventListener('change', e => {
        const t = e.target;
        if (t.id === 'cSg') CR.seg = t.value; else if (t.id === 'cWa') CR.wa = t.value; else if (t.id === 'cOp') CR.opt = t.value; else if (t.id === 'cDp') CR.dup = t.checked ? '1' : '';
        else if (t.id === 'cAll') { (CR.data ? CR.data.rows : []).forEach(k => { if (t.checked) CR.sel[k.KontakID] = 1; else delete CR.sel[k.KontakID]; }); crmDraw(el); return; }
        else if (t.classList.contains('cSel')) { if (t.checked) CR.sel[t.dataset.id] = 1; else delete CR.sel[t.dataset.id]; crmDraw(el); return; } else return;
        CR.hal = 1; crmLoad(el);
      });
      el.addEventListener('click', async e => {
        const t = e.target.closest('[data-act]'); if (!t) return; e.preventDefault(); const a = t.dataset.act, ids = Object.keys(CR.sel);
        const run = fn => ui.busy(t, async () => { try { await fn(); } catch (er) { ui.toast(er.message, 'bad', 6000); } });
        if (a === 'det') crmDetail(t.dataset.id, el);
        else if (a === 'pg') { CR.hal = +t.dataset.h; crmLoad(el); }
        else if (a === 'sync') run(async () => { const r = await A('crm.sync'); ui.toast('Sinkron: +' + r.ditambah + ' baru, ' + r.diperbarui + ' diperbarui', 'ok'); crmLoad(el); });
        else if (a === 'exp') run(async () => { const d = await A('crm.export', { cari: CR.q, segmen: CR.seg }); U.download('kontak_crm.csv', U.toCSV(d, Object.keys(d[0] || { Nama: 1 }).map(k => [k, k]))); });
        else if (a === 'b') {
          const act = t.dataset.a; let nilai = '';
          if (act === 'tag' || act === 'untag') { nilai = prompt('Nama tag:') || ''; if (!nilai) return; }
          if (act === 'hapusManual' && !await ui.confirm('Hapus kontak manual terpilih?', 'Kontak dari sinkronisasi guru/operator tidak ikut dihapus.', { danger: true, ok: 'Hapus' })) return;
          run(async () => { const r = await IFP.api('crm.bulk', { ids, aksi: act, nilai }); if (!r.success) throw new Error(r.message); ui.toast(r.message, 'ok'); CR.sel = {}; crmLoad(el); });
        }
        else if (a === 'mg') { if (!await ui.confirm('Gabungkan ' + ids.length + ' kontak?', 'Kontak pertama menjadi kontak utama; sisanya disembunyikan.', { ok: 'Gabungkan' })) return; run(async () => { await A('crm.merge', { utama: ids[0], gabung: ids.slice(1) }); CR.sel = {}; ui.toast('Kontak digabung', 'ok'); crmLoad(el); }); }
        else if (a === 'imp') {
          const m = ui.modal('<h3>Impor Kontak dari CSV</h3><p class="muted t-sm mb">Kolom: <b class="mono">nama, wa, email, segmen, tag</b>. Duplikat nomor/email dilewati.</p><input type="file" id="cF" accept=".csv,text/csv" class="inp"><textarea id="cT" class="inp" style="min-height:110px;padding:10px;margin-top:8px" placeholder="nama,wa,email,segmen,tag"></textarea><div class="acts"><button class="btn s" data-close="1">Batal</button><button class="btn p" id="cOk" data-busy="Mengimpor…">Impor</button></div>', { noFocus: true });
          m.$('#cF').onchange = async ev => { const f = ev.target.files[0]; if (f) m.$('#cT').value = await f.text(); };
          m.$('#cOk').onclick = ev => ui.busy(ev.currentTarget, async () => { try { const rows = U.parseCSV(m.$('#cT').value); const r = await A('crm.import', { rows }); ui.toast(r.ditambah + ' kontak diimpor, ' + r.dilewati + ' dilewati', 'ok'); m.close(); crmLoad(el); } catch (er) { ui.toast(er.message, 'bad'); } });
        }
      });
    },
    update() {}, show(el) { crmDraw(el); crmLoad(el); }
  });

  // =================================================================== MIGRASI DATA
  const MG = { src: '', sheets: { Pengguna: true, Jadwal: true, Jurnal: true }, scan: null, run: null };
  function mgReport(r, title) {
    return '<div class="card mt"><div class="card-h"><h3>' + ic(r.dryRun ? 'eye' : 'checkc', 20) + title + '</h3><span class="badge ' + (r.dryRun ? 'info' : 'ok') + '">' + (r.dryRun ? 'Dry-run: belum ada data ditulis' : 'Selesai ditulis') + '</span></div><p class="muted t-sm mb">Sumber: <b>' + esc(r.source.nama) + '</b></p><div class="grid g3">' +
      Object.keys(r.report).map(k => { const x = r.report[k]; return '<div class="card flat"><b>' + k + '</b>' + (x.ada ? '<div class="row wrap mt-s"><span class="badge info">Sumber ' + x.sumber + '</span><span class="badge ok">+' + x.ditambah + '</span><span class="badge warn">~' + x.diperbarui + '</span><span class="badge mute">lewat ' + x.dilewati + '</span></div>' : '<div class="badge bad mt-s">Sheet tidak ditemukan</div>') + '</div>'; }).join('') + '</div>' +
      (r.warnings.length ? '<div class="alert warn mt">' + ic('alert', 18) + '<div class="t-sm">' + r.warnings.map(w => '<div>• ' + esc(w) + '</div>').join('') + '</div></div>' : '') + '<p class="faint t-xs mt-s">' + esc(r.catatan) + '</p></div>';
  }
  function mgHtml() {
    const sc = MG.scan;
    return '<div class="mb"><h1>Migrasi Data</h1><p class="muted">Pindahkan jadwal, jurnal, dan data guru dari spreadsheet lama ke aplikasi ini — aman, bisa diulang, dan spreadsheet lama tidak diubah.</p></div>' +
      '<div class="grid g-mig"><div><div class="card"><h3 class="mb">' + ic('db', 20) + ' 1. Sumber Data Lama</h3><div class="col">' + ui.fld('URL atau ID Google Spreadsheet lama', '<input id="mgS" value="' + esc(MG.src) + '" placeholder="https://docs.google.com/spreadsheets/d/…">', 'Gunakan akun Google yang sama dengan pemilik aplikasi ini agar tautan foto lama tetap terbaca.') +
      '<div class="lbl">Data yang dipindahkan</div><div class="row wrap">' + ['Pengguna', 'Jadwal', 'Jurnal'].map(k => '<label class="row t-sm"><input type="checkbox" data-sh="' + k + '" ' + (MG.sheets[k] ? 'checked' : '') + '> ' + (k === 'Pengguna' ? 'Guru / Pengguna' : k) + '</label>').join('') + '</div>' +
      '<div class="row wrap"><button class="btn t lg" data-act="scan" data-busy="Memindai…">' + ic('eye', 18) + ' 2. Pindai (Dry-run)</button><button class="btn p lg" data-act="run" ' + (sc && sc.source ? '' : 'disabled') + ' data-busy="Memigrasi…">' + ic('upload', 18) + ' 3. Jalankan Migrasi</button></div>' + (!sc ? '<span class="t-xs muted">Tombol Jalankan aktif setelah pindai berhasil.</span>' : '') + '</div></div>' +
      (sc ? mgReport(sc, 'Hasil Pindai') : '') + (MG.run ? mgReport(MG.run, 'Hasil Migrasi') : '') + '</div>' +
      '<div class="stack"><div class="card"><h3 class="mb">' + ic('info', 20) + ' Format yang Dikenali</h3><div class="t-sm col" style="gap:10px"><div><b>Nama sheet</b> (salah satu): <span class="mono">Guru / Data Guru / Pengguna</span>, <span class="mono">Jadwal / Jadwal IFP</span>, <span class="mono">Jurnal / Jurnal KBM</span>.</div><div><b>Header kolom</b> dicocokkan berdasarkan nama (tidak peka huruf besar/kecil):<ul style="margin:6px 0 0 18px"><li>Guru: nama, email, nip, no wa</li><li>Jadwal: tanggal, jam mulai, jam selesai, guru (email/nama), kelas, mapel</li><li>Jurnal: tanggal, jam mulai, guru, kelas, mapel, materi, ringkasan, hadir, kondisi, kendala, link foto</li></ul></div><div>Tanggal boleh <span class="mono">2026-05-22</span> atau <span class="mono">22/05/2026</span>; jam <span class="mono">09:15</span> atau <span class="mono">09.15</span>.</div></div></div>' +
      '<div class="card"><h3 class="mb">' + ic('shield', 20) + ' Aman & Berulang</h3><ul class="t-sm col" style="gap:8px;margin-left:18px"><li>Data lama <b>hanya dibaca</b>, tidak pernah diubah.</li><li>Dijalankan dua kali = <b>tidak ada data ganda</b> (cocokkan email / tanggal+jam).</li><li>Sebelum hari peralihan, jalankan ulang untuk menyalin <b>data baru</b> saja (delta sync).</li><li>Akun guru baru mendapat <b>PIN acak</b>; unduh daftarnya setelah migrasi.</li></ul></div></div></div>' +
      (MG.run && MG.run.akunBaru.length ? '<div class="card mt"><div class="card-h"><h3>' + ic('key', 20) + ' Akun Baru dari Migrasi (' + MG.run.akunBaru.length + ')</h3><button class="btn s" data-act="csv">' + ic('download', 16) + ' Unduh CSV PIN</button></div><div class="alert warn">' + ic('alert', 18) + '<div class="t-sm">PIN hanya ditampilkan sekali. Unduh sekarang lalu bagikan ke masing-masing guru.</div></div></div>' : '');
  }
  IFP.register('migrasi', {
    init(el) {
      el.addEventListener('input', e => { if (e.target.id === 'mgS') MG.src = e.target.value; });
      el.addEventListener('change', e => { if (e.target.dataset.sh) MG.sheets[e.target.dataset.sh] = e.target.checked; });
      el.addEventListener('click', async e => {
        const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act, sheets = Object.keys(MG.sheets).filter(k => MG.sheets[k]);
        if (a === 'csv') { U.download('akun_migrasi_ifp.csv', U.toCSV(MG.run.akunBaru, [['nama', 'Nama'], ['email', 'Email'], ['pin', 'PIN']])); return; }
        if (!MG.src.trim()) { ui.toast('Tempel URL / ID spreadsheet lama dulu', 'bad'); return; } if (!sheets.length) { ui.toast('Pilih minimal satu jenis data', 'bad'); return; }
        if (a === 'scan') ui.busy(t, async () => { try { MG.scan = await A('migrasi.pindai', { source: MG.src, sheets }); MG.run = null; el.innerHTML = mgHtml(); } catch (er) { MG.scan = null; ui.toast(er.message, 'bad', 7000); } });
        else if (a === 'run') {
          if (!await ui.confirm('Jalankan migrasi sekarang?', 'Data baru akan ditulis ke aplikasi ini. Spreadsheet lama tidak diubah dan migrasi aman diulang.', { ok: 'Jalankan Migrasi' })) return;
          ui.busy(t, async () => { try { MG.run = await A('migrasi.jalankan', { source: MG.src, sheets }, { timeout: 120000 }); el.innerHTML = mgHtml(); ui.toast('Migrasi selesai', 'ok'); IFP.refresh(true); } catch (er) { ui.toast(er.message, 'bad', 8000); } });
        }
      });
    },
    update() {}, show(el) { el.innerHTML = mgHtml(); }
  });
})();
