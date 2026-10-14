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

const tombolAdd = document.getElementById("id-tombolAdd");
const pesanForm = document.getElementById("id-pesanForm");


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

    // state loading
    if (state.status === "loading") {
        statusContainer.hidden = false;
        statusTeks.textContent = "Sedang memuat data tugas dari server...";
        return;
    }

    // state error & tombol coba lagi
    if (state.status === "error") {
        statusContainer.hidden = false;
        statusContainer.classList.add("error");
        statusTeks.textContent = `Gagal memuat tugas: ${state.error}`;
        tombolUlang.hidden = false;
        return;
    }

    // state sukses tapi kosong
    if (state.status === "success" && state.data.length === 0) {
        emptyState.style.display = "";
        updateHitungan();
        return;
    }

    // state sukses & ada data
    if (state.status === "success" && state.data.length > 0) {
        state.data.forEach(function (tugas) {
            if (filterAktif === "tugas-belom" && tugas.selesai) return;
            if (filterAktif === "tugas-udah" && !tugas.selesai) return;
            listTugas.appendChild(buatKartuTugas(tugas));
        });

        // cek apakah hasil filter kosong
        if (listTugas.children.length === 0) {
            emptyState.style.display = "";
        }

        updateHitungan();
    }
}

// Nomor 2: Tambah Tugas Baru via POST /api/tugas
formTugas.addEventListener("submit", async function (event) {
    event.preventDefault();

    // 1. Siapkan objek data (gunakan nama 'judul' dan 'deadline' sesuai Mock API)
    const tugasBaru = {
        judul: inputTeks.value.trim(),
        deadline: inputTanggal.value,
        matkul: "SKPB" // default sementara sampai nomor 5
    };

    // 2. Nonaktifkan tombol & ubah teks selama mengirim
    tombolAdd.disabled = true;
    tombolAdd.textContent = "Mengirim...";
    pesanForm.hidden = true;
    pesanForm.textContent = "";

    try {
        // 3. Request POST dengan method, header Content-Type, dan JSON.stringify(body)
        const res = await fetch("/api/tugas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(tugasBaru)
        });

        const body = await res.json();

        // 4. Jika res.ok (status 201 Created)
        if (res.ok) {
            state.data.push(body); // tambahkan tugas baru yang dikembalikan server ke state
            render();              // render ulang tampilan
            formTugas.reset();     // kosongkan form input
        } else {
            // Jika server menolak (status 400, misal judul < 3 huruf atau tanggal kosong)
            pesanForm.textContent = body.error || "Gagal menambah tugas";
            pesanForm.hidden = false;
        }
    } catch (err) {
        // Jika ada masalah koneksi / offline
        pesanForm.textContent = err instanceof TypeError
            ? "Gagal mengirim: Tidak dapat terhubung ke server (offline)"
            : err.message;
        pesanForm.hidden = false;
    } finally {
        // 5. Apa pun hasilnya (sukses/gagal), aktifkan tombol kembali
        tombolAdd.disabled = false;
        tombolAdd.textContent = "+ add";
    }
});


// Soal 1: fungsi ambil data dari server pakai fetch()
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
        // Bedain error offline (TypeError) dengan pesan dari server
        state.error = err instanceof TypeError
            ? "Tidak dapat terhubung ke server (offline)"
            : err.message;
    }

    render();
}

// Soal 1: Event Listener tombol Coba Lagi
tombolUlang.addEventListener("click", function () {
    ambilTugas();
});

// Soal 1 : Event Listener tombol Filter
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
