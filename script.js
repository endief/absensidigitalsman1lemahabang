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
// Firebase akan menolak struktur data jika ada tanda titik (.), (#), dll. (Misal: "M. Nabil")
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
            Swal.fire({
                title: 'Absensi Ditutup',
                text: 'Siswa tidak bisa absen.',
                icon: 'warning',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });
        }
    });
}
initFirebaseListeners();

// ==== KONFIGURASI GEOFENCING ====
const KANTOR_LAT = -6.818837;
const KANTOR_LON = 108.629478;
const BATAS_JARAK_METER = 200;

function hitungJarak(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function verifikasiLokasi() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) reject("Browser HP Anda tidak mendukung fitur lokasi.");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const jarak = hitungJarak(position.coords.latitude, position.coords.longitude, KANTOR_LAT, KANTOR_LON);
                if (jarak <= BATAS_JARAK_METER) resolve(jarak);
                else reject(`Anda berada di luar area absen! Jarak Anda ${Math.round(jarak)} meter dari sekolah.`);
            },
            (error) => reject("Gagal mendapatkan lokasi. Pastikan GPS menyala."),
            { enableHighAccuracy: true, timeout: 10000 } 
        );
    });
}

function refreshActiveUI() {
    const dashboardAdmin = document.getElementById('panel-dashboard-admin');
    const dashboardKelas = document.getElementById('panel-dashboard-kelas');
    const absenPanel = document.getElementById('panel-absen');
    const modalKehadiran = document.getElementById('modal-kehadiran');
    const modalKehadiranKelas = document.getElementById('modal-kehadiran-kelas');
    const modalRankKelas = document.getElementById('modal-peringkat-kelas');
    const modalRankSiswa = document.getElementById('modal-peringkat-siswa');
    const modalRankSiswaKls = document.getElementById('modal-peringkat-siswa-kelas');

    if (dashboardAdmin.classList.contains('active')) renderTabelAdmin();
    if (dashboardKelas.classList.contains('active')) renderTabelKelas();
    if (absenPanel.classList.contains('active')) {
        const kelas = document.getElementById('kelas').value;
        if (kelas) renderNama(document.getElementById('search-nama').value);
    }
    if (modalKehadiran.classList.contains('show')) renderTabelKehadiran();
    if (modalKehadiranKelas.classList.contains('show')) renderTabelKehadiranKelas();
    
    if (modalRankKelas.classList.contains('show')) renderPeringkatKelas();
    if (modalRankSiswa.classList.contains('show')) renderPeringkatSiswa();
    if (modalRankSiswaKls.classList.contains('show')) renderPeringkatSiswaKelas();
}

// ==== FUNGSI LOGIN UMUM ====
async function loginUmum() {
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    if (!user || !pass) return Swal.fire({ title: 'Gagal', text: 'Isi username dan password.', icon: 'warning', timer: 2000, timerProgressBar: true, showConfirmButton: false });

    const adminSnap = await firebase.database().ref('admin/' + user).once('value');
    if (adminSnap.exists() && adminSnap.val().password === pass) {
        currentUser = { role: 'admin' };
        document.getElementById('admin-user').value = '';
        document.getElementById('admin-pass').value = '';
        switchPanel('panel-dashboard-admin', true);
        renderTabelAdmin();
        updateTeksTombolBukaTutup();
        return;
    }

    const adminKelasSnap = await firebase.database().ref('admin_perkelas/' + user).once('value');
    if (adminKelasSnap.exists() && adminKelasSnap.val().password === pass) {
        const data = adminKelasSnap.val();
        currentUser = { role: 'admin_kelas', username: user, kelas: data.kelas };
        document.getElementById('admin-user').value = '';
        document.getElementById('admin-pass').value = '';
        switchPanel('panel-dashboard-kelas', true);
        document.getElementById('admin-kelas-display').innerText = `Admin Kelas ${data.kelas}`;
        renderTabelKelas();
        return;
    }

    Swal.fire({ title: 'Login Gagal', text: 'Username atau password salah.', icon: 'error', timer: 2000, timerProgressBar: true, showConfirmButton: false });
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
    document.getElementById('btn-admin-baru-kelas').classList.remove('selected');
}

