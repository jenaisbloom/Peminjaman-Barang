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
  return (end - start) / (1000 * 60 * 60 * 24);
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

  if (role === "admin" && user === "admin" && pass === "admin123") {
    localStorage.setItem("role", "admin");
    window.location.href = "admin.html";
    return;
  }

  if (role === "peminjam" && pass === "peminjam123") {
    localStorage.setItem("role", "peminjam");
    window.location.href = "peminjam.html";
    return;
  }

  alert("Login gagal. Cek role / username / password.");
}

/* =========================
   PEMINJAM
========================= */
function tambahPeminjaman() {
  const nama = document.getElementById("namaPeminjam").value.trim();
  const telp = document.getElementById("telpPeminjam").value.trim();
  const alamat = document.getElementById("alamatPeminjam").value.trim();
  const barangNama = document.getElementById("barang").value.trim();
  const jumlah = parseInt(document.getElementById("jumlah").value, 10);
  const tglPinjam = document.getElementById("tglPinjam").value;
  const tglKembali = document.getElementById("tglKembali").value;

  if (!nama || !telp || !alamat || !barangNama || !jumlah || !tglPinjam || !tglKembali) {
    alert("Semua data wajib diisi.");
    return;
  }

  const lama = daysBetween(tglPinjam, tglKembali);
  if (lama < 0 || lama > 3) {
    alert("Peminjaman maksimal 3 hari.");
    return;
  }

  const barangList = getLS("barang", []);
  const barang = barangList.find(b => b.nama === barangNama);

  if (!barang || jumlah > barang.stok) {
    alert("Stok tidak mencukupi.");
    return;
  }

  const peminjaman = getLS("peminjaman", []);
  peminjaman.push({
    peminjam: nama,
    telp,
    alamat,
    barang: barangNama,
    jumlah,
    pinjam: tglPinjam,
    kembali: tglKembali,
    status: "Dipinjam"
  });

  barang.stok -= jumlah;

  setLS("peminjaman", peminjaman);
  setLS("barang", barangList);

  alert("Peminjaman berhasil diajukan.");

  document.querySelectorAll("input").forEach(i => i.value = "");
}

/* =========================
   ADMIN
========================= */
function renderStok() {
  const tbody = document.getElementById("tabelBarang");
  if (!tbody) return;

  const barangList = getLS("barang", []);
  tbody.innerHTML = "";

  barangList.forEach(b => {
    tbody.innerHTML += `<tr><td>${b.nama}</td><td>${b.stok}</td></tr>`;
  });
}

function renderPeminjaman() {
  const tbody = document.getElementById("tabelAdmin");
  if (!tbody) return;

  const peminjaman = getLS("peminjaman", []);
  tbody.innerHTML = "";

  peminjaman.forEach((p, i) => {
    const aksi = p.status === "Dipinjam"
      ? `<button onclick="kembalikan(${i})">Kembalikan</button>`
      : "-";

    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${p.peminjam}</td>
        <td>${p.telp}</td>
        <td>${p.alamat}</td>
        <td>${p.barang}</td>
        <td>${p.jumlah}</td>
        <td>${p.pinjam}</td>
        <td>${p.kembali}</td>
        <td>${p.status}</td>
        <td>${aksi}</td>
      </tr>`;
  });
}

function renderAdmin() {
  renderStok();
  renderPeminjaman();
}

window.kembalikan = function (index) {
  const peminjaman = getLS("peminjaman", []);
  const barangList = getLS("barang", []);

  const data = peminjaman[index];
  if (!data || data.status !== "Dipinjam") return;

  data.status = "Dikembalikan";
  const barang = barangList.find(b => b.nama === data.barang);
  if (barang) barang.stok += data.jumlah;

  setLS("peminjaman", peminjaman);
  setLS("barang", barangList);
  renderAdmin();
};

function resetData() {
  if (!confirm("Yakin reset data?")) return;
  localStorage.removeItem("peminjaman");
  localStorage.removeItem("barang");
  initBarang();
  renderAdmin();
}

/* =========================
   PAGE INIT + EYE PASSWORD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  initBarang();

  const btnLogin = document.getElementById("btnLogin");
  if (btnLogin) btnLogin.addEventListener("click", handleLogin);

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) btnLogout.addEventListener("click", logout);

  const page = document.body.getAttribute("data-page");

  if (page === "peminjam") {
    requireRole("peminjam");
    document.getElementById("btnAjukan").addEventListener("click", tambahPeminjaman);
  }

  if (page === "admin") {
    requireRole("admin");
    renderAdmin();
    const btnReset = document.getElementById("btnReset");
    if (btnReset) btnReset.addEventListener("click", resetData);
  }

  // ===== TOGGLE PASSWORD (SVG EYE) =====
  const password = document.getElementById("password");
  const toggleEye = document.getElementById("toggleEye");
  const eyeOpen = document.getElementById("eyeOpen");
  const eyeClosed = document.getElementById("eyeClosed");

  if (password && toggleEye) {
    toggleEye.addEventListener("click", () => {
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      eyeOpen.style.display = show ? "none" : "block";
      eyeClosed.style.display = show ? "block" : "none";
    });
  }
});
