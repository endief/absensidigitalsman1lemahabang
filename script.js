// ==============================================================
// ==== MESIN ANIMASI PREMIUM (LOADING/SUCCESS/CONFIRM) =========
// ==============================================================
const PremiumAlert = {
    init() {
        if (document.getElementById('premium-overlay')) return;
        const html = `
            <div id="premium-overlay" class="premium-overlay">
                <div class="premium-card">
                    <div id="p-icon-container" class="p-icon-container">
                        <div class="p-dots"><div class="p-dot"></div><div class="p-dot"></div><div class="p-dot"></div></div>
                        <div class="p-circle"></div>
                        <svg id="p-svg-success" class="p-svg" viewBox="0 0 24 24" style="display:none;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        <svg id="p-svg-error" class="p-svg" viewBox="0 0 24 24" style="display:none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        <svg id="p-svg-warning" class="p-svg" viewBox="0 0 24 24" style="display:none;"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        <div class="p-ripple"></div>
                    </div>
                    <h3 id="p-title" style="margin-bottom:8px; font-size:20px; color:#0f172a; font-family:var(--font-heading); font-weight:800;"></h3>
                    <p id="p-text" style="font-size:14px; color:#64748b; margin:0; font-weight:500;"></p>
                    
                    <div id="p-actions" class="p-actions">
                        <button id="p-btn-cancel" class="p-btn p-btn-cancel">Batal</button>
                        <button id="p-btn-confirm" class="p-btn p-btn-confirm">Ya</button>
                    </div>
                </div>
            </div>
            <div id="premium-snackbar" class="premium-snackbar">
                <div id="sb-icon" class="sb-icon-wrapper"></div>
                <div class="sb-text-container">
                    <div id="sb-title" class="sb-title"></div>
                    <div id="sb-desc" class="sb-desc"></div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    },
    showLoading(title, text) {
        this.init();
        const overlay = document.getElementById('premium-overlay');
        const container = document.getElementById('p-icon-container');
        document.getElementById('p-title').innerText = title || 'Memproses...';
        document.getElementById('p-text').innerText = text || 'Mohon tunggu sebentar';
        document.getElementById('p-actions').classList.remove('show'); // Sembunyikan tombol

        container.className = 'p-icon-container is-loading';
        document.querySelectorAll('.p-svg').forEach(el => el.style.display = 'none');
        overlay.classList.add('show');
    },
    confirm(title, text, confirmText = 'Ya', isOrangeColor = false) {
        return new Promise((resolve) => {
            this.init();
            const overlay = document.getElementById('premium-overlay');
            const container = document.getElementById('p-icon-container');
            const actions = document.getElementById('p-actions');
            const btnCancel = document.getElementById('p-btn-cancel');
            const btnConfirm = document.getElementById('p-btn-confirm');

            document.getElementById('p-title').innerText = title;
            document.getElementById('p-text').innerText = text;

            // Set ikon menjadi warning (tanda seru)
            container.className = 'p-icon-container is-finished is-warning';
            document.querySelectorAll('.p-svg').forEach(el => el.style.display = 'none');
            document.getElementById('p-svg-warning').style.display = 'block';

            // Atur gaya tombol confirm
            btnConfirm.innerText = confirmText;
            btnConfirm.className = isOrangeColor ? 'p-btn p-btn-confirm orange' : 'p-btn p-btn-confirm';

            actions.classList.add('show');
            overlay.classList.add('show');

            const handleClose = (result) => {
                btnCancel.onclick = null;
                btnConfirm.onclick = null;
                // Jika batal, tutup overlay. Jika Ya, biarkan terbuka karena akan ditimpa loading
                if (!result) { 
                    actions.classList.remove('show'); 
                    overlay.classList.remove('show'); 
                }
                resolve(result);
            };

            btnCancel.onclick = () => handleClose(false);
            btnConfirm.onclick = () => handleClose(true);
        });
    },
    finish(type, title, text, callback) {
        this.init();
        const overlay = document.getElementById('premium-overlay');
        const container = document.getElementById('p-icon-container');
        document.getElementById('p-actions').classList.remove('show');

        if (!overlay.classList.contains('show')) {
            document.getElementById('p-title').innerText = title;
            document.getElementById('p-text').innerText = text;
            container.className = 'p-icon-container is-loading';
            document.querySelectorAll('.p-svg').forEach(el => el.style.display = 'none');
            overlay.classList.add('show');
            setTimeout(() => this.executeFinish(type, title, text, callback), 150);
        } else {
            this.executeFinish(type, title, text, callback);
        }
    },
    executeFinish(type, title, text, callback) {
        const container = document.getElementById('p-icon-container');
        const overlay = document.getElementById('premium-overlay');

        document.getElementById('p-title').innerText = title;
        document.getElementById('p-text').innerText = text;
        container.className = 'p-icon-container is-merging';

        setTimeout(() => {
            container.className = `p-icon-container is-finished is-${type}`;
            document.querySelectorAll('.p-svg').forEach(el => el.style.display = 'none');
            document.getElementById(`p-svg-${type}`).style.display = 'block';

            setTimeout(() => {
                overlay.classList.remove('show');
                this.showSnackbar(type, title, text);
                if (callback) callback();
            }, 1800);
        }, 400); 
    },
    showSnackbar(type, title, text) {
        this.init();
        const sb = document.getElementById('premium-snackbar');
        const sbIcon = document.getElementById('sb-icon');
        sbIcon.className = `sb-icon-wrapper sb-${type}`;
        
        let iconSvg = '';
        if(type === 'success') iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        if(type === 'error') iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
        if(type === 'warning') iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
        
        sbIcon.innerHTML = iconSvg;
        document.getElementById('sb-title').innerText = title;
        document.getElementById('sb-desc').innerText = text;

        sb.classList.add('show');
        setTimeout(() => { sb.classList.remove('show'); }, 4000); 
    },
    close() {
        const overlay = document.getElementById('premium-overlay');
        if(overlay) overlay.classList.remove('show');
    }
};

// ==== FUNGSI PENGGANTI YANG LAMA ====
function showCustomLoading(title, text) {
    PremiumAlert.showLoading(title, text);
}


// ==== FUNGSI TOGGLE PASSWORD MATA ====
function togglePassword(inputId, iconDiv) {
    const input = document.getElementById(inputId);
    const eyeOpen = iconDiv.querySelector('.eye-open');
    const eyeClosed = iconDiv.querySelector('.eye-closed');

    if (input.type === 'password') {
        input.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
    } else {
        input.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
    }
}

// ==== KONFIGURASI FIREBASE ====
const firebaseConfig = {
    apiKey: "AIzaSyAIKGbTo0VPDP52YXzBcbC6BvPjT_KUv9M",
    authDomain: "absensidigitalsman1lemahabang.firebaseapp.com",
    databaseURL: "https://absensidigitalsman1lemahabang-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "absensidigitalsman1lemahabang",
    storageBucket: "absensidigitalsman1lemahabang.firebasestorage.app",
    messagingSenderId: "1065589111243",
    appId: "1:1065589111243:web:13fe164a39353f09ac9e4e"
};
firebase.initializeApp(firebaseConfig);

// ==== KONFIGURASI SUPABASE (STORAGE) ====
const supabaseUrl = 'https://hwljckozqobryksiliip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3bGpja296cW9icnlrc2lsaWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjIyMTQsImV4cCI6MjA5Mjg5ODIxNH0.HnUA_iF-OP38YjqK4laPLbpkbfDTiVuG189vJoIprn0';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

// ==== FUNGSI PEMBERSIH NAMA UNTUK FIREBASE ====
function sanitizeKey(nama) {
    if(!nama) return "unknown";
    return nama.replace(/[.#$\[\]]/g, '_'); 
}

// ==== DATA SISWA PER KELAS ====
let daftarNamaPerKelas = {};
firebase.database().ref('siswa').on('value', (snapshot) => {
    daftarNamaPerKelas = snapshot.val() || {};
    refreshActiveUI();
});

let dbAbsensi = [];
let dbRekapBulanan = { kelas: {}, siswa: {} }; 
let streamKamera = null;
let currentUser = null; 

// SVG Icon Modern untuk Tabel Status
const iconCheckSVG = `<svg class="anim-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const iconCrossSVG = `<svg class="anim-cross" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

function getStatusBadge(status) {
    if (status === 'Hadir') return `<span class="badge-status badge-hadir">${iconCheckSVG} Hadir</span>`;
    if (status === 'Tidak Hadir') return `<span class="badge-status badge-alpha">${iconCrossSVG} Tidak Hadir</span>`;
    return `<span class="badge-status badge-belum">Belum Absen</span>`;
}

// ==== LISTENER REAL‑TIME FIREBASE ====
function initFirebaseListeners() {
    firebase.database().ref('absensi').on('value', (snapshot) => {
        const val = snapshot.val();
        dbAbsensi = val ? Object.keys(val).map(key => ({ id: key, ...val[key] })) : [];
        refreshActiveUI();
    });

    firebase.database().ref('rekap_bulanan').on('value', (snapshot) => {
        const val = snapshot.val() || { kelas: {}, siswa: {} };
        dbRekapBulanan.kelas = val.kelas || {};
        dbRekapBulanan.siswa = val.siswa || {};
        refreshActiveUI();
    });

    firebase.database().ref('settings/status_absen').on('value', (snapshot) => {
        const status = snapshot.val();
        const absenPanel = document.getElementById('panel-absen');
        if (status === 'ditutup' && absenPanel.classList.contains('active')) {
            switchPanel('panel-awal');
            matikanKamera();
            PremiumAlert.finish('warning', 'Sesi Ditutup', 'Absensi saat ini ditutup oleh pengelola.');
        }
    });
}
initFirebaseListeners();

// ==== KONFIGURASI GEOFENCING ====
const KANTOR_LAT = -6.818837;
const KANTOR_LON = 108.629478;
const BATAS_JARAK_METER = 75; 

function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); 
}

