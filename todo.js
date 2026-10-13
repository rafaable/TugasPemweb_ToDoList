// Mengambil elemen-elemen DOM
const formTugas = document.getElementById("id-addTask");
const inputTeks = document.getElementById("id-inputTeks");
const inputTanggal = document.getElementById("id-inputTanggal");
const listTugas = document.getElementById("id-listTugas");
const emptyState = document.getElementById("id-emptyState");
const countAll = document.getElementById("countAll");
const countBelom = document.getElementById("countBelom");
const countUdah = document.getElementById("countUdah");
const countProgress = document.getElementById("id-countProgress");

// Elemen state baru untuk kebutuhan asinkron (Loading & Error)
const statusContainer = document.getElementById("id-statusContainer");
const statusTeks = document.getElementById("id-statusTeks");
const tombolUlang = document.getElementById("id-tombolUlang");

// Filter state
let filterAktif = "all";
const tombolFilter = document.querySelectorAll(".filter-btn");

// Single Source of Truth
const state = {
    status: "idle", // 'idle' | 'loading' | 'error' | 'success'
    data: [],
    error: null
};

// Fungsi untuk memperbarui angka statistik tugas
function updateHitungan() {
    const total = state.data.length;
    const udah = state.data.filter(function (t) {
        return t.selesai;
    }).length;

    countAll.textContent = total;
    countBelom.textContent = total - udah;
    countUdah.textContent = udah;
    countProgress.textContent = `${udah} dari ${total} tugas selesai`;
}

// Fungsi membuat elemen kartu per tugas
function buatKartuTugas(tugas) {
    const li = document.createElement("li");
    li.className = "card-tugas";
    li.dataset.id = tugas.id;

    if (tugas.selesai) {
        li.classList.add("selesai");
    }

    let htmlTanggal = "";
    if (tugas.deadline) {
        const tanggalRapi = new Date(tugas.deadline).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        htmlTanggal = `<span class="listTugas-tanggal">${tanggalRapi}</span>`;
    }

    const htmlMatkul = tugas.matkul ? `<span class="listTugas-matkul">${tugas.matkul}</span>` : "";

    // Data dari Mock API menggunakan 'judul', 'deadline', dan 'matkul'
    li.innerHTML = `
        <input type="checkbox" ${tugas.selesai ? "checked" : ""}>
        <span class="listTugas-teks">${htmlMatkul}${tugas.judul}</span>
        ${htmlTanggal}
        <button type="button" class="tombol-hapus">hapus</button>
    `;

    return li;
}

// Fungsi Render Utama dengan 4 State (Pola Lab 11 notes.md)
function render() {
    // Reset tampilan awal tiap kali render dipanggil
    statusContainer.hidden = true;
    statusContainer.classList.remove("error");
    tombolUlang.hidden = true;
    emptyState.style.display = "none";
    listTugas.innerHTML = "";

    // 1. State: LOADING
    if (state.status === "loading") {
        statusContainer.hidden = false;
        statusTeks.textContent = "Sedang memuat data tugas dari server...";
        return;
    }

    // 2. State: ERROR (+ Tombol Coba Lagi)
    if (state.status === "error") {
        statusContainer.hidden = false;
        statusContainer.classList.add("error");
        statusTeks.textContent = `Gagal memuat tugas: ${state.error}`;
        tombolUlang.hidden = false;
        return;
    }

    // 3. State sukses tapi kosong
    if (state.status === "success" && state.data.length === 0) {
        emptyState.style.display = "";
        updateHitungan();
        return;
    }

    // 4. State sukses & ada data
    if (state.status === "success" && state.data.length > 0) {
        state.data.forEach(function (tugas) {
            if (filterAktif === "tugas-belom" && tugas.selesai) return;
            if (filterAktif === "tugas-udah" && !tugas.selesai) return;
            listTugas.appendChild(buatKartuTugas(tugas));
        });

        // Cek apakah hasil filter kosong
        if (listTugas.children.length === 0) {
            emptyState.style.display = "";
        }

        updateHitungan();
    }
}

// Fungsi ambil data dari Server pakai fetch()
async function ambilTugas() {
    state.status = "loading";
    state.error = null;
    render();

    try {
        const res = await fetch("/api/tugas");

        // fetch nggak otomatis lempar error di 404/500, wajib cek res.ok
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        state.status = "success";
        state.data = data;
    } catch (err) {
        state.status = "error";
        // Bedakan error offline (TypeError) dengan pesan dari server (sesuai notes.md)
        state.error = err instanceof TypeError
            ? "Tidak dapat terhubung ke server (offline)"
            : err.message;
    }

    render();
}

// Event Listener tombol Coba Lagi
tombolUlang.addEventListener("click", function () {
    ambilTugas();
});

// Event Listener tombol Filter
tombolFilter.forEach(function (tombol) {
    tombol.addEventListener("click", function () {
        filterAktif = tombol.dataset.filter;

        tombolFilter.forEach(function (t) {
            t.classList.remove("active");
        });
        tombol.classList.add("active");

        render();
    });
});

// Panggil fungsi pengambilan data pertama kali saat halaman dibuka
ambilTugas();
