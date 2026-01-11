/* =========================
   UTIL
========================= */
function getLS(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function setLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function daysBetween(dateStartStr, dateEndStr) {
  const start = new Date(dateStartStr);
  const end = new Date(dateEndStr);
  const diff = end - start;
  return diff / (1000 * 60 * 60 * 24);
}

/* =========================
   INIT DATA (BARANG)
========================= */
function initBarang() {
  if (!localStorage.getItem("barang")) {
    setLS("barang", [
      { nama: "Tripod", stok: 5 },
      { nama: "iP 17 Pro", stok: 5 },
      { nama: "Pajero", stok: 5 }
    ]);
  }
}

/* =========================
   AUTH / ROLE
========================= */
function requireRole(roleNeeded) {
  const role = localStorage.getItem("role");
  if (role !== roleNeeded) {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

/* =========================
   LOGIN
========================= */
function handleLogin() {
  const role = document.getElementById("role").value.trim();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (!role || !user || !pass) {
    alert("Lengkapi data login");
    return;
  }

  // ADMIN (fix)
  if (role === "admin" && user === "admin" && pass === "admin123") {
    localStorage.setItem("role", "admin");
    window.location.href = "admin.html";
    return;
  }

  // PEMINJAM (password saja)
  if (role === "peminjam" && pass === "peminjam123") {
    localStorage.setItem("role", "peminjam");
    window.location.href = "peminjam.html";
    return;
  }

  alert("Login gagal. Cek role/username/password.");
}

/* =========================
   PEMINJAM - AJUKAN
========================= */
function tambahPeminjaman() {
  const nama = document.getElementById("namaPeminjam").value.trim();
  const telp = document.getElementById("telpPeminjam").value.trim();
  const alamat = document.getElementById("alamatPeminjam").value.trim();
  const barangNama = document.getElementById("barang").value.trim();
  const jumlahStr = document.getElementById("jumlah").value;
  const tglPinjam = document.getElementById("tglPinjam").value;
  const tglKembali = document.getElementById("tglKembali").value;

  const jumlah = parseInt(jumlahStr, 10);

  // validasi wajib isi
  if (!nama || !telp || !alamat || !barangNama || !jumlahStr || !tglPinjam || !tglKembali) {
    alert("Semua data wajib diisi.");
    return;
  }
  if (isNaN(jumlah) || jumlah <= 0) {
    alert("Jumlah barang harus lebih dari 0.");
    return;
  }

  // validasi max 3 hari
  const lama = daysBetween(tglPinjam, tglKembali);
  if (lama < 0) {
    alert("Tanggal kembali tidak boleh lebih awal dari tanggal pinjam.");
    return;
  }
  if (lama > 3) {
    alert("Maksimal peminjaman hanya 3 hari.");
    return;
  }

  // cek stok
  const barangList = getLS("barang", []);
  const barang = barangList.find(b => b.nama === barangNama);
  if (!barang) {
    alert("Barang tidak ditemukan.");
    return;
  }
  if (jumlah > barang.stok) {
    alert("Stok tidak mencukupi.");
    return;
  }

  // simpan peminjaman & kurangi stok
  const peminjaman = getLS("peminjaman", []);
  peminjaman.push({
    peminjam: nama,
    telp: telp,
    alamat: alamat,
    barang: barangNama,
    jumlah: jumlah,
    pinjam: tglPinjam,
    kembali: tglKembali,
    status: "Dipinjam"
  });

  barang.stok -= jumlah;

  setLS("peminjaman", peminjaman);
  setLS("barang", barangList);

  alert("Peminjaman berhasil diajukan.");

  // bersihkan form (biar enak)
  document.getElementById("namaPeminjam").value = "";
  document.getElementById("telpPeminjam").value = "";
  document.getElementById("alamatPeminjam").value = "";
  document.getElementById("barang").value = "";
  document.getElementById("jumlah").value = "";
  document.getElementById("tglPinjam").value = "";
  document.getElementById("tglKembali").value = "";
}

/* =========================
   ADMIN - TAMPIL & KEMBALIKAN
========================= */
function renderStok() {
  const tbody = document.getElementById("tabelBarang");
  const barangList = getLS("barang", []);
  tbody.innerHTML = "";

  barangList.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${b.nama}</td><td>${b.stok}</td>`;
    tbody.appendChild(tr);
  });
}

function renderPeminjaman() {
  const tbody = document.getElementById("tabelAdmin");
  const peminjaman = getLS("peminjaman", []);
  tbody.innerHTML = "";

  peminjaman.forEach((p, i) => {
    const statusClass = (p.status === "Dipinjam") ? "status-dipinjam" : "status-kembali";
    const aksi = (p.status === "Dipinjam")
      ? `<button onclick="kembalikan(${i})">Kembalikan</button>`
      : `-`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.peminjam}</td>
      <td>${p.telp}</td>
      <td>${p.alamat}</td>
      <td>${p.barang}</td>
      <td>${p.jumlah}</td>
      <td>${p.pinjam}</td>
      <td>${p.kembali}</td>
      <td class="${statusClass}">${p.status}</td>
      <td>${aksi}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdmin() {
  renderStok();
  renderPeminjaman();
}

// supaya bisa dipanggil dari onclick (di HTML)
window.kembalikan = function(index) {
  const peminjaman = getLS("peminjaman", []);
  const barangList = getLS("barang", []);

  const data = peminjaman[index];
  if (!data) return;

  if (data.status !== "Dipinjam") return;

  // ubah status
  data.status = "Dikembalikan";

  // tambah stok kembali
  const barang = barangList.find(b => b.nama === data.barang);
  if (barang) barang.stok += parseInt(data.jumlah, 10);

  setLS("peminjaman", peminjaman);
  setLS("barang", barangList);

  renderAdmin();
};

function resetData() {
  if (!confirm("Yakin reset data? Ini akan menghapus peminjaman & reset stok ke 5.")) return;
  localStorage.removeItem("peminjaman");
  localStorage.removeItem("barang");
  initBarang();
  renderAdmin();
}

/* =========================
   PAGE INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initBarang();

  const page = document.body.getAttribute("data-page");

  // index/login page
  const btnLogin = document.getElementById("btnLogin");
  if (btnLogin) {
    btnLogin.addEventListener("click", handleLogin);
  }

  // logout button (admin & peminjam)
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", logout);
  }

  // peminjam page
  if (page === "peminjam") {
    requireRole("peminjam");
    const btnAjukan = document.getElementById("btnAjukan");
    btnAjukan.addEventListener("click", tambahPeminjaman);
  }

  // admin page
  if (page === "admin") {
    requireRole("admin");
    renderAdmin();

    const btnReset = document.getElementById("btnReset");
    if (btnReset) btnReset.addEventListener("click", resetData);
  }
   function togglePassword() {
  const password = document.getElementById("password");
  const eye = document.querySelector(".eye");

  if (password.type === "password") {
    password.type = "text";
    eye.classList.add("closed");
  } else {
    password.type = "password";
    eye.classList.remove("closed");
  }
}
});

