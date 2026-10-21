# Lentera IFP — Frontend

Aplikasi web Jadwal & Jurnal Penggunaan IFP (Interaktif Flat Panel). Frontend statis (HTML/CSS/JS murni) yang
berbicara dengan backend Google Apps Script lewat REST/JSON.

- Isi **satu baris** `GAS_URL` di `js/config.js` dengan URL Web App (`.../exec`).
- Deploy ke GitHub Pages: root repo = isi folder ini (`index.html` harus di root).
- Backend (`Kode.gs`, `Notifikasi.gs`, `Migrasi.gs`, `appsscript.json`) **tidak** ikut di repo ini; pasang di Apps Script.

Panduan lengkap: lihat `PANDUAN-INSTALASI.md`.
