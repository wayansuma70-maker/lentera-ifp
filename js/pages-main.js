/* =====================================================================
   LENTERA IFP — pages-main.js
   Halaman untuk semua peran: Dashboard, Jadwal Saya, Jurnal, Input Jurnal
   ===================================================================== */
(function () {
  'use strict';
  const IFP = window.IFP, U = IFP.u, ui = IFP.ui, A = IFP.A, esc = U.esc, ic = U.ic, $ = U.$, $$ = U.$$;
  const Store = IFP.Store;
  const B = () => IFP.state.boot, me = () => IFP.state.user, isAdmin = () => me().role === 'admin';
  const dayDiff = (a, b) => Math.round((U.parseD(a) - U.parseD(b)) / 864e5);
  const fotoUrl = (id, w) => 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w' + (w || 600);

  // =================================================================== DASHBOARD
  function tlItem(j) {
    const st = IFP.sesiState(j), cls = { done: 'done', live: 'live', wait: 'wait', next: '', cancel: 'cancel' }[st];
    const can = isAdmin() || j.id_guru === me().id, btn = can && (st === 'live' || st === 'wait' || st === 'done') ? '<button class="btn sm ' + (st === 'done' ? 's' : 'p') + '" data-act="fill" data-id="' + j.id_jadwal + '">' + (st === 'done' ? ic('eye', 14) + ' Lihat / Ubah Jurnal' : ic('edit', 14) + ' Isi Jurnal') + '</button>' : '';
    return '<div class="tl-i ' + cls + '"><div class="tl-t">' + j.jam_mulai + '<small>s/d</small>' + j.jam_selesai + '</div><div class="tl-b"><div class="grow"><b>Kelas ' + esc(j.kelas) + '</b> <span class="badge info">' + esc(j.mata_pelajaran) + '</span>' +
      '<div class="muted t-sm mt-s">' + ic('user', 14) + ' ' + esc(j.nama_guru) + (j.topik ? ' • ' + esc(j.topik) : '') + '</div></div><div class="col" style="gap:8px;align-items:flex-end">' + U.stBadge(st) + btn + '</div></div></div>';
  }
  function reminderBadge(j, today) {
    const d = dayDiff(today, j.tanggal), n = Number(j.pengingat_ke) || 0;
    if (d >= 2 && n === 0) return '<span class="badge bad">' + ic('alert', 12) + ' Peringatan H+' + d + ' Terlewat</span>';
    if (n > 0) return '<span class="badge warn">' + ic('mail', 12) + ' Pengingat dikirim ×' + n + '</span>';
    return '<span class="badge mute">Menunggu pengingat H+1</span>';
  }
  function dashHtml() {
    const b = B(), u = me(), k = b.stats.kpi, adm = isAdmin(), n = U.nowWIB(), set = b.setting, today = n.tgl;
    const kt = k.kondisiTerakhir, kc = !kt || kt.kondisi === 'Baik' ? '' : kt.kondisi === 'Rusak' ? 'bad' : 'warn';
    const hari = b.jadwal.filter(j => j.tanggal === today).sort((a, c) => a.jam_mulai.localeCompare(c.jam_mulai));
    const tung = b.tertunggak || [];
    const nextFill = tung[0];
    const gelar = n.d.getHours() < 11 ? 'Selamat Pagi' : n.d.getHours() < 15 ? 'Selamat Siang' : n.d.getHours() < 18 ? 'Selamat Sore' : 'Selamat Malam';
    const hero = '<div class="card hero"><div class="grow" style="min-width:260px"><span class="eyebrow">' + ic('shield', 14) + ' ' + (adm ? 'Panel Kendali Sentral Operator IFP' : 'Panel Guru Pengguna IFP') + '</span>' +
      '<h1>' + (adm ? 'Selamat Datang, ' : gelar + ', ') + esc(u.nama) + '</h1><p class="muted">' + (adm ? 'Sistem monitoring penjadwalan terintegrasi Google Workspace. Mengelola efektivitas pemanfaatan ' + esc(set.UNIT_IFP) + ' (' + esc(set.MERK_IFP) + ') di ' + esc(set.LOKASI_IFP) + '.' :
        (hari.length ? 'Anda punya <b>' + hari.length + ' sesi</b> pemakaian IFP hari ini.' : 'Tidak ada sesi pemakaian IFP untuk Anda hari ini.') + (tung.length ? ' Ada <b>' + tung.length + ' jurnal</b> yang belum diisi.' : ' Semua jurnal Anda sudah terisi. 🎉')) + '</p>' +
      '<div class="t-sm muted mt-s mono" id="clk">' + U.fmtTglL(today) + ' • ' + n.jam + ' WIB</div></div>' +
      '<div class="row wrap" style="gap:14px"><div class="stat ' + kc + '">' + ic(kc === 'bad' ? 'alert' : 'checkc', 28) + '<div><div class="eyebrow" style="color:inherit">Status Alat</div><b>' + (kc === 'bad' ? 'IFP Dilaporkan Rusak' : kc === 'warn' ? 'IFP Perlu Perhatian' : 'IFP Siap Digunakan') + '</b><div class="t-xs">' + esc(set.LOKASI_IFP) + ' • ' + (kt ? 'laporan terakhir: ' + esc(kt.kondisi) : 'belum ada laporan') + '</div></div></div>' +
      (adm ? '<button class="btn p lg" data-act="book">' + ic('plus', 18) + ' Booking Darurat</button>' : (nextFill ? '<button class="btn p lg" data-act="fill" data-id="' + nextFill.id_jadwal + '">' + ic('edit', 18) + ' Isi Jurnal Sekarang</button>' : '')) + '</div></div>';
    const kpis = '<div class="grid g4 kp">' +
      '<div class="card kpi"><span class="ico g"><div class="ring" style="--p:' + k.kepatuhan + ';width:40px;height:40px;background:conic-gradient(var(--ok) calc(var(--p)*1%),var(--soft) 0)"><b style="width:30px;height:30px;font-size:9px">' + Math.round(k.kepatuhan) + '%</b></div></span><div class="lab">Kepatuhan Jurnal</div><div class="val">' + k.kepatuhan + '%<small>/ 100%</small></div>' +
      '<div class="foot"><span class="badge ' + (k.kepatuhan >= k.target ? 'ok' : 'warn') + '">' + (k.kepatuhan >= k.target ? ic('check', 12) + ' Target tercapai' : (Math.round((k.kepatuhan - k.target) * 10) / 10) + '% dari target') + '</span><span>Target: ≥' + k.target + '%</span></div></div>' +
      '<div class="card kpi"><span class="ico b">' + ic('checkc', 20) + '</span><div class="lab">Total Pemakaian Bulan Ini</div><div class="val">' + k.sesiBulanIni + '<small>Sesi KBM</small></div><div class="foot"><span>Rata-rata ' + k.rataPerHari + ' sesi / hari</span><b class="mono" style="color:var(--primary)">' + k.jamAktif + ' Jam Aktif</b></div></div>' +
      '<div class="card kpi"><span class="ico a">' + ic('clock', 20) + '</span><div class="lab">Menunggu Pengisian</div><div class="val">' + k.menunggu + '<small>Jadwal selesai</small></div><div class="foot"><span class="badge warn">' + ic('mail', 12) + ' Pengingat H+1 Aktif</span><span>Maks ' + (set.PENGINGAT_MAKS || 3) + 'x</span></div></div>' +
      '<div class="card kpi"><span class="ico ' + (kc === 'bad' ? 'r' : kc === 'warn' ? 'a' : 'g') + '">' + ic(kc ? 'alert' : 'checkc', 20) + '</span><div class="lab">Kondisi IFP Terakhir</div><div class="val" style="color:' + (kc === 'bad' ? 'var(--bad)' : kc === 'warn' ? 'var(--warn)' : 'var(--ok)') + '">' + (!kt ? '-' : kt.kondisi === 'Baik' ? 'Prima' : esc(kt.kondisi)) + '</div><div class="foot"><span>' + (kt ? esc(kt.kendala || 'Tanpa kendala') : 'Belum ada laporan') + '</span><span class="mono">' + (kt ? U.fmtTgl(kt.tanggal) : '') + '</span></div></div></div>';
    const pb = b.stats.perBulan, chart = '<div class="card"><div class="card-h"><div><h3>' + ic('chart', 20) + (adm ? 'Tren Penggunaan IFP & Pengisian Jurnal Bulanan' : 'Penggunaan IFP & Jurnal Saya per Bulan') + '</h3><p class="muted t-sm">Total sesi terlaksana vs jurnal yang sudah diisi (6 bulan terakhir)</p></div></div>' +
      '<div class="row wrap t-xs" style="gap:16px;margin-bottom:6px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#1E40AF"></i> Total Sesi</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#059669"></i> Jurnal Terisi</span><span style="color:var(--warn)">┅ Ambang Target ' + k.target + '%</span></div>' +
      IFP.chart.bars(pb.map(x => ({ label: U.bulanLabel(x.bulan), a: x.sesi, b: x.terisi, t: x.sesi * k.target / 100, sub: x.sesi ? '(' + x.pct + '%)' : '' })), { label: 'Tren pemakaian IFP' }) + '</div>';
    const tl = '<div class="card"><div class="card-h"><div><h3>' + ic('clock', 20) + (adm ? 'Jadwal Pemakaian IFP Hari Ini (Live Timeline)' : 'Jadwal Saya Hari Ini') + '</h3><p class="muted t-sm">' + esc(set.UNIT_IFP) + ' • ' + U.fmtTglL(today) + '</p></div>' + (adm ? '<span class="badge ok">' + ic('shield', 12) + ' Anti-Bentrok Otomatis Aktif</span>' : '') + '</div>' +
      (hari.length ? '<div class="tl">' + hari.map(tlItem).join('') + '</div>' : ui.empty('cal', 'Tidak ada sesi hari ini', adm ? 'Tambahkan jadwal di menu Jadwal IFP.' : 'Cek menu Jadwal Saya untuk sesi mendatang.')) + '</div>';
    const tbl = '<div class="card p0"><div class="card-h" style="padding:20px 24px 0"><div><h3>' + ic('bell', 20) + 'Daftar ' + tung.length + ' Jurnal Menunggu Pengisian (Peringatan H+1)</h3><p class="muted t-sm">' + (adm ? 'Pengingat otomatis dikirim lewat WhatsApp/Email sesuai pengaturan notifikasi' : 'Mohon segera lengkapi jurnal berikut') + '</p></div>' + (tung.length ? '<span class="badge warn">Perlu Tindakan</span>' : '<span class="badge ok">Semua Terisi</span>') + '</div>' +
      (tung.length ? '<div class="tw"><table class="t"><thead><tr><th>Tanggal Sesi</th>' + (adm ? '<th>Nama Guru</th>' : '') + '<th>Mata Pelajaran & Kelas</th><th>Status Reminder</th><th></th></tr></thead><tbody>' + tung.slice(0, 12).map(j => '<tr' + (dayDiff(today, j.tanggal) >= 2 ? ' class="hl"' : '') + '><td class="mono nowrap">' + U.fmtTgl(j.tanggal) + '<br><span class="faint">' + j.jam_mulai + '</span></td>' +
        (adm ? '<td><b>' + esc(j.nama_guru) + '</b><br><span class="faint t-xs mono">' + esc(j.email_guru || '') + '</span></td>' : '') + '<td>' + esc(j.mata_pelajaran) + '<br><span class="muted">' + esc(j.kelas) + '</span></td><td>' + reminderBadge(j, today) + '</td><td class="right"><button class="btn sm t" data-act="fill" data-id="' + j.id_jadwal + '">Isi Jurnal</button></td></tr>').join('') + '</tbody></table></div>' : '<div style="padding:8px 24px 24px">' + ui.empty('checkc', 'Tidak ada jurnal tertunggak', 'Kerja bagus! Semua sesi yang selesai sudah dijurnalkan.') + '</div>') + '</div>';
    let side = '';
    if (adm) {
      const top = b.stats.perGuru, kd = b.stats.kondisi, kt2 = kd['Baik'] + kd['Perlu Perhatian'] + kd['Rusak'];
      side = '<div class="card"><div class="card-h"><div><h3>' + ic('bolt', 20) + 'Aksi Cepat & Google Apps Script</h3><p class="muted t-sm">Eksekusi fungsi backend secara instan tanpa membuka Sheets.</p></div><span class="badge ok"><i class="pulse" style="background:var(--ok)"></i> Online</span></div><div class="col" style="gap:10px">' +
        '<button class="btn s" style="justify-content:flex-start" data-act="remind">' + ic('send', 18) + ' Kirim Pengingat Jurnal Sekarang</button><button class="btn s" style="justify-content:flex-start" data-act="sync">' + ic('refresh', 18) + ' Sinkronisasi Kontak CRM</button><button class="btn s" style="justify-content:flex-start" data-act="csv">' + ic('download', 18) + ' Unduh Log CSV Jurnal</button></div>' +
        '<div class="eyebrow mt">Antrean Notifikasi</div><div class="log mt-s" id="qsum">Memuat…</div></div>' +
        '<div class="card"><div class="card-h"><h3>' + ic('users', 20) + 'Guru Teraktif Pakai IFP</h3><span class="badge info">' + U.BLN3[+today.slice(5, 7) - 1] + ' ' + today.slice(0, 4) + '</span></div>' +
        (top.length ? top.map((g, i) => '<div class="bar-row"><span class="rank">' + (i + 1) + '</span><div><b>' + esc(g.nama) + '</b><div class="t-xs muted">' + esc(g.mapel) + ' • ' + g.jam + ' Jam</div></div><span class="badge ' + (g.pct >= 90 ? 'ok' : 'warn') + '">' + g.pct + '% Terisi</span></div>').join('') : ui.empty('users', 'Belum ada data bulan ini')) + '</div>' +
        '<div class="card"><div class="card-h"><h3>' + ic('tv', 20) + 'Distribusi Kondisi Perangkat</h3><span class="badge mute">Audit ' + kt2 + ' Log</span></div>' +
        (kt2 ? IFP.chart.donut([{ val: kd['Baik'], color: '#059669' }, { val: kd['Perlu Perhatian'], color: '#D97706' }, { val: kd['Rusak'], color: '#DC2626' }], Math.round(kd['Baik'] * 100 / kt2) + '%', 'SANGAT BAIK') +
          '<div class="mt">' + [['Baik / Normal', kd['Baik'], '#059669'], ['Perlu Perhatian', kd['Perlu Perhatian'], '#D97706'], ['Rusak / Gangguan', kd['Rusak'], '#DC2626']].map(x => '<div class="donut-l"><span><i style="background:' + x[2] + '"></i>' + x[0] + '</span><b>' + Math.round(x[1] * 100 / kt2) + '% (' + x[1] + ' sesi)</b></div>').join('') + '</div>' : ui.empty('tv', 'Belum ada laporan kondisi')) + '</div>' +
        '<div class="card"><h3 class="mb">' + ic('info', 20) + ' Informasi Unit IFP</h3><div class="col" style="gap:8px;font-size:13px">' + [['Lokasi', set.LOKASI_IFP], ['Perangkat', set.MERK_IFP], ['Nomor Seri', set.SERIAL_IFP], ['Jam Operasional', set.JAM_OPS_MULAI + ' – ' + set.JAM_OPS_SELESAI + ' WIB']].map(x => '<div class="row between"><span class="muted">' + x[0] + '</span><b class="mono">' + esc(x[1]) + '</b></div>').join('') + '</div></div>';
    } else {
      side = '<div class="card"><h3 class="mb">' + ic('info', 20) + ' Informasi Unit IFP</h3><div class="col" style="gap:8px;font-size:13px">' + [['Lokasi', set.LOKASI_IFP], ['Perangkat', set.MERK_IFP], ['Jam Operasional', set.JAM_OPS_MULAI + ' – ' + set.JAM_OPS_SELESAI + ' WIB']].map(x => '<div class="row between"><span class="muted">' + x[0] + '</span><b>' + esc(x[1]) + '</b></div>').join('') + '</div></div>' +
        '<div class="card"><h3 class="mb">' + ic('cal', 20) + ' Sesi Mendatang</h3>' + (b.jadwal.filter(j => j.tanggal > today && j.status !== 'Dibatalkan').sort((a, c) => (a.tanggal + a.jam_mulai).localeCompare(c.tanggal + c.jam_mulai)).slice(0, 5).map(j => '<div class="bar-row" style="grid-template-columns:1fr auto"><div><b>' + esc(j.kelas) + ' • ' + esc(j.mata_pelajaran) + '</b><div class="t-xs muted mono">' + U.fmtTglL(j.tanggal) + ' • ' + j.jam_mulai + '</div></div></div>').join('') || ui.empty('cal', 'Belum ada sesi mendatang')) + '</div>';
    }
    return hero + '<div class="stack mt">' + kpis + '<div class="grid g-main"><div class="stack">' + chart + tl + tbl + '</div><div class="stack">' + side + '</div></div></div>';
  }
  async function exportJurnalCsv() {
    const d = await A('jurnal.list', { limit: 500 });
    IFP.u.download('jurnal_ifp_' + U.nowWIB().tgl + '.csv', U.toCSV(d.rows, [['tanggal', 'Tanggal'], ['jam_mulai', 'Mulai'], ['jam_selesai', 'Selesai'], ['nama_guru', 'Guru'], ['kelas', 'Kelas'], ['mata_pelajaran', 'Mapel'], ['materi', 'Materi'], ['ringkasan', 'Ringkasan'], ['hadir', 'Hadir'], ['tidak_hadir', 'Tidak Hadir'], ['kondisi_ifp', 'Kondisi IFP'], ['kendala', 'Kendala'], ['link_foto', 'Link Foto']]));
    ui.toast(d.rows.length + ' baris jurnal diunduh', 'ok');
  }
  IFP.exportJurnalCsv = exportJurnalCsv;
  IFP.register('dashboard', {
    init(el) {
      el.addEventListener('click', e => {
        const t = e.target.closest('[data-act]'); if (!t) return; const a = t.dataset.act;
        if (a === 'fill') IFP.nav('jurnal-baru', t.dataset.id);
        else if (a === 'book') IFP.nav('jadwal', 'baru');
        else if (a === 'remind') ui.busy(t, async () => { try { const r = await A('pengingat.kirim'); ui.toast('Pengingat dikirim ke ' + r.guru + ' guru', 'ok'); IFP.refresh(true); loadQ(el); } catch (er) { ui.toast(er.message, 'warn', 7000); } });
        else if (a === 'sync') ui.busy(t, async () => { try { const r = await A('crm.sync'); ui.toast('CRM tersinkron: +' + r.ditambah + ' baru, ' + r.diperbarui + ' diperbarui', 'ok'); } catch (er) { ui.toast(er.message, 'bad'); } });
        else if (a === 'csv') ui.busy(t, async () => { try { await exportJurnalCsv(); } catch (er) { ui.toast(er.message, 'bad'); } });
      });
      setInterval(() => { const c = $('#clk'); if (c && IFP.state.page === 'dashboard') { const n = U.nowWIB(); c.textContent = U.fmtTglL(n.tgl) + ' • ' + n.jam + ' WIB'; } }, 20000);
    },
    update(el) { ui.pageHtml(el, 'd', dashHtml()); },
    show(el) { this.update(el); if (isAdmin()) loadQ(el); }
  });
  async function loadQ(el) {
    const q = $('#qsum', el); if (!q) return;
    try {
      const d = await A('notif.queue', {}, { quiet: true }), r = d.ringkasan, last = d.rows[0];
      q.textContent = 'Antri: ' + r.Antri + '  •  Terkirim: ' + r.Terkirim + '  •  Gagal: ' + r.Gagal + (last ? '\n> Terakhir: ' + last.Kanal + ' ' + last.Event + ' — ' + last.Status : '') + (IFP.state.lastMs ? '\n> Latensi API: ' + IFP.state.lastMs + ' ms' : '');
    } catch (e) { q.textContent = 'Tidak dapat memuat antrean.'; }
  }

  // =================================================================== JADWAL SAYA (guru)
  let jsTab = 'next';
  function jadwalSayaHtml() {
    const b = B(), today = U.nowWIB().tgl, list = b.jadwal.filter(j => j.status !== 'Dibatalkan');
    const next = list.filter(j => j.tanggal >= today).sort((a, c) => (a.tanggal + a.jam_mulai).localeCompare(c.tanggal + c.jam_mulai));
    const past = list.filter(j => j.tanggal < today).sort((a, c) => (c.tanggal + c.jam_mulai).localeCompare(a.tanggal + a.jam_mulai));
    const src = jsTab === 'next' ? next : past, groups = {}; src.forEach(j => { (groups[j.tanggal] = groups[j.tanggal] || []).push(j); });
    return '<div class="row between wrap mb"><div><h1>Jadwal Saya</h1><p class="muted">Giliran pemakaian IFP atas nama Anda.</p></div><button class="btn p" data-act="fill0">' + ic('plus', 18) + ' Input Jurnal Baru</button></div>' +
      '<div class="tabs"><button data-tab="next" class="' + (jsTab === 'next' ? 'on' : '') + '">Mendatang (' + next.length + ')</button><button data-tab="past" class="' + (jsTab === 'past' ? 'on' : '') + '">Riwayat 60 hari (' + past.length + ')</button></div>' +
      (Object.keys(groups).length ? Object.keys(groups).map(d => '<div class="card mb"><div class="card-h"><h3>' + ic('cal', 18) + U.fmtTglL(d) + (d === today ? ' <span class="badge info">Hari ini</span>' : '') + '</h3></div><div class="tl">' + groups[d].map(tlItem).join('') + '</div></div>').join('') : '<div class="card">' + ui.empty('cal', jsTab === 'next' ? 'Belum ada jadwal mendatang' : 'Belum ada riwayat', 'Operator akan menambahkan jadwal giliran Anda.') + '</div>');
  }
  IFP.register('jadwal-saya', {
    roles: ['guru'],
    init(el) {
      el.addEventListener('click', e => {
        const tb = e.target.closest('[data-tab]'); if (tb) { jsTab = tb.dataset.tab; this.update(el); return; }
        const t = e.target.closest('[data-act]'); if (!t) return; if (t.dataset.act === 'fill') IFP.nav('jurnal-baru', t.dataset.id); else if (t.dataset.act === 'fill0') IFP.nav('jurnal-baru');
      });
    },
    update(el) { ui.pageHtml(el, 'j', jadwalSayaHtml()); }, show(el) { this.update(el); }
  });

  // =================================================================== JURNAL (riwayat / semua)
  const JL = { q: '', kond: '', dari: '', sampai: '', guru: '', rows: null, total: 0, loading: false };
  function filterLocal(rows) {
    const q = JL.q.toLowerCase();
    return rows.filter(j => (!JL.kond || j.kondisi_ifp === JL.kond) && (!JL.dari || j.tanggal >= JL.dari) && (!JL.sampai || j.tanggal <= JL.sampai) && (!JL.guru || j.id_guru === JL.guru) &&
      (!q || (j.nama_guru + ' ' + j.kelas + ' ' + j.mata_pelajaran + ' ' + j.materi).toLowerCase().indexOf(q) > -1));
  }
  function jurnalListHtml(keepForm) {
    const rows = filterLocal(JL.rows || B().jurnal), adm = isAdmin();
    return '<div class="row between wrap mb"><div><h1>' + (adm ? 'Semua Jurnal' : 'Jurnal Saya') + '</h1><p class="muted">' + (adm ? 'Seluruh jurnal pemakaian IFP dari semua guru.' : 'Riwayat jurnal yang telah Anda isi.') + '</p></div><div class="row"><button class="btn s" data-act="csv">' + ic('download', 18) + ' Ekspor CSV</button><button class="btn p" data-act="new">' + ic('plus', 18) + ' Input Jurnal Baru</button></div></div>' +
      '<div class="card p0"><div style="padding:16px 16px 0"><div class="tools"><div class="row grow" style="position:relative;min-width:200px"><input class="inp" id="jq" placeholder="Cari guru, kelas, mapel, materi…" value="' + esc(JL.q) + '" style="padding-left:38px"><span style="position:absolute;left:12px;top:12px;color:var(--ink3)">' + ic('search', 18) + '</span></div>' +
      '<select class="inp" id="jk"><option value="">Semua kondisi</option>' + ['Baik', 'Perlu Perhatian', 'Rusak'].map(k => '<option ' + (JL.kond === k ? 'selected' : '') + '>' + k + '</option>').join('') + '</select>' +
      '<input class="inp" type="date" id="jd1" value="' + JL.dari + '" aria-label="Dari tanggal"><input class="inp" type="date" id="jd2" value="' + JL.sampai + '" aria-label="Sampai tanggal">' +
      (adm ? '<select class="inp" id="jg"><option value="">Semua guru</option>' + (IFP.guruOpts || []).map(g => '<option value="' + g.id + '" ' + (JL.guru === g.id ? 'selected' : '') + '>' + esc(g.nama) + '</option>').join('') + '</select>' : '') + '</div></div>' +
      (rows.length ? '<div class="tw"><table class="t"><thead><tr><th>Tanggal & Jam</th>' + (adm ? '<th>Guru</th>' : '') + '<th>Kelas</th><th>Mapel</th><th>Materi</th><th>Kondisi IFP</th><th>Foto</th></tr></thead><tbody>' + rows.map(j => '<tr style="cursor:pointer" data-id="' + j.id_jurnal + '"><td class="mono nowrap">' + U.fmtTgl(j.tanggal) + '<br><span class="faint">' + j.jam_mulai + '–' + j.jam_selesai + '</span></td>' + (adm ? '<td>' + esc(j.nama_guru) + '</td>' : '') + '<td>' + esc(j.kelas) + '</td><td>' + esc(j.mata_pelajaran) + '</td><td style="max-width:260px">' + esc(j.materi) + '</td><td>' + U.kondBadge(j.kondisi_ifp) + '</td><td>' + (j.foto_id ? ic('image', 18) : '<span class="faint">-</span>') + '</td></tr>').join('') + '</tbody></table></div>' : ui.empty('book', 'Belum ada jurnal', 'Jurnal muncul di sini setelah diisi.')) +
      '<div class="pager"><span>' + rows.length + ' dari ' + (JL.total || (JL.rows || B().jurnal).length) + ' jurnal' + (JL.loading ? ' • memuat…' : '') + '</span></div></div>';
  }
  function detailJurnal(id) {
    const j = (JL.rows || B().jurnal).find(x => x.id_jurnal === id) || B().jurnal.find(x => x.id_jurnal === id); if (!j) return;
    const own = isAdmin() || j.id_guru === me().id;
    const m = ui.modal('<h3>Detail Jurnal Pemakaian IFP</h3><div class="col" style="gap:10px"><div class="row between wrap"><b>' + esc(j.mata_pelajaran) + ' — ' + esc(j.kelas) + '</b>' + U.kondBadge(j.kondisi_ifp) + '</div>' +
      '<div class="muted t-sm mono">' + U.fmtTglL(j.tanggal) + ' • ' + j.jam_mulai + '–' + j.jam_selesai + ' WIB</div><div class="t-sm">' + ic('user', 14) + ' ' + esc(j.nama_guru) + '</div>' +
      '<div><div class="lbl">Materi</div>' + esc(j.materi) + '</div><div><div class="lbl">Ringkasan Aktivitas</div><div style="white-space:pre-wrap">' + esc(j.ringkasan) + '</div></div>' +
      '<div class="row" style="gap:20px"><span>Hadir: <b>' + (j.hadir || 0) + '</b></span><span>Sakit/Izin: <b>' + (j.tidak_hadir || 0) + '</b></span></div>' + (j.kendala ? '<div class="alert warn">' + ic('alert', 18) + '<div><b>Kendala:</b> ' + esc(j.kendala) + '</div></div>' : '') +
      (j.foto_id ? '<div><div class="lbl">Foto Dokumentasi</div><a href="' + esc(j.link_foto) + '" target="_blank" rel="noopener"><img src="' + fotoUrl(j.foto_id, 800) + '" alt="Foto kegiatan" style="max-width:100%;border-radius:12px;margin-top:6px;border:1px solid var(--line)" loading="lazy" onerror="this.outerHTML=\'<span class=muted>Foto tidak dapat dipratinjau. Buka tautan Drive.</span>\'"></a></div>' : '') +
      '<div class="faint t-xs">Diisi ' + U.fmtWaktu(j.diisi_pada) + '</div></div><div class="acts"><button class="btn s" data-close="1">Tutup</button>' + (own ? '<button class="btn p" id="edj">' + ic('edit', 16) + ' Ubah Jurnal</button>' : '') + '</div>', { wide: true, noFocus: true });
    const ed = m.$('#edj'); if (ed) ed.onclick = () => { m.close(); IFP.nav('jurnal-baru', j.id_jadwal); };
  }
  const loadJurnal = U.debounce(async el => {
    JL.loading = true; const r = await IFP.api('jurnal.list', { cari: JL.q, kondisi: JL.kond, dari: JL.dari, sampai: JL.sampai, guru: JL.guru, limit: 300 }, { quiet: true }); JL.loading = false;
    if (r.success) { JL.rows = r.data.rows; JL.total = r.data.total; draw(el); } else draw(el);
  }, 350);
  function draw(el, keep) {
    const a = document.activeElement, id = a && a.id, pos = a && a.selectionStart; el.innerHTML = jurnalListHtml();
    if (id) { const n = $('#' + id, el); if (n) { n.focus(); if (pos != null && n.setSelectionRange && n.type === 'text') try { n.setSelectionRange(pos, pos); } catch (e) {} } }
  }
  IFP.register('jurnal', {
    init(el) {
      el.addEventListener('input', e => { const t = e.target; if (t.id === 'jq') JL.q = t.value; else return; draw(el); loadJurnal(el); });
      el.addEventListener('change', e => { const t = e.target; if (t.id === 'jk') JL.kond = t.value; else if (t.id === 'jd1') JL.dari = t.value; else if (t.id === 'jd2') JL.sampai = t.value; else if (t.id === 'jg') JL.guru = t.value; else return; draw(el); loadJurnal(el); });
      el.addEventListener('click', e => {
        const tr = e.target.closest('tr[data-id]'); if (tr) { detailJurnal(tr.dataset.id); return; }
        const t = e.target.closest('[data-act]'); if (!t) return;
        if (t.dataset.act === 'new') IFP.nav('jurnal-baru'); else if (t.dataset.act === 'csv') ui.busy(t, async () => { try { await exportJurnalCsv(); } catch (er) { ui.toast(er.message, 'bad'); } });
      });
    },
    update(el) { if (!JL.rows) draw(el); },
    async show(el) {
      JL.rows = null; draw(el); loadJurnal(el);
      if (isAdmin() && !IFP.guruOpts) { try { const g = await A('guru.list', {}, { quiet: true }); IFP.guruOpts = g.filter(x => x.peran === 'Guru').map(x => ({ id: x.id_pengguna, nama: x.nama })); draw(el); } catch (e) {} }
    }
  });

  // =================================================================== INPUT JURNAL
  let FP = null;            // foto terpilih {data, mime, name, url, size, orig}
  function candidates() {
    const today = U.nowWIB().tgl;
    return B().jadwal.filter(j => j.status !== 'Dibatalkan' && (isAdmin() ? j.tanggal <= U.addDays(today, 7) : j.tanggal <= today)).sort((a, c) => (c.tanggal + c.jam_mulai).localeCompare(a.tanggal + a.jam_mulai)).slice(0, 80);
  }
  function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
  async function compress(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Format foto harus JPG, PNG, atau WEBP.');
    if (file.size > 15 * 1024 * 1024) throw new Error('Ukuran foto terlalu besar (maks 15 MB).');
    const u = URL.createObjectURL(file); let img; try { img = await loadImg(u); } finally { URL.revokeObjectURL(u); }
    const sc = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * sc), h = Math.round(img.naturalHeight * sc);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0, w, h);
    const url = cv.toDataURL('image/jpeg', 0.72), data = url.split(',')[1], size = Math.round(data.length * 0.75);
    return { data, mime: 'image/jpeg', name: file.name.replace(/\.\w+$/, '') + '.jpg', url, size, orig: file.size, w, h };
  }
  const kb = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';
  function formHtml(j, ex, dr) {
    const guru = (ex && ex.nama_guru) || j.nama_guru, v = ex || dr || {}, kond = v.kondisi_ifp || 'Baik', cands = candidates();
    const rc = (val, cls, title, desc) => '<label class="radio-card ' + cls + (kond === val ? ' sel' : '') + '"><input type="radio" name="kond" value="' + val + '" ' + (kond === val ? 'checked' : '') + '><div class="grow"><b>' + title + '</b><div class="t-sm muted">' + desc + '</div></div></label>';
    return '<div class="row between wrap mb"><div><div class="muted t-sm">' + ic('edit', 14) + ' Jurnal Saya › <b style="color:var(--primary)">' + (ex ? 'Ubah Jurnal' : 'Isi Jurnal Baru') + '</b></div><h1>Formulir Digital Jurnal Pemakaian IFP</h1><p class="muted">Pelaporan aktivitas kegiatan belajar mengajar dan verifikasi status operasional panel interaktif.</p></div>' +
      '<span class="badge info">' + ic('tv', 12) + ' ' + esc(B().setting.LOKASI_IFP) + ' • ' + esc(B().setting.MERK_IFP) + '</span></div>' +
      '<div class="alert info mb">' + ic('info', 20) + '<div><b>Sinkronisasi Otomatis Google Sheets</b><div class="t-sm">Data sesi dan identitas terisi otomatis sesuai jadwal. Laporkan materi, kondisi alat, dan lampirkan foto dokumentasi kelas.</div></div></div>' +
      '<div class="grid g-form"><div class="stack">' +
      '<div class="card"><div class="card-h"><h3><span class="sec-n"></span>1. Informasi Jadwal & Identitas Guru</h3><span class="badge ok">' + ic('lock', 12) + ' Auto-filled</span></div>' +
      '<div class="fld mb"><label>Sesi pemakaian</label><select id="jfSesi">' + cands.map(c => '<option value="' + c.id_jadwal + '" ' + (c.id_jadwal === j.id_jadwal ? 'selected' : '') + '>' + U.fmtTgl(c.tanggal) + ' • ' + c.jam_mulai + ' • ' + esc(c.kelas) + ' • ' + esc(c.mata_pelajaran) + (isAdmin() ? ' • ' + esc(c.nama_guru) : '') + (c.status_jurnal === 'Sudah Diisi' ? ' ✓' : '') + '</option>').join('') + '</select></div>' +
      '<div class="f2" style="background:var(--primary-bg);padding:16px;border-radius:12px;font-size:13px">' + [['Nama lengkap guru', guru], ['NIP / ID Guru', (ex && ex.nip) || (isAdmin() ? '-' : me().nip) || '-'], ['Kelas terdaftar', j.kelas], ['Alokasi waktu KBM', j.jam_mulai + ' – ' + j.jam_selesai + ' WIB'], ['Mata pelajaran', j.mata_pelajaran], ['Tanggal', U.fmtTglL(j.tanggal)]].map(x => '<div><div class="lbl">' + x[0] + '</div><b>' + esc(x[1]) + '</b></div>').join('') + '</div></div>' +
      '<div class="card"><div class="card-h"><h3><span class="sec-n"></span>2. Detail Kegiatan KBM & Materi Pembelajaran</h3></div><div class="col">' +
      ui.fld('Materi / Topik Pembelajaran *', '<input id="jfMateri" maxlength="300" value="' + esc(v.materi || j.topik || '') + '" placeholder="Contoh: Eksplorasi Algoritma dengan Whiteboard Interaktif">', 'Pastikan topik mencakup pemanfaatan media interaktif.') +
      ui.fld('Ringkasan Aktivitas Siswa di Kelas *', '<textarea id="jfRing" maxlength="2000" placeholder="Deskripsikan interaksi dan metode kolaborasi…">' + esc(v.ringkasan || '') + '</textarea>', '<span class="row between"><span>Deskripsikan minimal interaksi dan metode kolaborasi.</span><span class="mono" id="jfCnt">' + (v.ringkasan || '').length + ' karakter</span></span>') +
      '<div class="f2"><div class="fld"><label>Hadir (siswa)</label><input id="jfHadir" type="number" min="0" inputmode="numeric" value="' + (v.hadir != null ? v.hadir : '') + '"></div><div class="fld"><label>Sakit / Izin / Alpa</label><input id="jfTidak" type="number" min="0" inputmode="numeric" value="' + (v.tidak_hadir != null ? v.tidak_hadir : '') + '"></div></div></div></div></div>' +
      '<div class="stack"><div class="card"><div class="card-h"><h3><span class="sec-n"></span>3. Pemantauan Kondisi IFP</h3><span class="badge bad">Wajib Dilaporkan</span></div><p class="muted t-sm mb">Pilih evaluasi fisik dan fungsional layar sentuh setelah selesai jam mengajar.</p><div class="col" style="gap:10px" id="jfKond">' +
      rc('Baik', 'ok', 'Baik & Berfungsi Normal', 'Stylus akurat, multi-touch responsif, audio jernih, tidak ada panas berlebih.') + rc('Perlu Perhatian', 'warn', 'Perlu Perhatian', 'Contoh: kalibrasi ujung stylus agak bergeser, port USB depan longgar, koneksi WiFi sesekali delay.') + rc('Rusak', 'bad', 'Rusak / Ada Gangguan', 'Contoh: layar berkedip, kabel HDMI putus, OS panel macet total, panel touch mati.') + '</div>' +
      '<div class="fld mt" id="jfKendalaW"><label>Catatan Kendala Teknis <span class="faint" style="text-transform:none">(<span id="jfKReq">' + (kond === 'Baik' ? 'opsional' : 'wajib diisi') + '</span>)</span></label><input id="jfKendala" maxlength="500" value="' + esc(v.kendala || '') + '" placeholder="Misal: stylus sebelah kiri baterainya habis / port HDMI longgar"></div></div>' +
      '<div class="card"><div class="card-h"><h3><span class="sec-n"></span>4. Foto Dokumentasi KBM</h3><span class="badge info">' + ic('upload', 12) + ' Google Drive</span></div>' +
      '<div class="dz" id="jfDz" tabindex="0" role="button" aria-label="Unggah foto">' + ic('upload', 32) + '<div style="margin-top:6px"><b>Unggah foto kegiatan KBM (JPG / PNG)</b></div><div class="t-sm muted">Tarik & letakkan foto di sini, atau <a>pilih dari galeri / kamera</a></div><div class="t-xs muted mt-s">Foto dikompres otomatis sebelum disimpan ke folder Drive <span class="mono">IFP-Jurnal-Foto/' + j.tanggal.slice(0, 7) + '</span></div></div>' +
      '<input type="file" id="jfFile" accept="image/jpeg,image/png,image/webp" capture="environment" class="hide"><div id="jfThumb">' + (ex && ex.foto_id ? '<div class="thumb"><img src="' + fotoUrl(ex.foto_id, 200) + '" alt=""><div class="grow"><b class="t-sm">Foto tersimpan di Drive</b><div class="t-xs muted">Unggah foto baru untuk menggantinya.</div></div></div>' : '') + '</div></div></div></div>' +
      '<div class="card mt sticky-act"><div class="row between wrap"><div class="row rcpt" style="max-width:520px">' + '<span class="ico g" style="width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--ok-bg);color:var(--ok);flex:none">' + ic('mail', 20) + '</span><div><b class="t-sm">Tanda Terima Real-time</b><div class="t-xs muted">Bukti pengisian jurnal dikirim otomatis ke email/WhatsApp Anda (bila notifikasi diaktifkan operator).</div></div></div>' +
      '<div class="row wrap"><button class="btn t" id="jfDraft">' + ic('check', 16) + ' Simpan Draf</button><button class="btn p lg" id="jfSend" data-busy="Mengirim…">' + ic('send', 18) + ' Kirim Jurnal</button></div></div></div>';
  }
  function showThumb(el) {
    const t = $('#jfThumb', el); if (!t || !FP) return;
    t.innerHTML = '<div class="thumb"><img src="' + FP.url + '" alt="Pratinjau foto"><div class="grow"><b class="t-sm mono" style="word-break:break-all">' + esc(FP.name) + '</b><div class="t-xs muted mono">' + kb(FP.size) + ' • ' + FP.w + '×' + FP.h + '</div><span class="badge ok">' + ic('check', 12) + ' Siap Diunggah</span> <span class="badge mute">Kompresi ' + Math.max(0, Math.round(100 - FP.size * 100 / FP.orig)) + '%</span></div><button class="btn sm od" id="jfRm" aria-label="Hapus foto">' + ic('trash', 16) + '</button></div>';
    $('#jfRm', el).onclick = () => { FP = null; t.innerHTML = ''; };
  }
  function readForm(el, id) {
    return { id_jadwal: id, materi: $('#jfMateri', el).value.trim(), ringkasan: $('#jfRing', el).value.trim(), hadir: $('#jfHadir', el).value, tidak_hadir: $('#jfTidak', el).value, kondisi_ifp: ($('input[name=kond]:checked', el) || {}).value || '', kendala: $('#jfKendala', el).value.trim() };
  }
  IFP.register('jurnal-baru', {
    init(el) {
      el.addEventListener('change', async e => {
        const t = e.target;
        if (t.id === 'jfSesi') IFP.nav('jurnal-baru', t.value);
        else if (t.name === 'kond') { $$('.radio-card', el).forEach(r => r.classList.toggle('sel', r.querySelector('input').checked)); $('#jfKReq', el).textContent = t.value === 'Baik' ? 'opsional' : 'wajib diisi'; }
        else if (t.id === 'jfFile' && t.files[0]) { try { FP = await compress(t.files[0]); showThumb(el); } catch (er) { ui.toast(er.message || 'Foto tidak dapat diproses', 'bad'); } t.value = ''; }
      });
      el.addEventListener('input', e => { if (e.target.id === 'jfRing') $('#jfCnt', el).textContent = e.target.value.length + ' karakter'; });
      el.addEventListener('click', e => {
        if (e.target.closest('#jfDz')) $('#jfFile', el).click();
        else if (e.target.closest('#jfDraft')) { const d = readForm(el, state().param); Store.set('draft:' + d.id_jadwal, d); ui.toast('Draf disimpan di perangkat ini', 'ok'); }
        else if (e.target.closest('#jfSend')) submit(el, e.target.closest('#jfSend'));
      });
      const dz = () => $('#jfDz', el);
      el.addEventListener('dragover', e => { if (e.target.closest('#jfDz')) { e.preventDefault(); dz().classList.add('over'); } });
      el.addEventListener('dragleave', () => dz() && dz().classList.remove('over'));
      el.addEventListener('drop', async e => { if (!e.target.closest('#jfDz')) return; e.preventDefault(); dz().classList.remove('over'); const f = e.dataTransfer.files[0]; if (f) { try { FP = await compress(f); showThumb(el); } catch (er) { ui.toast(er.message, 'bad'); } } });
      el.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'jfDz') $('#jfFile', el).click(); });
    },
    show(el, param) {
      const b = B(), cands = candidates(); FP = null;
      if (!cands.length) { el.innerHTML = '<div class="card">' + ui.empty('cal', 'Belum ada sesi yang bisa dijurnalkan', 'Jurnal bisa diisi pada hari pelaksanaan jadwal Anda.') + '</div>'; return; }
      let j = param && b.jadwal.find(x => x.id_jadwal === param);
      if (!j) { const today = U.nowWIB().tgl; j = cands.filter(c => c.status_jurnal !== 'Sudah Diisi' && c.tanggal <= today)[0] || cands[0]; if (j.id_jadwal !== param) { history.replaceState(null, '', '#/jurnal-baru/' + encodeURIComponent(j.id_jadwal)); IFP.state.param = j.id_jadwal; } }
      const ex = b.jurnal.find(x => x.id_jadwal === j.id_jadwal), dr = !ex && Store.get('draft:' + j.id_jadwal);
      el.innerHTML = formHtml(j, ex, dr);
      if (dr) ui.toast('Draf tersimpan sebelumnya dipulihkan', 'warn');
      if (ex === undefined && j.status_jurnal === 'Sudah Diisi') ui.toast('Jurnal sesi ini sudah ada. Menyimpan akan memperbarui jurnal tersebut.', 'warn', 6000);
    }
  });
  const state = () => IFP.state;
  async function submit(el, btn) {
    const id = state().param, d = readForm(el, id);
    if (!d.materi) { ui.toast('Materi / topik pembelajaran wajib diisi', 'bad'); $('#jfMateri', el).focus(); return; }
    if (!d.ringkasan) { ui.toast('Ringkasan aktivitas siswa wajib diisi', 'bad'); $('#jfRing', el).focus(); return; }
    if (!d.kondisi_ifp) { ui.toast('Pilih kondisi IFP', 'bad'); return; }
    if (d.kondisi_ifp !== 'Baik' && !d.kendala) { ui.toast('Catatan kendala teknis wajib diisi bila IFP perlu perhatian / rusak', 'bad'); $('#jfKendala', el).focus(); return; }
    if (FP) d.foto = { data: FP.data, mime: FP.mime, nama: FP.name };
    await ui.busy(btn, async () => {
      try {
        const r = await A('jurnal.save', d), b = B();
        IFP.patchJadwal(r.jadwal); const i = b.jurnal.findIndex(x => x.id_jadwal === id); if (i > -1) b.jurnal[i] = r.jurnal; else b.jurnal.unshift(r.jurnal);
        b.tertunggak = (b.tertunggak || []).filter(x => x.id_jadwal !== id); b.stats.kpi.menunggu = Math.max(0, b.stats.kpi.menunggu - 1); IFP.setBoot(b);
        Store.del('draft:' + id); FP = null; ui.toast('Jurnal berhasil disimpan ✓', 'ok'); IFP.nav(isAdmin() ? 'jurnal' : 'dashboard'); IFP.refresh(true);
      } catch (er) { ui.toast(er.message, 'bad', 7000); }
    });
  }
})();