async function renderDaftarAdminKelas() {
    const container = document.getElementById('daftar-admin-kelas');
    const snap = await firebase.database().ref('admin_perkelas').once('value');
    const data = snap.val() || {};
    const adminArray = Object.keys(data).map(username => ({ username, ...data[username] }));
    if (adminArray.length === 0) return container.innerHTML = '<p style="color:#888; text-align:center;">Belum ada admin perkelas.</p>';
    
    container.innerHTML = adminArray.map(a => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid var(--border-light); border-radius:12px; margin-bottom:8px;">
            <div><strong>${a.username}</strong><br><small style="color:#64748b;">Kelas: ${a.kelas}</small></div>
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
    document.getElementById('btn-admin-baru-kelas').classList.add('selected');
    closeModal('modal-admin-kelas-pilih');
}

async function tambahAdminKelas() {
    const username = document.getElementById('admin-baru-user').value.trim();
    const password = document.getElementById('admin-baru-pass').value.trim();
    const kelas = document.getElementById('admin-baru-kelas').value;
    if (!username || !password || !kelas) return Swal.fire({ title: 'Gagal', text: 'Isi semua data.', icon: 'warning', timer: 2000, timerProgressBar: true, showConfirmButton: false });
    
    const adminSnap = await firebase.database().ref('admin/' + username).once('value');
    const adminKelasSnap = await firebase.database().ref('admin_perkelas/' + username).once('value');
    if (adminSnap.exists() || adminKelasSnap.exists()) return Swal.fire({ title: 'Gagal', text: 'Username sudah digunakan.', icon: 'error', timer: 2000, timerProgressBar: true, showConfirmButton: false });
    
    await firebase.database().ref('admin_perkelas/' + username).set({ password, kelas });
    Swal.fire({ title: 'Sukses', text: 'Admin kelas berhasil ditambahkan.', icon: 'success', timer: 2000, timerProgressBar: true, showConfirmButton: false });
    document.getElementById('admin-baru-user').value = '';
    document.getElementById('admin-baru-pass').value = '';
    document.getElementById('admin-baru-kelas').value = '';
    renderDaftarAdminKelas();
}

async function hapusAdminKelas(username) {
    Swal.fire({ title: 'Hapus Admin?', text: `Admin ${username} akan dihapus.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya' }).then(async (result) => {
        if (result.isConfirmed) {
            await firebase.database().ref('admin_perkelas/' + username).remove();
            Swal.fire({ title: 'Terhapus', text: 'Admin kelas berhasil dihapus.', icon: 'success', timer: 2000, timerProgressBar: true, showConfirmButton: false });
            renderDaftarAdminKelas();
        }
    });
}

// ==== ADMIN UTAMA: TABEL & AKSI ====
function renderTabelAdmin() {
    const tbody = document.getElementById('tbody-rekap');
    tbody.innerHTML = "";
    if (dbAbsensi.length === 0) return tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">Belum ada data absensi yang masuk.</td></tr>`;
    
    dbAbsensi.forEach(data => {
        let badgeStyle = data.status === 'Hadir' ? 'background-color: #10b981; color: white;' : (data.status === 'Tidak Hadir' ? 'background-color: #ef4444; color: white;' : 'background-color: #64748b; color: white;');
        let btnFoto = data.foto ? `<button class="btn-small btn-foto-small" onclick="lihatFotoPreview('${data.foto}')">Lihat</button>` : '-';
        let btnHapus = `<button class="btn-small btn-delete-small" onclick="hapusDataIndividu('${data.id}')">Hapus</button>`;
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${data.nama}</strong></td>
            <td>${data.kelas}</td>
            <td>${data.hari}</td>
            <td><span class="status-badge" style="${badgeStyle}">${data.status}</span></td>
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
    Swal.fire({ title: 'Hapus?', text: "Data absensi ini akan dihapus.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya' }).then(async (result) => {
        if (result.isConfirmed) {
            // Perbaikan: gunakan sanitizeKey agar saat menghapus Alpha, Rekap Bulanan ikut terpotong dengan benar
            if (data && data.status === 'Tidak Hadir') {
                const safeNama = sanitizeKey(data.nama); 
                let currentSiswa = dbRekapBulanan.siswa[data.kelas]?.[safeNama] || 0;
                let currentKelas = dbRekapBulanan.kelas[data.kelas] || 0;
                if(currentSiswa > 0) firebase.database().ref(`rekap_bulanan/siswa/${data.kelas}/${safeNama}`).set(currentSiswa - 1);
                if(currentKelas > 0) firebase.database().ref(`rekap_bulanan/kelas/${data.kelas}`).set(currentKelas - 1);
            }

            if (data && data.filePath) await hapusFileDariSupabase(data.filePath);
            await firebase.database().ref('absensi/' + id).remove();
            Swal.fire({ title: 'Terhapus!', text: 'Data berhasil dihapus.', icon: 'success' });
        }
    });
}

async function resetSemuaData() {
    Swal.fire({
        title: 'Reset Absensi Harian?',
        text: "Ini akan menghapus seluruh data absensi (Hadir/Tidak Hadir). Tenang saja, Data Rekap Bulanan/Peringkat TIDAK akan terhapus.",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Reset Harian!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const snap = await firebase.database().ref('absensi').once('value');
            const allData = snap.val() || {};
            const filePaths = Object.values(allData).map(d => d.filePath).filter(Boolean);
            if (filePaths.length > 0) await supabaseClient.storage.from('foto-absensi').remove(filePaths);
            await firebase.database().ref('absensi').remove();
            Swal.fire({ title: 'Direset!', text: 'Data harian dihapus. Rekap bulanan tetap aman.', icon: 'success' });
        }
    });
}

// RESET REKAP BULANAN
async function resetRekapBulanan() {
    Swal.fire({
        title: 'Reset Rekap Bulanan?',
        text: "Ini akan MENGOSONGKAN peringkat seluruh kelas dan siswa menjadi 0 kembali! Lakukan hanya saat pergantian bulan baru.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        confirmButtonText: 'Ya, Reset Bulan Ini!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await firebase.database().ref('rekap_bulanan').remove();
            Swal.fire({ title: 'Direset!', text: 'Peringkat bulanan berhasil dikosongkan.', icon: 'success' });
        }
    });
}

function downloadExcel() {
    if (dbAbsensi.length === 0) return Swal.fire({ title: 'Kosong', text: 'Belum ada data.', icon: 'info', timer: 2500, timerProgressBar: true, showConfirmButton: false });
    const dataToExport = dbAbsensi.map(item => ({
        "Nama Siswa": item.nama, "Kelas": item.kelas, "Hari": item.hari, "Status": item.status, "Alasan": item.keterangan || "Bukti", "Tanggal & Jam": item.waktuStr
    }));
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
        Swal.fire({ title: 'Absensi Dibuka', text: 'Siswa dapat melakukan absen kembali.', icon: 'success', timer: 3000, timerProgressBar: true, showConfirmButton: false });
    } else {
        openModal('modal-tutup-absen-hari');
    }
    updateTeksTombolBukaTutup();
}

async function prosesTutupAbsensi(hariDitutup) {
    closeModal('modal-tutup-absen-hari');
    Swal.fire({ title: 'Memproses...', text: 'Merekap siswa yang tidak hadir ke Data Bulanan...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    
    try {
        let updates = {};
        const timeNow = new Date();
        const waktuStr = timeNow.toLocaleString('id-ID');
        
        let tempSiswa = JSON.parse(JSON.stringify(dbRekapBulanan.siswa || {}));
        let tempKelas = JSON.parse(JSON.stringify(dbRekapBulanan.kelas || {}));
        
        for (let kls in daftarNamaPerKelas) {
            // Pengaman memastikan datanya bentuk Array (nama-nama siswa)
            if(!Array.isArray(daftarNamaPerKelas[kls])) continue;

            if (!tempSiswa[kls]) tempSiswa[kls] = {};
            if (!tempKelas[kls]) tempKelas[kls] = 0;

            daftarNamaPerKelas[kls].forEach(nama => {
                let hasAbsen = dbAbsensi.find(a => a.kelas === kls && a.nama === nama && a.hari === hariDitutup);
                if (!hasAbsen) {
                    const uniqueId = "ID_" + timeNow.getTime() + "_" + Math.random().toString(36).substr(2, 5);
                    updates['absensi/' + uniqueId] = {
                        kelas: kls, hari: hariDitutup, nama: nama, status: 'Tidak Hadir', keterangan: 'Ditutup Sistem (Alpha)', foto: '', filePath: '', waktuStr: waktuStr, lockKey: `absen_${kls}_${nama}_${hariDitutup}`
                    };

                    const safeNama = sanitizeKey(nama); // Mengubah tanda . atau # di nama menjadi _
                    tempSiswa[kls][safeNama] = (tempSiswa[kls][safeNama] || 0) + 1;
                    tempKelas[kls]++;
                }
            });
        }
        
        updates['rekap_bulanan/siswa'] = tempSiswa;
        updates['rekap_bulanan/kelas'] = tempKelas;

        // PUSH data ke Firebase
        await firebase.database().ref().update(updates);
        await firebase.database().ref('settings/status_absen').set('ditutup');
        
        updateTeksTombolBukaTutup();
        Swal.fire({ title: 'Absensi Ditutup', text: `Siswa yang belum absen hari ${hariDitutup} otomatis Alpha. Data Rekap Bulanan telah terupdate.`, icon: 'success', timer: 4500, timerProgressBar: true, showConfirmButton: false });

    } catch (error) {
        console.error("Error Tutup Absen:", error);
        Swal.fire({ title: 'Terjadi Kesalahan', text: 'Gagal merekap data absensi. Error di jaringan atau Database.', icon: 'error' });
    }
}

async function updateTeksTombolBukaTutup() {
    const snapshot = await firebase.database().ref('settings/status_absen').once('value');
    const isClosed = snapshot.val() === 'ditutup';
    const btn = document.getElementById('btn-toggle-absen');
    if (isClosed) {
        btn.innerText = "Buka Absensi"; btn.style.background = "#10b981"; btn.style.color = "#fff";
    } else {
        btn.innerText = "Tutup Absensi"; btn.style.background = "#f59e0b"; btn.style.color = "#fff";
    }
}

async function cekDanBukaAbsen() {
    const snapshot = await firebase.database().ref('settings/status_absen').once('value');
    const isClosed = snapshot.val() === 'ditutup';
    if (isClosed) Swal.fire({ title: 'Tidak bisa absen', text: 'Absensi telah ditutup.', icon: 'error', timer: 3000, timerProgressBar: true, showConfirmButton: false });
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
        let badgeStyle = data.status === 'Hadir' ? 'background-color: #10b981; color: white;' : (data.status === 'Tidak Hadir' ? 'background-color: #ef4444; color: white;' : 'background-color: #64748b; color: white;');
        let btnFoto = data.foto ? `<button class="btn-small btn-foto-small" onclick="lihatFotoPreview('${data.foto}')">Lihat</button>` : '-';
        let btnHapus = `<button class="btn-small btn-delete-small" onclick="hapusDataIndividu('${data.id}')">Hapus</button>`;
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${data.nama}</strong></td>
            <td>${data.hari}</td>
            <td><span class="status-badge" style="${badgeStyle}">${data.status}</span></td>
            <td>${btnFoto}</td>
            <td><span style="font-size:12px; color:#64748b; font-weight:600;">${data.waktuStr}</span></td>
            <td style="text-align: right;">${btnHapus}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function resetDataKelas() {
    const kelas = currentUser.kelas;
    Swal.fire({ title: 'Yakin?', text: `Reset absensi harian kelas ${kelas}? Data Rekap Bulanan tetap aman.`, icon: 'error', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya!' }).then(async (result) => {
        if (result.isConfirmed) {
            const dataKelas = dbAbsensi.filter(item => item.kelas === kelas);
            const filePaths = dataKelas.map(d => d.filePath).filter(Boolean);
            if (filePaths.length > 0) await supabaseClient.storage.from('foto-absensi').remove(filePaths);
            for (const item of dataKelas) await firebase.database().ref('absensi/' + item.id).remove();
            Swal.fire({ title: 'Direset!', text: `Data harian kelas ${kelas} dihapus.`, icon: 'success' });
        }
    });
}

function downloadExcelKelas() {
    const kelas = currentUser.kelas;
    const dataKelas = dbAbsensi.filter(item => item.kelas === kelas);
    if (dataKelas.length === 0) return Swal.fire({ title: 'Kosong', text: 'Tidak ada data.', icon: 'info', timer: 2500, timerProgressBar: true, showConfirmButton: false });
    const dataToExport = dataKelas.map(item => ({
        "Nama Siswa": item.nama, "Hari": item.hari, "Status": item.status, "Alasan": item.keterangan || "Bukti", "Tanggal & Jam": item.waktuStr
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap " + kelas);
    XLSX.writeFile(workbook, `Rekap_Absensi_${kelas}.xlsx`);
}

// ==== MODAL KEHADIRAN ADMIN UTAMA ====
function bukaModalKehadiran() {
    openModal('modal-kehadiran');
    document.getElementById('filter-admin-kelas-val').value = ""; document.getElementById('teks-admin-kelas').innerText = "Pilih Kelas..."; document.getElementById('btn-admin-kelas').classList.remove('selected');
    document.getElementById('filter-admin-hari-val').value = ""; document.getElementById('teks-admin-hari').innerText = "Pilih Hari..."; document.getElementById('btn-admin-hari').classList.remove('selected');
    document.getElementById('filter-admin-status-val').value = "Semua"; document.getElementById('teks-admin-status').innerText = "Semua"; document.getElementById('btn-admin-status').classList.remove('selected');
    document.getElementById('tbody-filter-kehadiran').innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Silakan pilih Kelas dan Hari di atas.</td></tr>';
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

function pilihAdminKelas(kelas) {
    document.getElementById('filter-admin-kelas-val').value = kelas; document.getElementById('teks-admin-kelas').innerText = kelas; document.getElementById('btn-admin-kelas').classList.add('selected');
    closeModal('modal-admin-kelas'); renderTabelKehadiran();
}
function pilihAdminHari(hari) {
    document.getElementById('filter-admin-hari-val').value = hari; document.getElementById('teks-admin-hari').innerText = hari; document.getElementById('btn-admin-hari').classList.add('selected');
    closeModal('modal-admin-hari'); renderTabelKehadiran();
}
function pilihAdminStatus(status) {
    document.getElementById('filter-admin-status-val').value = status; document.getElementById('teks-admin-status').innerText = status; document.getElementById('btn-admin-status').classList.add('selected');
    closeModal('modal-admin-status'); renderTabelKehadiran();
}

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
        else hasilAkhir.push({ nama, status: 'Belum Absen', keterangan: '-', foto: null });
    });
    if (adminFilterStatus !== 'Semua') hasilAkhir = hasilAkhir.filter(item => item.status === adminFilterStatus);
    
    tbody.innerHTML = "";
    if (hasilAkhir.length === 0) return tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:#888;">Tidak ada data pada kategori ini.</td></tr>`;
    
    hasilAkhir.forEach(item => {
        let badgeStyle = item.status === 'Hadir' ? 'background-color: #10b981; color: white;' : (item.status === 'Tidak Hadir' ? 'background-color: #ef4444; color: white;' : 'background-color: #64748b; color: white;');
        let btnFoto = item.foto ? `<button class="btn-small btn-foto-small" onclick="lihatFotoPreview('${item.foto}')">Lihat</button>` : '-';
        let infoKet = item.keterangan !== "-" ? `<div style="font-size:12px; color:#666; margin-top:5px; font-weight:500;">${item.keterangan}</div>` : '';
        tbody.innerHTML += `<tr><td><strong>${item.nama}</strong></td><td><span class="status-badge" style="${badgeStyle}">${item.status}</span></td><td>${btnFoto} ${infoKet}</td></tr>`;
    });
}

// ==== MODAL KEHADIRAN ADMIN KELAS ====
function bukaModalKehadiranKelas() {
    openModal('modal-kehadiran-kelas');
    document.getElementById('filter-kelas-hari-val').value = ""; document.getElementById('teks-kelas-hari').innerText = "Pilih Hari..."; document.getElementById('btn-kelas-hari').classList.remove('selected');
    document.getElementById('tbody-filter-kelas').innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">Silakan pilih Hari.</td></tr>';
}

function pilihKelasHari(hari) {
    document.getElementById('filter-kelas-hari-val').value = hari; document.getElementById('teks-kelas-hari').innerText = hari; document.getElementById('btn-kelas-hari').classList.add('selected');
    closeModal('modal-kelas-hari'); renderTabelKehadiranKelas();
}

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
        let badgeStyle = item.status === 'Hadir' ? 'background-color: #10b981; color: white;' : (item.status === 'Tidak Hadir' ? 'background-color: #ef4444; color: white;' : 'background-color: #64748b; color: white;');
        let btnFoto = item.foto ? `<button class="btn-small btn-foto-small" onclick="lihatFotoPreview('${item.foto}')">Lihat</button>` : '-';
        let infoKet = item.keterangan !== "-" ? `<div style="font-size:12px; color:#666; margin-top:5px; font-weight:500;">${item.keterangan}</div>` : '';
        tbody.innerHTML += `<tr><td><strong>${item.nama}</strong></td><td><span class="status-badge" style="${badgeStyle}">${item.status}</span></td><td>${btnFoto} ${infoKet}</td></tr>`;
    });
}

// ==== FITUR PERINGKAT/REKAP BULANAN ====
function bukaModalPeringkatKelas() {
    openModal('modal-peringkat-kelas'); renderPeringkatKelas();
}

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
        tbody.innerHTML += `<tr><td style="text-align:center; font-weight:bold; font-size:18px;">${rankMedal}</td><td><strong style="font-size:16px;">${item.kelas}</strong></td><td style="text-align:center;"><span style="color:#ef4444; font-weight:bold; font-size:16px;">${item.alpha}</span></td></tr>`;
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
            const safeNama = sanitizeKey(nama); // Gunakan nama yang sudah di-sanitize
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
        tbody.innerHTML += `<tr><td style="text-align:center; font-weight:bold; font-size:16px;">${rankMedal}</td><td><strong>${item.nama}</strong><br><small style="color:#64748b;">${item.kelas}</small></td><td style="text-align:center;"><span style="color:#ef4444; font-weight:bold;">${item.alpha}</span></td></tr>`;
    });
}