function verifikasiLokasi() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject("Browser HP Anda tidak mendukung fitur lokasi.");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const jarak = hitungJarak(position.coords.latitude, position.coords.longitude, KANTOR_LAT, KANTOR_LON);
                if (jarak <= BATAS_JARAK_METER) resolve(jarak);
                else reject(`Anda berada di luar area absen! Jarak Anda ${Math.round(jarak)} meter.`);
            },
            (error) => reject("Gagal mendapatkan lokasi. Pastikan GPS menyala."),
            { enableHighAccuracy: true, timeout: 10000 } 
        );
    });
}

function refreshActiveUI() {
    if (document.getElementById('panel-dashboard-admin').classList.contains('active')) renderTabelAdmin();
    if (document.getElementById('panel-dashboard-kelas').classList.contains('active')) renderTabelKelas();
    if (document.getElementById('panel-absen').classList.contains('active')) {
        const kelas = document.getElementById('kelas').value;
        if (kelas) renderNama(document.getElementById('search-nama').value);
    }
    if (document.getElementById('modal-kehadiran').classList.contains('show')) renderTabelKehadiran();
    if (document.getElementById('modal-kehadiran-kelas').classList.contains('show')) renderTabelKehadiranKelas();
    if (document.getElementById('modal-peringkat-kelas').classList.contains('show')) renderPeringkatKelas();
    if (document.getElementById('modal-peringkat-siswa').classList.contains('show')) renderPeringkatSiswa();
    if (document.getElementById('modal-peringkat-siswa-kelas').classList.contains('show')) renderPeringkatSiswaKelas();
}

// ==== FUNGSI LOGIN UMUM ====
async function loginUmum() {
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    if (!user || !pass) return PremiumAlert.finish('warning', 'Gagal', 'Silakan isi username dan password.');

    PremiumAlert.showLoading('Memeriksa...', 'Sedang masuk ke sistem');

    const adminSnap = await firebase.database().ref('admin/' + user).once('value');
    if (adminSnap.exists() && adminSnap.val().password === pass) {
        currentUser = { role: 'admin', username: user }; 
        document.getElementById('admin-user').value = ''; document.getElementById('admin-pass').value = '';
        PremiumAlert.close();
        PremiumAlert.showSnackbar('success', 'Akses Diterima', `Selamat datang kembali, ${user}.`);
        switchPanel('panel-dashboard-admin', true);
        renderTabelAdmin(); updateTeksTombolBukaTutup();
        return;
    }

    const adminKelasSnap = await firebase.database().ref('admin_perkelas/' + user).once('value');
    if (adminKelasSnap.exists() && adminKelasSnap.val().password === pass) {
        const data = adminKelasSnap.val();
        currentUser = { role: 'admin_kelas', username: user, kelas: data.kelas };
        document.getElementById('admin-user').value = ''; document.getElementById('admin-pass').value = '';
        PremiumAlert.close();
        PremiumAlert.showSnackbar('success', 'Akses Diterima', `Selamat datang Admin Kelas ${data.kelas}.`);
        switchPanel('panel-dashboard-kelas', true);
        document.getElementById('admin-kelas-display').innerText = `Admin Kelas ${data.kelas}`;
        renderTabelKelas();
        return;
    }

    PremiumAlert.finish('error', 'Akses Ditolak', 'Username atau password salah.');
}

function logoutUmum() {
    currentUser = null;
    switchPanel('panel-awal', false);
}

// ==== ADMIN UTAMA: KELOLA ADMIN KELAS ====
function bukaModalKelolaAdminKelas() {
    openModal('modal-kelola-admin');
    renderDaftarAdminKelas();
    generateAdminKelasPilihList();
    document.getElementById('admin-baru-kelas').value = '';
    document.getElementById('teks-admin-baru-kelas').innerText = '-- Pilih Kelas --';
}

async function renderDaftarAdminKelas() {
    const container = document.getElementById('daftar-admin-kelas');
    const snap = await firebase.database().ref('admin_perkelas').once('value');
    const data = snap.val() || {};
    const adminArray = Object.keys(data).map(username => ({ username, ...data[username] }));
    if (adminArray.length === 0) return container.innerHTML = '<p style="color:#888; text-align:center;">Belum ada admin perkelas.</p>';
    
    container.innerHTML = adminArray.map(a => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid #e2e8f0; border-radius:12px; margin-bottom:8px;">
            <div><strong style="color:#1e293b;">${a.username}</strong><br><small style="color:#64748b;">Kelas: ${a.kelas}</small></div>
            <button class="btn-small btn-delete-small" onclick="hapusAdminKelas('${a.username}')">Hapus</button>
        </div>
    `).join('');
}

function generateAdminKelasPilihList() {
    const container = document.getElementById('list-admin-kelas-pilih-container');
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const kelas = "XIF" + i;
        container.innerHTML += `<div class="modal-item" onclick="pilihAdminBaruKelas('${kelas}')">${kelas}</div>`;
    }
}

function pilihAdminBaruKelas(kelas) {
    document.getElementById('admin-baru-kelas').value = kelas;
    document.getElementById('teks-admin-baru-kelas').innerText = kelas;
    closeModal('modal-admin-kelas-pilih');
}

async function tambahAdminKelas() {
    const username = document.getElementById('admin-baru-user').value.trim();
    const password = document.getElementById('admin-baru-pass').value.trim();
    const kelas = document.getElementById('admin-baru-kelas').value;
    if (!username || !password || !kelas) return PremiumAlert.finish('warning', 'Gagal', 'Pastikan semua kolom terisi.');
    
    const adminSnap = await firebase.database().ref('admin/' + username).once('value');
    const adminKelasSnap = await firebase.database().ref('admin_perkelas/' + username).once('value');
    if (adminSnap.exists() || adminKelasSnap.exists()) return PremiumAlert.finish('error', 'Gagal', 'Username sudah terpakai.');
    
    await firebase.database().ref('admin_perkelas/' + username).set({ password, kelas });
    PremiumAlert.finish('success', 'Berhasil', `Admin untuk ${kelas} ditambahkan.`);
    document.getElementById('admin-baru-user').value = ''; document.getElementById('admin-baru-pass').value = ''; document.getElementById('admin-baru-kelas').value = '';
    renderDaftarAdminKelas();
}

async function hapusAdminKelas(username) {
    const isConfirmed = await PremiumAlert.confirm('Cabut Akses?', `Admin ${username} akan dihapus dari sistem.`, 'Ya, Cabut');
    if (isConfirmed) {
        PremiumAlert.showLoading('Menghapus...', 'Mencabut akses admin');
        await firebase.database().ref('admin_perkelas/' + username).remove();
        PremiumAlert.finish('success', 'Berhasil', `Akses admin ${username} telah dicabut.`);
        renderDaftarAdminKelas();
    }
}

// ==== ADMIN UTAMA: TABEL ====
function renderTabelAdmin() {
    const tbody = document.getElementById('tbody-rekap');
    tbody.innerHTML = "";
    if (dbAbsensi.length === 0) return tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">Belum ada data absensi.</td></tr>`;
    
    dbAbsensi.forEach(data => {
        let badgeHTML = getStatusBadge(data.status);
        let btnFoto = (data.status === 'Hadir' && data.foto) ? `<button class="btn-small btn-abu" onclick="lihatFotoPreview('${data.foto}')">Lihat</button>` : '-';
        let btnHapus = `<button class="btn-small btn-delete-small" onclick="hapusDataIndividu('${data.id}')">Hapus</button>`;
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${data.nama}</strong></td>
            <td>${data.kelas}</td>
            <td>${data.hari}</td>
            <td>${badgeHTML}</td>
            <td>${btnFoto}</td>
            <td><span style="font-size:12px; color:#64748b; font-weight:600;">${data.waktuStr}</span></td>
            <td style="text-align: right;">${btnHapus}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function hapusDataIndividu(id) {
    const snap = await firebase.database().ref('absensi/' + id).once('value');
    const data = snap.val();
    
    const isConfirmed = await PremiumAlert.confirm('Hapus Absensi?', "Data absensi ini akan dihapus secara permanen.", "Ya, Hapus");
    if (isConfirmed) {
        PremiumAlert.showLoading('Menghapus...', 'Menghapus data dari Absensi');
        if (data && data.status === 'Tidak Hadir') {
            const safeNama = sanitizeKey(data.nama); 
            let currentSiswa = dbRekapBulanan.siswa[data.kelas]?.[safeNama] || 0;
            let currentKelas = dbRekapBulanan.kelas[data.kelas] || 0;
            if(currentSiswa > 0) firebase.database().ref(`rekap_bulanan/siswa/${data.kelas}/${safeNama}`).set(currentSiswa - 1);
            if(currentKelas > 0) firebase.database().ref(`rekap_bulanan/kelas/${data.kelas}`).set(currentKelas - 1);
        }
        if (data && data.filePath) await hapusFileDariSupabase(data.filePath);
        await firebase.database().ref('absensi/' + id).remove();
        PremiumAlert.finish('success', 'Terhapus', 'Absen berhasil dihapus dari Absensi.');
    }
}

async function resetSemuaData() {
    const isConfirmed = await PremiumAlert.confirm('Reset Harian?', "Seluruh absen hari ini akan dihapus.", "Reset Harian");
    if (isConfirmed) {
        PremiumAlert.showLoading('Mereset Data...', 'Membersihkan data absensi hari ini');
        const snap = await firebase.database().ref('absensi').once('value');
        const allData = snap.val() || {};
        const filePaths = Object.values(allData).map(d => d.filePath).filter(Boolean);
        if (filePaths.length > 0) await supabaseClient.storage.from('foto-absensi').remove(filePaths);
        await firebase.database().ref('absensi').remove();
        PremiumAlert.finish('success', 'Direset', 'Seluruh data absensi telah dikosongkan.');
    }
}

async function resetRekapBulanan() {
    const isConfirmed = await PremiumAlert.confirm('Reset Bulanan?', "Peringkat Kelas dan Siswa Terteladan akan dikembalikan menjadi 0.", "Reset Bulanan", true);
    if (isConfirmed) {
        PremiumAlert.showLoading('Mereset Peringkat...', 'Menghapus rekam bulanan');
        await firebase.database().ref('rekap_bulanan').remove();
        PremiumAlert.finish('success', 'Direset', 'Peringkat bulanan berhasil dikosongkan.');
    }
}

function downloadExcel() {
    if (dbAbsensi.length === 0) return PremiumAlert.finish('warning', 'Kosong', 'Belum ada data untuk diunduh.');
    const dataToExport = dbAbsensi.map(item => ({ "Nama Siswa": item.nama, "Kelas": item.kelas, "Hari": item.hari, "Status": item.status, "Alasan": item.keterangan || "Bukti", "Tanggal & Jam": item.waktuStr }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Absen");
    XLSX.writeFile(workbook, "Rekap_Absensi_Semua.xlsx");
}

// ==== LOGIKA TUTUP ABSENSI & AUTO ALPHA ====
async function toggleStatusAbsensi() {
    const ref = firebase.database().ref('settings/status_absen');
    const snapshot = await ref.once('value');
    const isClosed = snapshot.val() === 'ditutup';
    
    if (isClosed) {
        await ref.set('dibuka');
        PremiumAlert.showSnackbar('success', 'Akses Dibuka', 'Siswa dapat melakukan absen kembali.');
    } else {
        openModal('modal-tutup-absen-hari');
    }
    updateTeksTombolBukaTutup();
}

async function prosesTutupAbsensi(hariDitutup) {
    closeModal('modal-tutup-absen-hari');
    PremiumAlert.showLoading('Memproses Rekap...', 'Siswa yang belum absen akan dijadikan Tidak Hadir');
    
    try {
        let updates = {};
        const timeNow = new Date();
        const waktuStr = timeNow.toLocaleString('id-ID');
        
        let tempSiswa = JSON.parse(JSON.stringify(dbRekapBulanan.siswa || {}));
        let tempKelas = JSON.parse(JSON.stringify(dbRekapBulanan.kelas || {}));
        
        for (let kls in daftarNamaPerKelas) {
            if(!Array.isArray(daftarNamaPerKelas[kls])) continue;

            if (!tempSiswa[kls]) tempSiswa[kls] = {};
            if (!tempKelas[kls]) tempKelas[kls] = 0;

            daftarNamaPerKelas[kls].forEach(nama => {
                let hasAbsen = dbAbsensi.find(a => a.kelas === kls && a.nama === nama && a.hari === hariDitutup);
                if (!hasAbsen) {
                    const uniqueId = "ID_" + timeNow.getTime() + "_" + Math.random().toString(36).substr(2, 5);
                    updates['absensi/' + uniqueId] = {
                        kelas: kls, hari: hariDitutup, nama: nama, status: 'Tidak Hadir', keterangan: '-', foto: '', filePath: '', waktuStr: waktuStr, lockKey: `absen_${kls}_${nama}_${hariDitutup}`
                    };
                    const safeNama = sanitizeKey(nama); 
                    tempSiswa[kls][safeNama] = (tempSiswa[kls][safeNama] || 0) + 1;
                    tempKelas[kls]++;
                }
            });
        }
        
        updates['rekap_bulanan/siswa'] = tempSiswa;
        updates['rekap_bulanan/kelas'] = tempKelas;

        await firebase.database().ref().update(updates);
        await firebase.database().ref('settings/status_absen').set('ditutup');
        
        updateTeksTombolBukaTutup();
        PremiumAlert.finish('success', 'Sesi Ditutup', `Rekap hari ${hariDitutup} berhasil diproses.`);

    } catch (error) {
        console.error("Error Tutup Absen:", error);
        PremiumAlert.finish('error', 'Gagal', 'Terjadi kesalahan sistem.');
    }
}

async function updateTeksTombolBukaTutup() {
    const snapshot = await firebase.database().ref('settings/status_absen').once('value');
    const isClosed = snapshot.val() === 'ditutup';
    const btn = document.getElementById('btn-toggle-absen');
    if (isClosed) {
        btn.innerText = "Buka Absensi"; btn.className = "btn-cyan";
    } else {
        btn.innerText = "Tutup Absensi"; btn.className = "btn-oren";
    }
}

async function cekDanBukaAbsen() {
    const snapshot = await firebase.database().ref('settings/status_absen').once('value');
    const isClosed = snapshot.val() === 'ditutup';
    if (isClosed) PremiumAlert.finish('warning', 'Sesi Ditutup', 'Tidak bisa absen saat ini.');
    else switchPanel('panel-absen');
}

// ==== ADMIN KELAS: TABEL & AKSI ====
function renderTabelKelas() {
    const tbody = document.getElementById('tbody-rekap-kelas');
    const kelas = currentUser.kelas;
    const dataKelas = dbAbsensi.filter(item => item.kelas === kelas);
    if (dataKelas.length === 0) return tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#999;">Belum ada data untuk kelas ${kelas}.</td></tr>`;
    
    tbody.innerHTML = "";
    dataKelas.forEach(data => {
        let badgeHTML = getStatusBadge(data.status);
        let btnFoto = (data.status === 'Hadir' && data.foto) ? `<button class="btn-small btn-abu" onclick="lihatFotoPreview('${data.foto}')">Lihat</button>` : '-';
        let btnHapus = `<button class="btn-small btn-delete-small" onclick="hapusDataIndividu('${data.id}')">Hapus</button>`;
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${data.nama}</strong></td>
            <td>${data.hari}</td>
            <td>${badgeHTML}</td>
            <td>${btnFoto}</td>
            <td><span style="font-size:12px; color:#64748b; font-weight:600;">${data.waktuStr}</span></td>
            <td style="text-align: right;">${btnHapus}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function resetDataKelas() {
    const kelas = currentUser.kelas;
    const isConfirmed = await PremiumAlert.confirm('Reset Data Kelas?', `Yakin ingin mereset absensi kelas ${kelas}?`, "Ya, Reset");
    if (isConfirmed) {
        PremiumAlert.showLoading('Mereset Kelas...', `Menghapus data kelas ${kelas}`);
        const dataKelas = dbAbsensi.filter(item => item.kelas === kelas);
        const filePaths = dataKelas.map(d => d.filePath).filter(Boolean);
        if (filePaths.length > 0) await supabaseClient.storage.from('foto-absensi').remove(filePaths);
        for (const item of dataKelas) await firebase.database().ref('absensi/' + item.id).remove();
        PremiumAlert.finish('success', 'Berhasil', `Data kelas ${kelas} telah dibersihkan.`);
    }
}

function downloadExcelKelas() {
    const kelas = currentUser.kelas;
    const dataKelas = dbAbsensi.filter(item => item.kelas === kelas);
    if (dataKelas.length === 0) return PremiumAlert.finish('warning', 'Kosong', 'Tidak ada data di kelas ini.');
    const dataToExport = dataKelas.map(item => ({ "Nama Siswa": item.nama, "Hari": item.hari, "Status": item.status, "Alasan": item.keterangan || "Bukti", "Tanggal & Jam": item.waktuStr }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap " + kelas);
    XLSX.writeFile(workbook, `Rekap_Absensi_${kelas}.xlsx`);
}

// ==== MODAL KEHADIRAN ADMIN UTAMA ====
function bukaModalKehadiran() {
    openModal('modal-kehadiran');
    document.getElementById('filter-admin-kelas-val').value = ""; document.getElementById('teks-admin-kelas').innerText = "Pilih Kelas...";
    document.getElementById('filter-admin-hari-val').value = ""; document.getElementById('teks-admin-hari').innerText = "Pilih Hari...";
    document.getElementById('filter-admin-status-val').value = "Semua"; document.getElementById('teks-admin-status').innerText = "Semua";
    document.getElementById('tbody-filter-kehadiran').innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Silakan pilih Kelas dan Hari.</td></tr>';
    generateAdminKelasList();
}

function generateAdminKelasList() {
    const container = document.getElementById('list-admin-kelas-container');
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const kelas = "XIF" + i;
        container.innerHTML += `<div class="modal-item" onclick="pilihAdminKelas('${kelas}')">${kelas}</div>`;
    }
}

function pilihAdminKelas(kelas) { document.getElementById('filter-admin-kelas-val').value = kelas; document.getElementById('teks-admin-kelas').innerText = kelas; closeModal('modal-admin-kelas'); renderTabelKehadiran(); }
function pilihAdminHari(hari) { document.getElementById('filter-admin-hari-val').value = hari; document.getElementById('teks-admin-hari').innerText = hari; closeModal('modal-admin-hari'); renderTabelKehadiran(); }
function pilihAdminStatus(status) { document.getElementById('filter-admin-status-val').value = status; document.getElementById('teks-admin-status').innerText = status; closeModal('modal-admin-status'); renderTabelKehadiran(); }

function renderTabelKehadiran() {
    const adminFilterKelas = document.getElementById('filter-admin-kelas-val').value;
    const adminFilterHari = document.getElementById('filter-admin-hari-val').value;
    const adminFilterStatus = document.getElementById('filter-admin-status-val').value;
    const tbody = document.getElementById('tbody-filter-kehadiran');

    if (!adminFilterKelas || !adminFilterHari) return tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Silakan pilih Kelas dan Hari.</td></tr>';

    const dbFiltered = dbAbsensi.filter(item => item.kelas === adminFilterKelas && item.hari === adminFilterHari);
    const daftarNama = daftarNamaPerKelas[adminFilterKelas] || [];
    let hasilAkhir = [];
    daftarNama.forEach(nama => {
        let record = dbFiltered.find(item => item.nama === nama);
        if (record) hasilAkhir.push({ nama, status: record.status, keterangan: record.keterangan, foto: record.foto });
        else html = hasilAkhir.push({ nama, status: 'Belum Absen', keterangan: '-', foto: null });
    });
    if (adminFilterStatus !== 'Semua') hasilAkhir = hasilAkhir.filter(item => item.status === adminFilterStatus);
    
    tbody.innerHTML = "";
    if (hasilAkhir.length === 0) return tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">Tidak ada data.</td></tr>`;
    
    hasilAkhir.forEach(item => {
        let badgeHTML = getStatusBadge(item.status);
        let kontenBukti = '-';
        
        if (item.status === 'Hadir') {
            let btnFoto = item.foto ? `<button class="btn-small btn-abu" onclick="lihatFotoPreview('${item.foto}')">Lihat</button>` : '';
            let infoKet = item.keterangan !== "-" ? `<div style="font-size:12px; color:#64748b; margin-top:4px;">${item.keterangan}</div>` : '';
            kontenBukti = (btnFoto + ' ' + infoKet).trim();
            if(kontenBukti === '') kontenBukti = '-';
        }
        
        tbody.innerHTML += `<tr><td><strong>${item.nama}</strong></td><td>${badgeHTML}</td><td>${kontenBukti}</td></tr>`;
    });
}

// ==== MODAL KEHADIRAN ADMIN KELAS ====
function bukaModalKehadiranKelas() {
    openModal('modal-kehadiran-kelas');
    document.getElementById('filter-kelas-hari-val').value = ""; document.getElementById('teks-kelas-hari').innerText = "Pilih Hari...";
    document.getElementById('tbody-filter-kelas').innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Silakan pilih Hari.</td></tr>';
}

function pilihKelasHari(hari) { document.getElementById('filter-kelas-hari-val').value = hari; document.getElementById('teks-kelas-hari').innerText = hari; closeModal('modal-kelas-hari'); renderTabelKehadiranKelas(); }

function renderTabelKehadiranKelas() {
    const kelas = currentUser.kelas;
    const hari = document.getElementById('filter-kelas-hari-val').value;
    const tbody = document.getElementById('tbody-filter-kelas');
    if (!hari) return tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Silakan pilih Hari.</td></tr>';
    
    const dbFiltered = dbAbsensi.filter(item => item.kelas === kelas && item.hari === hari);
    const daftarNama = daftarNamaPerKelas[kelas] || [];
    let hasilAkhir = [];
    daftarNama.forEach(nama => {
        let record = dbFiltered.find(item => item.nama === nama);
        if (record) hasilAkhir.push({ nama, status: record.status, keterangan: record.keterangan, foto: record.foto });
        else hasilAkhir.push({ nama, status: 'Belum Absen', keterangan: '-', foto: null });
    });
    
    tbody.innerHTML = "";
    hasilAkhir.forEach(item => {
        let badgeHTML = getStatusBadge(item.status);
        let kontenBukti = '-';
        
        if (item.status === 'Hadir') {
            let btnFoto = item.foto ? `<button class="btn-small btn-abu" onclick="lihatFotoPreview('${item.foto}')">Lihat</button>` : '';
            let infoKet = item.keterangan !== "-" ? `<div style="font-size:12px; color:#64748b; margin-top:4px;">${item.keterangan}</div>` : '';
            kontenBukti = (btnFoto + ' ' + infoKet).trim();
            if(kontenBukti === '') kontenBukti = '-';
        }
        
        tbody.innerHTML += `<tr><td><strong>${item.nama}</strong></td><td>${badgeHTML}</td><td>${kontenBukti}</td></tr>`;
    });
}

// ==== FITUR PERINGKAT ====
function bukaModalPeringkatKelas() { openModal('modal-peringkat-kelas'); renderPeringkatKelas(); }

function renderPeringkatKelas() {
    let stats = [];
    for (let kls in daftarNamaPerKelas) {
        let totalAlpha = dbRekapBulanan.kelas[kls] || 0;
        stats.push({ kelas: kls, alpha: totalAlpha });
    }
    stats.sort((a, b) => a.alpha - b.alpha);
    
    const tbody = document.getElementById('tbody-peringkat-kelas');
    tbody.innerHTML = "";
    stats.forEach((item, index) => {
        let rankMedal = index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : (index + 1)));
        tbody.innerHTML += `<tr><td style="text-align:center; font-weight:bold; font-size:18px;">${rankMedal}</td><td><strong style="font-size:15px;">${item.kelas}</strong></td><td style="text-align:center;"><span class="badge-status badge-alpha">${iconCrossSVG} ${item.alpha}</span></td></tr>`;
    });
}

function bukaModalPeringkatSiswa() {
    openModal('modal-peringkat-siswa'); generateFilterKelasPeringkat();
    document.getElementById('filter-peringkat-kelas-val').value = "Semua"; document.getElementById('teks-peringkat-kelas').innerText = "Semua Kelas";
    renderPeringkatSiswa();
}

function generateFilterKelasPeringkat() {
    const container = document.getElementById('list-peringkat-kelas-container');
    container.innerHTML = `<div class="modal-item" onclick="pilihFilterPeringkatKelas('Semua')">Semua Kelas</div>`;
    for (let i = 1; i <= 10; i++) {
        const kelas = "XIF" + i;
        container.innerHTML += `<div class="modal-item" onclick="pilihFilterPeringkatKelas('${kelas}')">${kelas}</div>`;
    }
}

function pilihFilterPeringkatKelas(kelas) {
    document.getElementById('filter-peringkat-kelas-val').value = kelas; document.getElementById('teks-peringkat-kelas').innerText = kelas === 'Semua' ? 'Semua Kelas' : kelas;
    closeModal('modal-peringkat-kelas-pilih'); renderPeringkatSiswa();
}

function renderPeringkatSiswa() {
    const filterKelas = document.getElementById('filter-peringkat-kelas-val').value;
    let stats = [];
    
    for (let kls in daftarNamaPerKelas) {
        if (filterKelas !== 'Semua' && kls !== filterKelas) continue;
        daftarNamaPerKelas[kls].forEach(nama => {
            const safeNama = sanitizeKey(nama); 
            let totalAlpha = 0;
            if(dbRekapBulanan.siswa[kls] && dbRekapBulanan.siswa[kls][safeNama]) totalAlpha = dbRekapBulanan.siswa[kls][safeNama];
            stats.push({ nama: nama, kelas: kls, alpha: totalAlpha });
        });
    }
    
    stats.sort((a, b) => a.alpha - b.alpha); 
    
    const tbody = document.getElementById('tbody-peringkat-siswa');
    tbody.innerHTML = "";
    stats.forEach((item, index) => {
        let rankMedal = index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : (index + 1)));
        tbody.innerHTML += `<tr><td style="text-align:center; font-weight:bold; font-size:16px;">${rankMedal}</td><td><strong>${item.nama}</strong><br><small style="color:#64748b;">${item.kelas}</small></td><td style="text-align:center;"><span class="badge-status badge-alpha">${iconCrossSVG} ${item.alpha}</span></td></tr>`;
    });
}

function bukaModalPeringkatSiswaKelas() { openModal('modal-peringkat-siswa-kelas'); renderPeringkatSiswaKelas(); }

function renderPeringkatSiswaKelas() {
    const kls = currentUser.kelas;
    let stats = [];
    
    const daftarNama = daftarNamaPerKelas[kls] || [];
    daftarNama.forEach(nama => {
        const safeNama = sanitizeKey(nama); 
        let totalAlpha = 0;
        if(dbRekapBulanan.siswa[kls] && dbRekapBulanan.siswa[kls][safeNama]) totalAlpha = dbRekapBulanan.siswa[kls][safeNama];
        stats.push({ nama: nama, alpha: totalAlpha });
    });
    
    stats.sort((a, b) => a.alpha - b.alpha); 
    
    const tbody = document.getElementById('tbody-peringkat-siswa-kelas');
    tbody.innerHTML = "";
    stats.forEach((item, index) => {
        let rankMedal = index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : (index + 1)));
        tbody.innerHTML += `<tr><td style="text-align:center; font-weight:bold; font-size:16px;">${rankMedal}</td><td><strong>${item.nama}</strong></td><td style="text-align:center;"><span class="badge-status badge-alpha">${iconCrossSVG} ${item.alpha}</span></td></tr>`;
    });
}

function lihatFotoPreview(url) { document.getElementById('preview-image-src').src = url; openModal('modal-preview-foto'); }

// ==== PANEL ABSEN SISWA ====
function generateKelasList() {
    const container = document.getElementById('list-kelas-container');
    container.innerHTML = "";
    for (let i = 1; i <= 10; i++) {
        const kelas = "XIF" + i;
        container.innerHTML += `<div class="modal-item" onclick="pilihKelas('${kelas}')">${kelas}</div>`;
    }
}
generateKelasList();

function pilihKelas(kelas) {
    document.getElementById('kelas').value = kelas; document.getElementById('teks-kelas').innerText = kelas;
    document.getElementById('hari').value = ""; document.getElementById('teks-hari').innerText = "Pilih hari kehadiran...";
    document.getElementById('nama-terpilih').value = ""; document.getElementById('search-nama').value = "";
    closeModal('modal-kelas'); renderNama("");
}

function pilihHari(hari) {
    document.getElementById('hari').value = hari; document.getElementById('teks-hari').innerText = hari;
    document.getElementById('nama-terpilih').value = ""; document.getElementById('search-nama').value = "";
    closeModal('modal-hari'); renderNama("");
}

function renderNama(filterText = "") {
    const listContainer = document.getElementById('list-nama');
    const kelas = document.getElementById('kelas').value;
    const hari = document.getElementById('hari').value;
    listContainer.innerHTML = "";
    if (!kelas) return listContainer.innerHTML = `<div class="name-item disabled" style="text-align:center;">Pilih kelas terlebih dahulu.</div>`;
    
    const daftarNama = daftarNamaPerKelas[kelas] || [];
    const filtered = daftarNama.filter(nama => nama.toLowerCase().includes(filterText.toLowerCase()));
    if (filtered.length === 0) return listContainer.innerHTML = `<div class="name-item disabled" style="text-align:center;">Siswa tidak ditemukan.</div>`;
    
    let sudahAbsenMap = new Set();
    if (hari) dbAbsensi.forEach(record => { if (record.kelas === kelas && record.hari === hari) sudahAbsenMap.add(record.nama); });
    
    filtered.forEach(nama => {
        let div = document.createElement('div');
        div.className = 'name-item';
        const sudahAbsen = sudahAbsenMap.has(nama);
        if (sudahAbsen) {
            div.innerHTML = `${nama} <span style="display:flex; align-items:center; color:#16a34a; font-weight:700;">${iconCheckSVG} <span style="margin-left:4px;">Tercatat</span></span>`;
            div.classList.add('disabled');
        } else {
            div.innerText = nama;
            if (nama === document.getElementById('nama-terpilih').value) div.classList.add('terpilih');
            div.onclick = () => { document.getElementById('nama-terpilih').value = nama; document.getElementById('search-nama').value = nama; renderNama(nama); };
        }
        listContainer.appendChild(div);
    });
}
function filterNama() { renderNama(document.getElementById('search-nama').value); }

// ==== KAMERA ====
async function mulaiKamera() {
    try {
        streamKamera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        document.getElementById('video-kamera').srcObject = streamKamera; document.getElementById('video-kamera').classList.remove('hidden');
        document.getElementById('canvas-kamera').classList.add('hidden'); document.getElementById('btn-capture').classList.remove('hidden'); document.getElementById('btn-retake').classList.add('hidden');
    } catch (err) {
        PremiumAlert.finish('error', 'Akses Kamera Ditolak', 'Harap izinkan browser menggunakan kamera.');
    }
}
function matikanKamera() { if (streamKamera) streamKamera.getTracks().forEach(track => track.stop()); }

function takeSnapshot() {
    const video = document.getElementById('video-kamera'); const canvas = document.getElementById('canvas-kamera'); const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    document.getElementById('foto-data').value = canvas.toDataURL('image/jpeg', 0.8);
    video.classList.add('hidden'); canvas.classList.remove('hidden'); document.getElementById('btn-capture').classList.add('hidden'); document.getElementById('btn-retake').classList.remove('hidden');
}

function retakePhoto() {
    document.getElementById('foto-data').value = ""; document.getElementById('video-kamera').classList.remove('hidden');
    document.getElementById('canvas-kamera').classList.add('hidden'); document.getElementById('btn-capture').classList.remove('hidden'); document.getElementById('btn-retake').classList.add('hidden');
}

function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
}

// ==== KIRIM ABSEN ====
async function kirimAbsen() {
    const kelas = document.getElementById('kelas').value; const hari = document.getElementById('hari').value; const nama = document.getElementById('nama-terpilih').value;
    const status = 'Hadir'; const keterangan = "-";

    if (!kelas || !hari || !nama) return PremiumAlert.finish('warning', 'Gagal Mengirim', 'Pastikan Kelas, Hari, dan Nama sudah dipilih.');

    PremiumAlert.showLoading('Verifikasi GPS...', 'Memastikan Anda berada di area SMANSALA');
    try { 
        const jarak = await verifikasiLokasi(); 
    } catch (pesanError) { 
        return PremiumAlert.finish('error', 'Gagal Lokasi', pesanError); 
    }

    let fotoSimpan = document.getElementById('foto-data').value;
    if (!fotoSimpan) return PremiumAlert.finish('warning', 'Bukti Diperlukan', 'Ambil foto *selfie* terlebih dahulu.');

    PremiumAlert.showLoading('Mengirim Data...', 'Mohon tunggu beberapa detik');

    const timeNow = new Date(); const uniqueId = "ID_" + timeNow.getTime() + "_" + Math.random().toString(36).substr(2, 5); const waktuStr = timeNow.toLocaleString('id-ID');
    let publicUrl = ''; let fileName = '';
    
    if (fotoSimpan) {
        const blob = dataURLtoBlob(fotoSimpan); const fileExt = 'jpg'; fileName = `absensi_${uniqueId}.${fileExt}`;
        const { error: uploadError } = await supabaseClient.storage.from('foto-absensi').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) return PremiumAlert.finish('error', 'Koneksi Lemah', 'Gagal mengunggah foto bukti ke server.');
        const { data: publicUrlData } = supabaseClient.storage.from('foto-absensi').getPublicUrl(fileName); publicUrl = publicUrlData.publicUrl;
    }

    const payload = { kelas: kelas, hari: hari, nama: nama, status: status, keterangan: keterangan, foto: publicUrl, filePath: fileName, waktuStr: waktuStr, lockKey: `absen_${kelas}_${nama}_${hari}` };
    await firebase.database().ref('absensi/' + uniqueId).set(payload);

    PremiumAlert.finish('success', 'Absen Berhasil', `${nama} telah tercatat hadir.`, () => {
        document.getElementById('nama-terpilih').value = ""; document.getElementById('search-nama').value = ""; document.getElementById('foto-data').value = "";
        retakePhoto(); matikanKamera(); switchPanel('panel-awal');
    });
}

async function hapusFileDariSupabase(filePath) {
    if (!filePath) return;
    try { const { error } = await supabaseClient.storage.from('foto-absensi').remove([filePath]); if (error) console.warn('Gagal hapus file:', error); } catch (err) { console.warn('Error hapus file:', err); }
}

// ==== NAVIGASI PANEL ====
function switchPanel(panelId, isAdminPanel = false) {
    const currentActive = document.querySelector('.panel.active'); const mainContainer = document.getElementById('main-container');
    if (isAdminPanel) mainContainer.classList.add('admin-mode'); else mainContainer.classList.remove('admin-mode');

    if (currentActive) {
        currentActive.style.opacity = 0; currentActive.style.transform = 'scale(0.97) translateY(15px)';
        setTimeout(() => {
            currentActive.classList.remove('active'); const newPanel = document.getElementById(panelId);
            newPanel.classList.add('active'); void newPanel.offsetWidth;
            newPanel.style.opacity = 1; newPanel.style.transform = 'scale(1) translateY(0)';
        }, 400);
    } else {
        const newPanel = document.getElementById(panelId); newPanel.classList.add('active'); newPanel.style.opacity = 1; newPanel.style.transform = 'scale(1) translateY(0)';
    }

    if (panelId === 'panel-awal') matikanKamera();
    if (panelId === 'panel-absen') mulaiKamera();
}

function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
renderNama();

// ==========================================
// ==== FITUR LOGIN SIDIK JARI (WEBAUTHN) ====
// ==========================================

async function daftarkanSidikJari() {
    if (!window.PublicKeyCredential) {
        return PremiumAlert.finish('error', 'Tidak Didukung', 'Browser atau HP Anda tidak mendukung sidik jari.');
    }

    let username = "";
    if (currentUser && currentUser.username) {
        username = currentUser.username;
    } else {
        return PremiumAlert.finish('warning', 'Sesi Berakhir', 'Silakan Login manual dengan password terlebih dahulu.');
    }

    const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
    const userId = new Uint8Array(16); window.crypto.getRandomValues(userId);

    const publicKey = {
        challenge: challenge,
        rp: { name: "Absensi SMANSALA", id: window.location.hostname },
        user: { id: userId, name: username, displayName: "Pengelola " + username },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: "platform" },
        timeout: 60000
    };

    try {
        const credential = await navigator.credentials.create({ publicKey });
        
        localStorage.setItem('biometric_username', username);
        localStorage.setItem('biometric_credential_id', btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
        
        PremiumAlert.finish('success', 'Berhasil Didaftarkan', `Sidik jari untuk akun ${username} berhasil diamankan.`);
    } catch (err) {
        PremiumAlert.finish('error', 'Dibatalkan', 'Pendaftaran biometrik gagal atau dibatalkan.');
    }
}

async function loginDenganSidikJari() {
    if (!window.PublicKeyCredential) {
        return PremiumAlert.finish('error', 'Tidak Didukung', 'HP ini tidak mendukung login biometrik.');
    }

    const savedUser = localStorage.getItem('biometric_username');
    const savedCredIdStr = localStorage.getItem('biometric_credential_id');

    if (!savedUser || !savedCredIdStr) {
        return PremiumAlert.finish('warning', 'Belum Terdaftar', 'Anda belum mengatur sidik jari di perangkat ini.');
    }

    const challenge = new Uint8Array(32); window.crypto.getRandomValues(challenge);
    const credId = Uint8Array.from(atob(savedCredIdStr), c => c.charCodeAt(0));

    const publicKey = {
        challenge: challenge,
        rpId: window.location.hostname,
        allowCredentials: [{ type: "public-key", id: credId }],
        userVerification: "required",
        timeout: 60000
    };

    try {
        await navigator.credentials.get({ publicKey });
        
        PremiumAlert.showLoading('Memverifikasi...', 'Mencocokkan sidik jari dengan sistem');

        const adminSnap = await firebase.database().ref('admin/' + savedUser).once('value');
        if (adminSnap.exists()) {
            currentUser = { role: 'admin', username: savedUser };
            PremiumAlert.close();
            PremiumAlert.showSnackbar('success', 'Akses Diterima', `Selamat datang kembali, ${savedUser}.`);
            switchPanel('panel-dashboard-admin', true);
            renderTabelAdmin(); updateTeksTombolBukaTutup();
            return;
        }

        const adminKelasSnap = await firebase.database().ref('admin_perkelas/' + savedUser).once('value');
        if (adminKelasSnap.exists()) {
            const data = adminKelasSnap.val();
            currentUser = { role: 'admin_kelas', username: savedUser, kelas: data.kelas };
            PremiumAlert.close();
            PremiumAlert.showSnackbar('success', 'Akses Diterima', `Selamat datang Admin Kelas ${data.kelas}.`);
            switchPanel('panel-dashboard-kelas', true);
            document.getElementById('admin-kelas-display').innerText = `Admin Kelas ${data.kelas}`;
            renderTabelKelas();
            return;
        }

        PremiumAlert.finish('error', 'Gagal', 'Akun pengelola tidak ditemukan di database.');

    } catch (err) {
        PremiumAlert.finish('error', 'Batal', 'Verifikasi sidik jari dibatalkan.');
    }
}