// ==== FITUR SISWA TERTELADAN (ADMIN PERKELAS) ====
function bukaModalPeringkatSiswaKelas() {
    openModal('modal-peringkat-siswa-kelas'); renderPeringkatSiswaKelas();
}

function renderPeringkatSiswaKelas() {
    const kls = currentUser.kelas;
    let stats = [];
    
    const daftarNama = daftarNamaPerKelas[kls] || [];
    daftarNama.forEach(nama => {
        const safeNama = sanitizeKey(nama); // Gunakan nama yang sudah di-sanitize
        let totalAlpha = 0;
        if(dbRekapBulanan.siswa[kls] && dbRekapBulanan.siswa[kls][safeNama]) totalAlpha = dbRekapBulanan.siswa[kls][safeNama];
        stats.push({ nama: nama, alpha: totalAlpha });
    });
    
    stats.sort((a, b) => a.alpha - b.alpha); 
    
    const tbody = document.getElementById('tbody-peringkat-siswa-kelas');
    tbody.innerHTML = "";
    stats.forEach((item, index) => {
        let rankMedal = index === 0 ? "🥇" : (index === 1 ? "🥈" : (index === 2 ? "🥉" : (index + 1)));
        tbody.innerHTML += `<tr><td style="text-align:center; font-weight:bold; font-size:16px;">${rankMedal}</td><td><strong>${item.nama}</strong></td><td style="text-align:center;"><span style="color:#ef4444; font-weight:bold;">${item.alpha}</span></td></tr>`;
    });
}

function lihatFotoPreview(url) {
    document.getElementById('preview-image-src').src = url; openModal('modal-preview-foto');
}

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
    document.getElementById('kelas').value = kelas; document.getElementById('teks-kelas').innerText = kelas; document.getElementById('btn-pilih-kelas').classList.add('selected');
    document.getElementById('hari').value = ""; document.getElementById('teks-hari').innerText = "Pilih hari kehadiran..."; document.getElementById('btn-pilih-hari').classList.remove('selected');
    document.getElementById('nama-terpilih').value = ""; document.getElementById('search-nama').value = "";
    closeModal('modal-kelas'); renderNama("");
}

function pilihHari(hari) {
    document.getElementById('hari').value = hari; document.getElementById('teks-hari').innerText = hari; document.getElementById('btn-pilih-hari').classList.add('selected');
    document.getElementById('nama-terpilih').value = ""; document.getElementById('search-nama').value = "";
    closeModal('modal-hari'); renderNama("");
}

function renderNama(filterText = "") {
    const listContainer = document.getElementById('list-nama');
    const kelas = document.getElementById('kelas').value;
    const hari = document.getElementById('hari').value;
    listContainer.innerHTML = "";
    if (!kelas) return listContainer.innerHTML = `<div class="name-item disabled" style="text-align:center; color:#94a3b8; padding: 20px;">Pilih kelas terlebih dahulu.</div>`;
    
    const daftarNama = daftarNamaPerKelas[kelas] || [];
    const filtered = daftarNama.filter(nama => nama.toLowerCase().includes(filterText.toLowerCase()));
    if (filtered.length === 0) return listContainer.innerHTML = `<div class="name-item disabled" style="text-align:center; color:#94a3b8; padding: 20px;">Siswa tidak ditemukan.</div>`;
    
    let sudahAbsenMap = new Set();
    if (hari) dbAbsensi.forEach(record => { if (record.kelas === kelas && record.hari === hari) sudahAbsenMap.add(record.nama); });
    
    filtered.forEach(nama => {
        let div = document.createElement('div');
        div.className = 'name-item';
        const sudahAbsen = sudahAbsenMap.has(nama);
        if (sudahAbsen) {
            div.innerHTML = `${nama} <span style="float:right; color:#10b981; font-weight:700;">✓ Tercatat</span>`;
            div.classList.add('disabled');
        } else {
            div.innerText = nama;
            if (nama === document.getElementById('nama-terpilih').value) div.classList.add('terpilih');
            div.onclick = () => {
                document.getElementById('nama-terpilih').value = nama; document.getElementById('search-nama').value = nama; renderNama(nama);
            };
        }
        listContainer.appendChild(div);
    });
}
renderNama();
function filterNama() { renderNama(document.getElementById('search-nama').value); }

// ==== KAMERA ====
async function mulaiKamera() {
    try {
        streamKamera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        document.getElementById('video-kamera').srcObject = streamKamera; document.getElementById('video-kamera').classList.remove('hidden');
        document.getElementById('canvas-kamera').classList.add('hidden'); document.getElementById('btn-capture').classList.remove('hidden'); document.getElementById('btn-retake').classList.add('hidden');
    } catch (err) {
        Swal.fire({ title: 'Akses Ditolak', text: 'Izinkan browser menggunakan kamera untuk verifikasi.', icon: 'error', timer: 3000, timerProgressBar: true, showConfirmButton: false });
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

    if (!kelas || !hari || !nama) return Swal.fire({ title: 'Gagal', text: 'Isi semua data.', icon: 'warning', timer: 2500, timerProgressBar: true, showConfirmButton: false });

    Swal.fire({ title: 'Mengecek Lokasi...', text: 'Memastikan Anda berada di sekolah.', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    try { const jarak = await verifikasiLokasi(); Swal.close(); } catch (pesanError) { return Swal.fire({ title: 'Gagal Absen', text: pesanError, icon: 'error' }); }

    let fotoSimpan = document.getElementById('foto-data').value;
    if (!fotoSimpan) return Swal.fire({ title: 'Bukti Diperlukan', text: 'Ambil foto terlebih dahulu.', icon: 'warning', timer: 2500, timerProgressBar: true, showConfirmButton: false });

    Swal.fire({ title: 'Mengirim Data...', text: 'Mohon tunggu', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});

    const timeNow = new Date(); const uniqueId = "ID_" + timeNow.getTime() + "_" + Math.random().toString(36).substr(2, 5); const waktuStr = timeNow.toLocaleString('id-ID');
    let publicUrl = ''; let fileName = '';
    
    if (fotoSimpan) {
        const blob = dataURLtoBlob(fotoSimpan); const fileExt = 'jpg'; fileName = `absensi_${uniqueId}.${fileExt}`;
        const { error: uploadError } = await supabaseClient.storage.from('foto-absensi').upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) return Swal.fire({ title: 'Gagal', text: 'Gagal unggah bukti.', icon: 'error', timer: 2500, timerProgressBar: true, showConfirmButton: false });
        const { data: publicUrlData } = supabaseClient.storage.from('foto-absensi').getPublicUrl(fileName); publicUrl = publicUrlData.publicUrl;
    }

    const payload = { kelas: kelas, hari: hari, nama: nama, status: status, keterangan: keterangan, foto: publicUrl, filePath: fileName, waktuStr: waktuStr, lockKey: `absen_${kelas}_${nama}_${hari}` };
    await firebase.database().ref('absensi/' + uniqueId).set(payload);

    Swal.fire({ title: 'Berhasil!', text: `${nama} telah absen.`, icon: 'success', timer: 2500, timerProgressBar: true, showConfirmButton: false }).then(() => {
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
