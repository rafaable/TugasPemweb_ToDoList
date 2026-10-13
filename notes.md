# Sinkron vs Asinkron

Sinkron itu kayak antri satu per satu. Asinkron itu sambil nunggu bisa kerjain yang lain. Asinkron ada `setTimeout` sama `setInterval`, `setTimeout` itu pokoknya cuma jalanin sekali, kalau `setInterval` itu jalanin berulang.

### Contoh while (blocking)

```javascript
const status = document.querySelector("#status");
document.querySelector("#mulai").addEventListener("click", function() {
    status.textContent = "Memproses...";
    console.log("mulai");
    const selesai = Date.now() + 2000;
    while (Date.now() < selesai) {}
    status.textContent = "Selesai";
    console.log("selesai");
});

let $n = 0$;
// CPU sibuk 2 detik
document.querySelector("#klik").addEventListener("click", function() {
    document.querySelector("#jumlah").textContent = ++n;
});
```

* Klik 'mulai tugas 2 detik'
* Layarnya ngefreeze sampe 2 detik, 'klik saya' ga bisa increment
* 2 detik selesai
* Di console muncul mulai & selesai bersamaan
* Tulisan siap di UI berubah jadi 'selesai' baru bisa keincrement

### setTimeout

```javascript
const status = document.querySelector("#status");
document.querySelector("#mulai").addEventListener("click", function() {
    status.textContent = "Memproses...";
    console.log("mulai");
    setTimeout(function() {
        status.textContent = "Selesai";
        console.log("selesai");
    }, 2000);
    console.log("setTimeout terpasang, lanjut!");
});

let $n = 0$;
document.querySelector("#klik").addEventListener("click", function() {
    document.querySelector("#jumlah").textContent = ++n;
});
```

* Klik 'mulai tugas 2 detik'
* Muncul 'memproses...'
* `setTimeout` terpasang, lanjut!
* Increment bisa nambah
* 2 detik selesai
* 'Selesai' di console, 'selesai' juga di UI

### setInterval

```javascript
const status = document.querySelector("#status");
document.querySelector("#mulai").addEventListener("click", function() {
    status.textContent = "Memproses...";
    console.log("mulai");
    let sisa = 4;
    const id = setInterval(function() {
        sisa--;
        status.textContent = `Memproses... ${sisa}`;
        if (sisa === 0) {
            clearInterval(id);
            status.textContent = "Selesai";
        }
    }, 500);
});

let $n = 0$;
document.querySelector("#klik").addEventListener("click", function() {
    document.querySelector("#jumlah").textContent = ++n;
});
```
*(Ini emang ga dikasih `console.log` selesai ya)*

* Mulai tugas 2 detik
* Memproses... [ countdown 3, 2, 1 ]
* Bisa sambil increment
* 2 detik selesai
* Tulisan memproses berubah jadi 'selesai'

> Kenapa teks "Memproses..." tidak pernah terlihat pada versi `while` (blocking), padahal baris itu dijalankan sebelum loop? 
> *Thread yang sama dipakai untuk menggambar halaman; loop memonopolinya sehingga teks sudah diganti sebelum sempat digambar.*

---

## Live Coding Lab 2

Hitung mundur 5 detik dengan `setInterval` dan jangan lupa menghentikannya.
1. Tombol Mulai nonaktif selama timer berjalan
2. Setiap $1000$ ms, detik berkurang $1$ dan tampil di `#sisa`
3. Di $0$: `clearInterval`, `#status = "Waktu habis!"`, tombol aktif lagi

```javascript
const sisa = document.querySelector("#sisa");
const status = document.querySelector("#status");
const tombol = document.querySelector("#mulai");

tombol.addEventListener("click", function() {
    let detik = 5;
    sisa.textContent = detik;
    status.textContent = "Waktu berjalan...";
    
    // TODO 1: nonaktifkan tombol selama timer berjalan
    tombol.disabled = true;
    
    // TODO 2: dengan setInterval, kurangi 'detik' setiap 1000 ms, lalu tampilkan ke #sisa
    const timer = setInterval(function() {
        detik--;
        sisa.textContent = detik;
        
        // TODO 3: saat detik mencapai <= 0, clearInterval, #status = "Waktu habis!", aktifkan tombol lagi
        if (detik <= 0) {
            clearInterval(timer);
            status.textContent = "Waktu habis!";
            tombol.disabled = false;
        }
    }, 1000);
});
```

---

## Event Loop

JavaScript itu satu thread, cuma bisa satu event dalam satu waktu. Tapi dia ada petugas yang ngurus hal lain-lain yang makan waktu yaitu browser, terus browser bakal ngasih tau si JavaScript kalau hasilnya udah jadi.

Nah event loop itu mekanisme buat ngatur kapan JavaScript boleh ambil kerjaan selanjutnya:
* **Call Stack** itu tumpukan kerjaan, yang aktif cuma yang paling atas. Misal fungsi `hitung()` manggil fungsi `jumlahkan()`, berarti dia harus kerjain yang `jumlahkan()` dulu baru lanjut ke fungsi `hitung()`.
* **Web APIs** itu fasilitas browser, dia ngehandle timer, permintaan jaringan melalui `fetch()`, dan event DOM. Misal ketika kita pakai `setTimeout()`, yang ngatur scheduling dan ngitung waktunya itu si browser.
* **Task Queue (macrotask):** callback `setTimeout`, `setInterval`, event klik.
* **Microtask Queue:** dia antrean prioritas setelah call stack, misalnya callback Promise (`.then`, lanjutan setelah `await`).

**Aturan event loop:** tunggu Call Stack kosong $\rightarrow$ jalankan semua microtask $\rightarrow$ ambil satu task (gambar ulang halaman) $\rightarrow$ ulangi.

### setTimeout 0

```javascript
console.log("1 mulai");
setTimeout(function() {
    console.log("3 timeout");
}, 0);
console.log("2 selesai");
```
1. '1. Mulai' masuk call stack, cetak ke console.
2. `setTimeout`, masuk call stack, dihandle web browser, masuk task queue ketika waktunya habis nanti.
3. '2. Selesai', masuk call stack, cetak ke console.
4. Callback lagi fungsi `setTimeout` karena waktunya udah abis, callback buat cetak '3. Timeout' di console.

### Promise vs setTimeout

```javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
```
* Pokoknya urutannya **A, D, C, B**

---

## Async (await + fetch)

```javascript
async function muat() {
    console.log("1 sebelum");
    const res = await fetch("/api/matkul");
    console.log("4 data tiba:", res.status);
}

console.log("2 muat dimulai");
muat();
console.log("3 sesudah");
```

### Apa urutan output kode ini?

```javascript
setTimeout(() => console.log("A"), 0);
console.log("B");
Promise.resolve().then(() => console.log("C"));
setTimeout(() => console.log("D"), 0);
console.log("E");
```
* Output: **B, E, C, A, D**

---

## Live Coding Lab 1

**Atur urutan eksekusi**
Tanpa memindahkan urutan baris, buat output tampil $1 \rightarrow 2 \rightarrow 3$ hanya dengan "membungkus" barisnya.
1. Output akhir di console: $1$ sinkron, $2$ microtask, $3$ timeout
2. Gunakan `setTimeout(..., 0)` untuk satu baris
3. Gunakan `Promise.resolve().then(...)` untuk satu baris
4. Urutan ketiga baris di kode tidak boleh diubah

```javascript
setTimeout(() => console.log("3 timeout"), 0);
Promise.resolve().then(() => console.log("2 microtask"));
console.log("1 sinkron");
```

---

## Callback & Callback Hell

**Callback** itu fungsi yang dititipin buat dipanggil nanti pas hasilnya udah siap atau pas timernya udah selesai. Sejauh ini udah kepake di `setTimeout` dan `addEventListener`. `setTimeout` itu kan fungsinya baru dijalanin setelah sekian detik, kalau `addEventListener` fungsinya itu dititipin dan baru dijalanin pas ada yang ngeklik tombol.

**Error-first callback** itu callback yang dijalanin pas ada error.

### Contoh error-first callback

```javascript
function ambilData(callback) {
    const berhasil = true;
    if (berhasil) {
        callback(null, "Data berhasil diambil");
    } else {
        callback("Terjadi kesalahan", null);
    }
}

ambilData(function(err, data) {
    if (err) {
        console.log("Error:", err);
        return;
    }
    console.log(data);
});
```

### Callback Hell

Error bersarang karena kerjaan satu harus nunggu kerjaan sebelumnya alias tunggu-tungguan, bentuk susunan yang mirip piramida sering disebut **pyramid of doom**.

```javascript
ambilUser(function(err, user) {
    if (err) {
        console.log(err);
        return;
    }
    ambilNilai(user.id, function(err, nilai) {
        if (err) {
            console.log(err);
            return;
        }
        ambilMatkul(nilai.matkulId, function(err, matkul) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(matkul.nama);
        });
    });
});
```

### Solusinya pakai Promise

Ada juga istilah **promisify**, yaitu mengubah fungsi berbasis callback biar bisa dipakai dalam bentuk Promise.

```javascript
function ambilUser() {
    return new Promise((resolve, reject) => {
        const user = {
            id: 1,
            nama: "Budi"
        };
        resolve(user);
    });
}

function ambilNilai(userId) {
    return new Promise((resolve, reject) => {
        const nilai = {
            userId: userId,
            matkulId: 101,
            nilai: 90
        };
        resolve(nilai);
    });
}

function ambilMatkul(matkulId) {
    return new Promise((resolve, reject) => {
        const matkul = {
            id: matkulId,
            nama: "Pemrograman Web"
        };
        resolve(matkul);
    });
}

ambilUser()
    .then(user => ambilNilai(user.id))
    .then(nilai => ambilMatkul(nilai.matkulId))
    .then(matkul => console.log(matkul.nama))
    .catch(err => console.log(err));
```

### Contoh lainnya

**Satu callback**
```javascript
const log = document.querySelector("#log");
function tulis(teks, kelas) {
    const li = document.createElement("li");
    li.textContent = teks;
    if (kelas) li.className = kelas;
    log.append(li);
}

tulis("meminta data user...");
ambilUser("5027241001", function(err, user) {
    if (err) return tulis(err.message, "err");
    tulis(" " + user.nama);
}); // error-first
tulis("(baris ini jalan duluan tidak menunggu)");
```

*Profil Akademik*
1. meminta data user...
2. (baris ini jalan duluan tidak menunggu)
3. Rani Kusuma

**Tiga tingkat bersarang**
```javascript
const log = document.querySelector("#log");
function tulis(teks, kelas) {
    const li = document.createElement("li");
    li.textContent = teks;
    if (kelas) li.className = kelas;
    log.append(li);
}

tulis("meminta data user...");
ambilUser("5027241001", function(err, user) {
    if (err) return tulis(err.message, "err");
    tulis(" user: " + user.nama);
    
    ambilNilai(user.nrp, function(err, nilai) {
        if (err) return tulis(err.message, "err");
        tulis("/" + nilai.length + " nilai");
        
        ambilMatkul(nilai[0].kode, function(err, mk) {
            if (err) return tulis(err.message, "err");
            tulis(" " + mk + ":" + nilai[0].nilai);
            // ... dan seterusnya (pyramid of doom)
        });
    });
});
tulis("(baris ini jalan duluan tidak menunggu)");
```

*Profil Akademik*
1. meminta data user...
2. (baris ini jalan duluan tidak menunggu)
3. user: Rani Kusuma
4. 2 nilai
5. Pemrograman Web: 88

> Pada konvensi callback error-first `ambilUser(nrp, function(err, user) { ... })`, apa yang harus dilakukan pertama kali di dalam callback? 
> *Memeriksa `err`; jika ada, tangani lalu `return` sebelum memakai `user`.*

---

## Live Coding Lab 3

**Cek nilai pakai gaya callback**
Rasakan sendiri dua tingkat callback bersarang. Fungsi server tiruan ada di tab `index.html`.
1. Klik Muat $\rightarrow$ `#status` berisi pesan error dengan class error
2. Sukses nama tampil, lalu di dalam callback tadi panggil `ambilNilai`
3. Tiap nilai jadi `<li>Pemrograman Web: 88</li>`, status "Selesai"

```javascript
const status = document.querySelector("#status");
const nama = document.querySelector("#nama");
const daftarNilai = document.querySelector("#nilai");

document.querySelector("#muat").addEventListener("click", function() {
    const nrp = document.querySelector("#nrp").value.trim();
    status.className = "status";
    status.textContent = "Memuat...";
    nama.textContent = "-";
    daftarNilai.innerHTML = "";
    
    // TODO 1: panggil ambilUser(nrp, function(err, user) {...})
    // err -> #status err.message, beri class "error", lalu return
    // sukses -> tulis user.nama ke #nama
    ambilUser(nrp, function(err, user) {
        if (err) {
            status.textContent = err.message;
            status.className = "error";
            return;
        }
        nama.textContent = user.nama;
        
        // TODO 2: DI DALAM callback tadi, panggil ambilNilai(user.nrp, ...)
        // -> tiap nilai jadi <li>Pemrograman Web: 88</li> di #nilai
        // -> #status = "Selesai"
        ambilNilai(user.nrp, function(err, nilai) {
            if (err) {
                status.textContent = err.message;
                status.className = "error";
                return;
            }
            nilai.forEach(function(item) {
                const li = document.createElement("li");
                li.textContent = `Pemrograman web: ${item.nilai}`;
                daftarNilai.appendChild(li);
            });
            status.textContent = "Selesai";
        });
    });
});
```

---

## Promise

Promise adalah objek yang mewakili nilai yang akan ada: "janji" hasil pekerjaan asinkron. Daripada menitipkan callback ke fungsi, fungsi mengembalikan Promise, dan kita yang memutuskan apa yang dilakukan dengannya.
* **Tiga status:** `pending`, `fulfilled` (berhasil, punya nilai) atau `rejected` (gagal, punya error). Sekali settled, statusnya tidak berubah lagi.
* `.then(fn)` untuk hasil, `.catch(fn)` untuk error, `.finally(fn)` selalu jalan (cocok untuk mematikan loading).
* **Chaining** itu nyambungin beberapa promise.
* **Membuat sendiri:** `new Promise((resolve, reject) => { ... })` - jarang perlu, kecuali untuk membungkus API callback lama. `fetch` sudah mengembalikan Promise.

```javascript
const status = document.querySelector("#status");
const log = t => document.querySelector("#log").insertAdjacentHTML("beforeend", `<li>${t}</li>`);

function setStatus(s) { 
    status.textContent = s; 
    status.className = "status " + s; 
}

function lemparDadu() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(6); // ini dipake salah satu ya! resolve aja / reject ajaa
            reject(new Error("Dadu jatuh dari meja!"));
        }, 1200);
    });
}

log("promise dibuat - pending");
lemparDadu()
    .then(angka => {
        setStatus("fulfilled");
        log(`then menerima ${angka}`);
    })
    .catch(err => {
        setStatus("rejected");
        log(`catch: ${err.message}`);
    })
    .finally(() => log("finally: selalu dijalankan"));

log("kode setelah rantai jalan duluan");
```

### Then...catch kalau resolved (fulfilled)
1. promise dibuat - pending
2. kode setelah rantai - jalan duluan
3. then menerima 6
4. finally: selalu dijalankan

### Then...catch kalau rejected
1. promise dibuat - pending
2. kode setelah rantai - jalan duluan
3. catch: Dadu jatuh dari meja!
4. finally: selalu dijalankan

```javascript
const status = document.querySelector("#status");
const log = t => document.querySelector("#log").insertAdjacentHTML("beforeend", `<li>${t}</li>`);

function setStatus(s) { 
    status.textContent = s; 
    status.className = "status" + s; 
}

function lemparDadu() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(6);
            reject(new Error("Dadu jatuh dari meja!"));
        }, 1200);
    });
}

log("promise dibuat - pending");
lemparDadu() // kalau berhasil, dapat resolve angka 6
    .then(angka => {
        setStatus("fulfilled");
        log(`then #1 menerima ${angka}`); // nerima angka 6
        return angka * 10; // return 6 * 10
    })
    .then(hasil => log(`then #2 menerima ${hasil}`)) // 60 ditangkep ini
    .catch(err => {
        setStatus("rejected");
        log(`catch: ${err.message}`);
    })
    .finally(() => log("finally: selalu dijalankan"));

log("kode setelah rantai jalan duluan");
```

### Rantai dua then kalau resolved (fulfilled)
1. promise dibuat - pending
2. kode setelah rantai - jalan duluan
3. then #1 menerima 6
4. then #2 menerima 60
5. finally: selalu dijalankan

### Rantai dua then kalau rejected
1. promise dibuat - pending
2. kode setelah rantai - jalan duluan
3. catch: Dadu jatuh dari meja!
4. finally: selalu dijalankan

---

## Live Coding Lab 4

**Bikin promise sendiri**
Buat dua fungsi yang mengembalikan Promise, lalu pakai dengan then/catch/finally.
1. `tunggu(ms)` mengembalikan Promise yang resolve setelah `ms` milidetik
2. `ambilUserP(nrp)` membungkus `ambilUser(callback)` $\rightarrow$ `resolve(user)` / `reject(err)`
3. Klik Muat: "Memuat..." $\rightarrow$ then tulis nama + "Berhasil", catch tulis pesan error
4. finally mengaktifkan kembali tombol

```javascript
const status = document.querySelector("#status");
const nama = document.querySelector("#nama");

// TODO 1: tunggu(ms) harus MENGEMBALIKAN Promise yang resolve setelah ms milidetik
function tunggu(ms) {
    return new Promise(function(resolve) {
        setTimeout(function() { // setTimeout, o nya kecil!
            resolve();
        }, ms);
    });
}

// TODO 2: "promisify" bungkus ambilUser(callback) menjadi Promise:
// resolve(user) jika sukses, reject(err) jika gagal
function ambilUserP(nrp) { // emang beda sama yang bawah, soal yg minta
    return new Promise(function(resolve, reject) { // ini fungsi template soal
        ambilUser(nrp, function(err, user) {
            if (err) reject(err);
            else resolve(user);
        });
    });
}

// TODO 3: klik #muat -> #status "Memuat...", lalu ambilUserP(nrp)
// .then -> tulis user.nama ke #nama, #status = "Berhasil"
// .catch -> #status = err.message
// .finally -> aktifkan lagi tombol
const tombol = document.querySelector("#muat");
tombol.addEventListener("click", function() {
    const nrp = document.querySelector("#nrp").value.trim();
    tombol.disabled = true;
    status.textContent = "Memuat...";
    nama.textContent = "";
    
    ambilUserP(nrp)
        .then(function(user) {
            nama.textContent = user.nama;
            status.textContent = "Berhasil";
        })
        .catch(function(err) {
            status.textContent = err.message;
        })
        .finally(function() {
            tombol.disabled = false;
        });
});
```

---

## Async / Await

Cara nulis kode pakai promise supaya lebih readable.
* `async` itu keyword yang nandain kalau suatu fungsi itu asinkron, fungsi async selalu mengembalikan promise walau perintahnya cuma diisi return biasa.
* `await` itu buat nunggu hasil promise. Kalau pakai await, hasilnya ada dua kemungkinan:
  * Kalau berhasil, nilai dikirim melalui resolve.
  * Kalau gagal, await bakal lempar error yang bisa ditangani pakai `try...catch`.

```javascript
async function tampilkanMatkul() {
    try {
        const user = await ambilUser();
        const nilai = await ambilNilai(user.id);
        const matkul = await ambilMatkul(nilai.matkulId);
        console.log(matkul.nama);
    } catch (err) {
        console.log("Terjadi kesalahan:", err.message);
    }
}
tampilkanMatkul();
```

### Then Chain

```javascript
const log = document.querySelector("#log");
const tulis = (t, c) => log.insertAdjacentHTML("beforeend", `<li class="${c || ""}">${t}</li>`);

function muat() {
    tulis("mulai...");
    ambilUserP("5027241001")
        .then(user => {
            tulis("user: " + user.nama);
            return ambilNilaiP(user.nrp);
        })
        .then(nilai => tulis("jumlah nilai: " + nilai.length))
        .catch(err => tulis("error: " + err.message, "err"))
        .finally(() => tulis("selesai"));
}
muat();
```
*Profil Akademik*
1. mulai...
2. user: Rani Kusuma
3. jumlah nilai: 2
4. selesai

### Async / Await

```javascript
const log = document.querySelector("#log");
const tulis = (t, c) => log.insertAdjacentHTML("beforeend", `<li class="${c || ""}">${t}</li>`);

async function muat() {
    tulis("mulai...");
    try {
        const user = await ambilUserP("5027241001");
        tulis("user: " + user.nama);
        const nilai = await ambilNilaiP(user.nrp);
        tulis("jumlah nilai: " + nilai.length);
    } catch (err) {
        tulis("error: " + err.message, "err");
    } finally {
        tulis("selesai");
    }
}
muat();
tulis("muat() tidak memblokir baris ini");
```
*Profil Akademik*
1. mulai...
2. muat() tidak memblokir baris ini
3. user: Rani Kusuma
4. jumlah nilai: 2
5. selesai

*Kalau NRP ga ada, bakal error:*
*Profil Akademik*
1. mulai...
2. muat() tidak memblokir baris ini
3. error: Mahasiswa 0000000000 tidak ditemukan
4. selesai

### Lupa await

```javascript
const log = document.querySelector("#log");
const tulis = (t, c) => log.insertAdjacentHTML("beforeend", `<li class="${c || ""}">${t}</li>`);

async function muat() {
    const user = ambilUserP("5027241001"); // Undefined soalnya lupa dikasih await, ibarat ambilUserP() belum sempet ngambil tapi udah ditagih
    console.log(user);
    tulis("user: " + user.nama);
}
muat();
```
*Profil Akademik*
1. user: undefined

---

## Live Coding Lab 5

**Refactor ke async / await**
Kode awal sudah berfungsi dengan rantai then. Tulis ulang agar lebih mudah dibaca, perilaku harus tetap sama.
1. Ubah `muatProfil` menjadi `async function`
2. Ganti setiap `then` dengan `await` (tidak boleh ada `then` tersisa)
3. Pakai `try / catch / finally` untuk error & mengaktifkan tombol
4. Tetap tampilkan nama & rata-rata 1 desimal

### Sebelum
```javascript
const tombol = document.querySelector("#muat");
const status = document.querySelector("#status");

// Versi .then() di bawah ini BERFUNGSI, tapi sulit dibaca.
// TODO: tulis ulang muatProfil() memakai async/await + try/catch/finally.
// Perilakunya harus tetap sama, dan tidak boleh ada ".then(" lagi.

function muatProfil(nrp) {
    tombol.disabled = true;
    status.className = "status";
    status.textContent = "Memuat...";
    let user;
    
    return ambilUserP(nrp)
        .then(function (u) {
            user = u;
            return ambilNilaiP(u.nrp);
        })
        .then(function (nilai) {
            const total = nilai.reduce((jumlah, n) => jumlah + n.nilai, 0);
            document.querySelector("#nama").textContent = user.nama;
            document.querySelector("#rata").textContent = (total / nilai.length).toFixed(1);
            status.textContent = "Berhasil";
        })
        .catch(function (err) {
            status.textContent = err.message;
            status.classList.add("error");
        })
        .finally(function () {
            tombol.disabled = false;
        });
}

tombol.addEventListener("click", function () {
    muatProfil(document.querySelector("#nrp").value.trim());
});
```

### Sesudah
```javascript
const tombol = document.querySelector("#muat");
const status = document.querySelector("#status");

// Menggunakan async/await
async function muatProfil(nrp) {
    tombol.disabled = true;
    status.className = "status";
    status.textContent = "Memuat...";
    
    try {
        const user = await ambilUserP(nrp);
        const nilai = await ambilNilaiP(user.nrp);
        const total = nilai.reduce((jumlah, n) => jumlah + n.nilai, 0);
        
        document.querySelector("#nama").textContent = user.nama;
        document.querySelector("#rata").textContent = (total / nilai.length).toFixed(1);
        status.textContent = "Berhasil";
    } catch (err) {
        status.textContent = err.message;
        status.classList.add("error");
    } finally {
        tombol.disabled = false;
    }
}

tombol.addEventListener("click", function () {
    muatProfil(document.querySelector("#nrp").value.trim());
});
```

---

## JSON

**JavaScript Object Notation:** cara server dan JavaScript bertukar informasi dengan format yang sama-sama mereka pahami.

### `JSON.stringify()` (objek jadi teks)
```javascript
const user = {
    nama: "Budi",
    umur: 20
};
const teks = JSON.stringify(user);
console.log(teks);
```
*Hasilnya:* `{"nama": "Budi", "umur": 20}`

### `JSON.parse()` (kebalikannya, teks jadi objek)
```javascript
const teks = '{"nama": "Budi", "umur": 20}';
const user = JSON.parse(teks);
console.log(user.nama);
```
*Hasil:* Budi

### Contoh salah
```javascript
JSON.parse("{nama: 'Budi'}");
```
*Ini salah karena key ga pake kutip ganda & string pake kutip tunggal.*

Kalau sumber teks ga pasti, pakai try catch:
```javascript
try {
    const user = JSON.parse(teks);
    console.log(user.nama);
} catch (err) {
    console.log("JSON tidak valid");
}
```

*Tambahan:* Misal objek terdiri dari nama string, fungsi dan alamat undefined, yang fungsi dan yang undefined bakal ilang.

### Hubungannya sama fetch()?
```javascript
const res = await fetch("/api/user");
const user = await res.json();
console.log(user.nama);
```
1. `fetch()` meminta data dari server.
2. `await res.json()` membaca isi respons dan mengubah JSON menjadi objek JavaScript.
3. `user.nama` mengambil nama dari objek tersebut.

*Ga perlu panggil `JSON.parse()` karena `res.json()` sudah ngebaca sekaligus ngubah.*

### Contoh di Modul

**Stringify**
```javascript
const out = document.querySelector("#out");
const mhs = {
    nama: "Rani",
    nrp: "5027241001",
    ipk: 3.71,
    aktif: true,
    matkul: ["Pemrograman Web", "Basis Data"]
};
const teks = JSON.stringify(mhs);
console.log(typeof teks, ".", teks.length, "karakter");
out.textContent = teks;
```
`{"nama": "Rani", "nrp": "5027241001", "ipk": 3.71, "aktif": true, "matkul": ["Pemrograman Web", "Basis Data"]}`

**Stringify versi lebih rapi**
```javascript
const out = document.querySelector("#out");
const mhs = {
    nama: "Rani",
    nrp: "5027241001",
    ipk: 3.71,
    aktif: true,
    matkul: ["Pemrograman Web", "Basis Data"]
};
const teks = JSON.stringify(mhs, null, 2);
console.log(typeof teks, ".", teks.length, "karakter");
out.textContent = teks;
```
```json
{
  "nama": "Rani",
  "nrp": "5027241001",
  "ipk": 3.71,
  "aktif": true,
  "matkul": [
    "Pemrograman Web",
    "Basis Data"
  ]
}
```

**Parse**
```javascript
const out = document.querySelector("#out");
const teks = '{"nama": "Rani", "ipk": 3.71, "matkul": ["Pemrograman Web", "Basis Data"]}';
const data = JSON.parse(teks);
console.log(typeof data, data.nama, data.matkul.length);
out.textContent = `Halo ${data.nama}, IPK ${data.ipk}, ${data.matkul.length} matkul`;
```
*Hasil:* Halo Rani, IPK 3.71, 2 matkul

**Parse teks ga sesuai format JSON**
```javascript
const out = document.querySelector("#out");
const teks = "{nama: 'Rani', ipk: 3.71,}"; // gaya objek JS, BUKAN JSON

try {
    const data = JSON.parse(teks);
    out.textContent = data.nama;
} catch (err) {
    console.error(err.name + ": " + err.message);
    out.textContent = "JSON tidak valid: kunci & string wajib \"...\", tanpa koma di akhir";
}
```
*Hasil UI:* JSON tidak valid: kunci & string wajib "...\", tanpa koma di akhir

---

## Live Coding Lab 6

**Rekap dari JSON**
Olah teks JSON "dari server" menjadi tampilan, lalu ekspor balik sebagai JSON.
1. `JSON.parse` teks respon menjadi array
2. `ringkasan = [{nama, rata}]`, rata 1 desimal $\rightarrow$ `<li>Rani 86.3</li>`
3. `#ekspor` berisi `JSON.stringify(ringkasan, null, 2)`
4. `bacaJSON(teks)` mengembalikan `null` untuk teks rusak, tanpa error

```javascript
const respon = '[{"nama":"Rani", "nilai": [88,92,79]},{"nama": "Budi", "nilai": [70,65,81]},{"nama":"Citra", "nilai": [95,90,98]}]';

// TODO 1: Ubah teks JSON menjadi array JavaScript
const data = JSON.parse(respon);

// TODO 2: Buat ringkasan nama dan rata-rata nilai
const ringkasan = data.map(function(user) {
    const total = user.nilai.reduce((jumlah, n) => jumlah + n, 0);
    const rata = Math.round((total / user.nilai.length) * 10) / 10;
    return {
        nama: user.nama,
        rata: rata
    };
});

// Tampilkan setiap ringkasan sebagai <li>
const daftar = document.querySelector("#daftar");
ringkasan.forEach(function(user) {
    daftar.insertAdjacentHTML("beforeend", `<li>${user.nama} ${user.rata}</li>`);
});

// TODO 3: Ekspor ringkasan sebagai JSON rapi
document.querySelector("#ekspor").textContent = JSON.stringify(ringkasan, null, 2);

// TODO 4: Parse JSON dengan aman
function bacaJSON(teks) {
    try {
        return JSON.parse(teks);
    } catch (err) {
        return null;
    }
}
```

---

## Fetch: Mengambil data [ GET ]

`fetch()` adalah cara JavaScript meminta data dari server tanpa harus me-refresh seluruh halaman.

```javascript
async function muatMahasiswa() {
    const res = await fetch("/api/mahasiswa");
    const data = await res.json();
    console.log(data);
}
muatMahasiswa();
```

**Penjelasan per bagian:**
* `async function muatMahasiswa()` bikin fungsi yang bisa pake `await`.
* `fetch("/api/mahasiswa")` meminta data mahasiswa ke server.
* `await` menunggu sampai hasilnya tersedia sebelum lanjut.
* `res` menyimpan jawaban awal dari server, termasuk status respons.
* `res.json()` membaca isi jawaban dan mengubah JSON menjadi data JavaScript.
* `data` menyimpan data mahasiswa yang sudah bisa digunakan.

> Kenapa ada dua `await`? Karena prosesnya dua tahap: menerima jawaban server, lalu membaca isi jawabannya.

### Apa itu res.ok dan res.status?
Misalnya server menjawab:
```javascript
console.log(res.status); // 200
console.log(res.ok); // true
```
* `status` adalah kode jawaban server. `200` berarti berhasil, sedangkan `404` berarti data atau halaman yang diminta tidak ditemukan.
* `ok` bernilai `true` jika statusnya antara `200-299`.
* **Penting:** `fetch()` biasanya tidak otomatis error ketika server menjawab `404`. Jadi, periksa `res.ok` sendiri. Taruh kode ini setelah `fetch()`:

```javascript
if (!res.ok) {
    throw new Error("Gagal mengambil data");
}
```

### Kirim kata pencarian lewat URL, misal cari mahasiswa yang namanya rani
```javascript
const q = "Rani";
const res = await fetch(`/api/mahasiswa?q=${encodeURIComponent(q)}`);
```
* `q` menyimpan kata pencarian.
* `?q=` mengirim kata pencarian sebagai bagian URL.
* `encodeURIComponent(q)` membuat input aman untuk digunakan dalam URL, misalnya ketika mengandung spasi atau karakter khusus.

> Gunakan `textContent` untuk menampilkan teks dari API. Hindari memasukkan data dari API langsung ke `innerHTML`.
> `namaElement.textContent = data.nama;`

### Contoh dari modul
```javascript
const status = document.querySelector("#status");
const hasil = document.querySelector("#hasil");

async function muat() {
    status.textContent = "Memuat...";
    const res = await fetch("/api/mahasiswa"); // 1. request Response
    console.log("status:", res.status, "| ok:", res.ok);
    
    const data = await res.json(); // 2. baca body (juga async!)
    console.log(data);
    
    status.textContent = "1 objek diterima";
    const li = document.createElement("li");
    li.textContent = `${data.nama}, IPK ${data.ipk}`;
    hasil.replaceChildren(li);
}
muat();
console.log("fetch terkirim, halaman tetap responsif");
```

* Kalau mau filter angkatan 2023 aja, pakai ini: `/api/mahasiswa?angkatan=2023`
* Kalau mau fetch matkul, pakai ini: `/api/matkul`
* Kalau mau cari berdasarkan NRP, pakai ini dari API mahasiswa: `/api/mahasiswa/5027241003`

---

## Live Coding Lab 7

**Tabel matkul**
Ambil data dari `GET /api/matkul` dan tampilkan sebagai tabel pengganti array "hard-coded" Minggu 5.
1. `#status` "Memuat..." selama request berjalan
2. fetch $\rightarrow$ `res.json()`
3. Tiap mata kuliah $\rightarrow$ `<tr>` dengan 3 `<td>` (kode, nama, sks)
4. Total SKS ke `#total`, status "5 mata kuliah dimuat"

```javascript
const status = document.querySelector("#status");
const tabel = document.querySelector("#tabel");

async function muatMatkul() {
    // TODO 1: #status = "Memuat..."
    status.textContent = "Memuat...";
    
    // TODO 2: fetch("/api/matkul"), lalu baca body-nya dengan .json() (ingat: DUA kali await)
    const res = await fetch("/api/matkul");
    const data = await res.json();
    
    // TODO 3: tiap mata kuliah -> <tr><td>kode</td><td>nama</td><td>sks</td></tr>
    // buat dengan createElement + textContent, masukkan ke #tabel
    data.forEach(function(matkul) {
        const tr = document.createElement("tr");
        const tdKode = document.createElement("td");
        tdKode.textContent = matkul.kode;
        const tdNama = document.createElement("td");
        tdNama.textContent = matkul.nama;
        const tdSks = document.createElement("td");
        tdSks.textContent = matkul.sks;
        tr.append(tdKode, tdNama, tdSks);
        tabel.appendChild(tr);
    });
    
    // TODO 4: total SKS (reduce) -> #total, lalu #status = "5 mata kuliah dimuat"
    const total = data.reduce((jumlah, matkul) => jumlah + matkul.sks, 0);
    document.querySelector("#total").textContent = total;
    status.textContent = `${data.length} mata kuliah dimuat`;
}

muatMatkul();
```

---

## Status HTTP & Penanganan Error

Tau gak? `fetch()` tetep nganggep request berhasil kalau server memberikan respons, sekalipun responsnya error kayak `404` atau `500`.
Jadi, kita tangani error HTTP pakai `res.ok`:

```javascript
const res = await fetch("/api/matkul");
if (!res.ok) {
    throw new Error("Gagal mengambil data");
}
const data = await res.json();
```
* `res.ok` bernilai `true` jika status HTTP 200-299.
* `throw new Error(...)` menghentikan proses dan melempar error agar bisa ditangkap oleh `catch`.
* `res.json()` membaca respons menjadi data JavaScript, jika isinya memang JSON.

### Ini kalau kodenya dijadiin function, biar ga nulis berulang kali:
```javascript
async function ambilJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
    }
    return await res.json();
}

// Cara makenya
async function muatMatkul() {
    try {
        const data = await ambilJSON("/api/matkul");
        console.log(data);
    } catch (err) {
        console.log(err.message);
    }
}
muatMatkul();
```

### Cek res.ok sesuai modul
```javascript
const hasil = document.querySelector("#hasil");

async function cari() {
    try {
        const res = await fetch("/api/mahasiswa/5027241001");
        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log(res.status, data);
        hasil.textContent = `Nama: ${data.nama}`;
    } catch (err) {
        console.error(err.name + ": " + err.message);
        hasil.textContent = err instanceof TypeError
            ? "Tidak dapat terhubung ke server"
            : "Gagal: " + err.message;
    }
    hasil.className = "hasil gagal";
}
cari();
```

* **Kode naif kalo NRP ga ada atau format rusak:**
  * Di UI: 'undefined'
  * Di console: 404 not found kalau NRP ga ada dan 500 internal server error kalau ga sesuai format
  * Kalau offline: 'Failed to fetch'

* **Kode yang pakai res.ok kalo NRP ga ada atau format rusak:**
  * Di UI: `Gagal: Mahasiswa dengan NRP 9999999999 tidak ditemukan` atau `Gagal: Internal Server Error`
  * Di console: `Error: Mahasiswa dengan NRP 9999999999 tidak ditemukan` atau `Error: Internal Server Error (endpoint ini memang selalu gagal)`
  * Kalau offline: Di UI `'Tidak dapat terhubung ke server'`, Di console `'TypeError: Failed to fetch'`

---

## Live Coding Lab 8

**Helper ambilJSON**
Buat helper yang dipakai di seluruh sisa semester: mengubah status HTTP gagal menjadi error yang jelas.
1. `ambilJSON(url)`: jika `!res.ok` $\rightarrow$ throw Error berisi `body.error` + `err.status`
2. Jika ok kembalikan data JSON
3. Klik Cari: sukses $\rightarrow$ "Citra Lestari angkatan 2024"
4. Error HTTP $\rightarrow$ pesan server; offline (`TypeError`) $\rightarrow$ "Tidak dapat terhubung ke server"

```javascript
async function ambilJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.json();
        const err = new Error(body.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return await res.json();
}

const pesan = document.querySelector("#pesan");
document.querySelector("#cari").addEventListener("click", async function() {
    const nrp = document.querySelector("#nrp").value.trim();
    pesan.className = "pesan";
    pesan.textContent = "Mencari...";
    
    try {
        const data = await ambilJSON(`/api/mahasiswa/${nrp}`);
        pesan.textContent = `${data.nama}, angkatan ${data.angkatan}`;
    } catch (err) {
        pesan.textContent = err instanceof TypeError
            ? "Tidak dapat terhubung ke server"
            : err.message;
        pesan.className = "pesan error";
    }
});
```

---

## Mengirim data: POST, PATCH, DELETE

`fetch()` bukan cuma buat mengambil data, tetapi juga bisa buat menambah, mengubah, dan menghapus data.

### Kirim data pakai POST
```javascript
const res = await fetch("/api/matkul", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        kode: "IF101",
        nama: "Pemrograman",
        sks: 3
    })
});
const data = await res.json();
console.log(data);
```

### Ubah data pakai PUT atau PATCH
```javascript
await fetch("/api/matkul/1", {
    method: "PATCH",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ sks: 4 })
});
```

### Hapus data pakai DELETE
```javascript
await fetch("/api/matkul/1", {
    method: "DELETE"
});
```
`204 No Content` artinya operasi berhasil tapi ga ada isi, jadi **ga boleh pake .res.json()**.

```javascript
const res = await fetch("/api/matkul/1", {
    method: "DELETE"
});
if (res.status === 204) {
    console.log("Berhasil dihapus");
}
```
> Kalau responsnya `204`, jangan panggil `res.json()` karena tidak ada body JSON yang bisa dibaca.

> Kenapa tombol dinonaktifkan selama request? 
> *Supaya pengguna tidak mengklik tombol berkali-kali sebelum request pertama selesai.*

```javascript
tombol.disabled = true;
try {
    const res = await fetch("/api/matkul");
} finally {
    tombol.disabled = false;
}
```

### Contoh di modul
```javascript
const form = document.querySelector("#form");
const pesan = document.querySelector("#pesan");

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const data = { 
        nama: form.elements.nama.value, 
        nrp: form.elements.nrp.value 
    };
    
    const res = await fetch("/api/mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    
    const body = await res.json();
    console.log(res.status, body);
    
    pesan.className = res.ok ? "pesan ok" : "pesan error";
    pesan.textContent = res.ok
        ? `✔ ${res.status} Created: ${body.nama} (angkatan ${body.angkatan})`
        : `❌ ${res.status}: ${body.error}`;
});
```

* **Kode error kalau:**
  * Lupa header & lupa stringify: `400`
  * Post nilai yang udah ada: `409`
  * Delete: `204 No content` setelah penghapusan
  * `404 not found` kalau NRP nya dicari lagi

---

## Live Coding Lab 9

**Form tambah mahasiswa**
Daftar awal sudah dimuat (GET). Lengkapi pengiriman data baru ke server.
1. Saat submit: tombol nonaktif, teks "Mengirim..."
2. `POST /api/mahasiswa` dengan header & body JSON
3. `201` $\rightarrow$ tambah ke daftar, `form.reset()`, "Tersimpan: <nama>"; gagal $\rightarrow$ `body.error` ber-class error
4. finally: tombol aktif lagi, teks "Tambah"

```javascript
const form = document.querySelector("#form");
const tombol = document.querySelector("#kirim");
const pesan = document.querySelector("#pesan");
const daftar = document.querySelector("#daftar");

function tambahKeDaftar(m) {
    const li = document.createElement("li");
    li.textContent = `${m.nama} ${m.nrp}`;
    daftar.append(li);
}

// Sudah jadi: memuat daftar awal (GET)
async function muatAwal() {
    const res = await fetch("/api/mahasiswa");
    const data = await res.json();
    data.forEach(tambahKeDaftar);
}
muatAwal();

form.addEventListener("submit", async function(e) {
    e.preventDefault();
    const data = {
        nama: form.elements.nama.value.trim(),
        nrp: form.elements.nrp.value.trim()
    };
    
    // TODO 1: nonaktifkan tombol & ubah teksnya menjadi "Mengirim..."
    tombol.disabled = true;
    tombol.textContent = "Mengirim...";
    pesan.textContent = "";
    pesan.className = "";
    
    try {
        // TODO 2: kirim POST /api/mahasiswa (method, header Content-Type JSON, body JSON.stringify)
        const res = await fetch("/api/mahasiswa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        const body = await res.json();
        
        // TODO 3: res.ok (201) -> tambahKeDaftar(body), form.reset(), #pesan -> "Tersimpan: <nama>"
        // gagal -> #pesan body.error dengan class "error"
        if (res.ok) {
            tambahKeDaftar(body);
            form.reset();
            pesan.textContent = `Tersimpan: ${body.nama}`;
        } else {
            pesan.textContent = body.error;
            pesan.className = "error";
        }
    } catch (err) {
        pesan.textContent = "Terjadi kesalahan jaringan";
        pesan.className = "error";
    } finally {
        // TODO 4: apa pun hasilnya -> tombol aktif lagi, teks kembali "Tambah" (petunjuk: try...finally)
        tombol.disabled = false;
        tombol.textContent = "Tambah";
    }
});
```

---

## Sekuensial vs Paralel

* **Sekuensial:** Request kedua baru dimulai setelah request pertama selesai. Cocok kalau request kedua membutuhkan hasil dari request pertama.
```javascript
const mahasiswa = await fetch("/api/mahasiswa");
const matkul = await fetch("/api/matkul");
```

* **Parallel:** Kedua request dimulai bersamaan, lalu program menunggu keduanya selesai. Cocok kalau keduanya tidak saling bergantung.
```javascript
const [mhs, matkul] = await Promise.all([
    fetch("/api/mahasiswa"),
    fetch("/api/matkul")
]);
```

* `Promise.all()` itu harus berhasil semua. Satu gagal, gagal semua.
* `Promise.allSettled()` itu tunggu semuanya. Satu gagal tetap dapat status tiap pesanan. Hasilnya bisa "fulfilled" (berhasil) atau "rejected" (gagal).
* `Promise.race()` mengambil hasil yang selesai duluan, baik berhasil maupun gagal.
* `Promise.any()` mengambil hasil yang sukses duluan.

```javascript
await Promise.all([pesanA(), pesanB(), pesanC()]);
await Promise.allSettled([pesanA(), pesanB(), pesanC()]);
await Promise.race([pesanA(), pesanB()]);
await Promise.any([pesanA(), pesanB()]);
```

*Kalau keduanya ga saling bergantung, pakai `Promise.all`:*
```javascript
const [profil, produk] = await Promise.all([
    fetch("/api/profil"),
    fetch("/api/produk")
]);
```

*Tapi kalau ini harus sekuensial:*
```javascript
const mhs = await fetchMahasiswa();
const nilai = await fetchNilai(mhs.nrp); // karena di sini kita butuh hasil fetch mahasiswa dulu
```

### Ini kode yang di modul
```javascript
async function ambil(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
    return res.json();
}

const isi = (id, v) => document.querySelector(id).textContent = v;

async function main() {
    const t0 = performance.now();
    const hasil = await Promise.allSettled([
        ambil("/api/mahasiswa"),
        ambil("/api/matkul"),
        ambil("/api/rusak")
    ]);
    
    console.log(hasil.map(h => h.status));
    const [mhs, mk, info] = hasil.map(h => h.status === "fulfilled" ? h.value.length : "A");
    
    isi("#mhs", mhs); 
    isi("#mk", mk); 
    isi("#info", info);
    isi("#waktu", `selesai dalam ${Math.round(performance.now() - t0)} ms`);
}
main();
```

---

## Live Coding Lab 10

**Dashboard paralel**
Kode awal benar tapi berurutan. Percepat, lalu buat tahan terhadap satu endpoint yang gagal.
1. Mulai ketiga request bersamaan (`Promise.all`)
2. Ganti ke `Promise.allSettled`
3. Kartu yang gagal menampilkan "gagal", kartu lain tetap terisi
4. `muatDashboard()` tidak boleh melempar error

### Template Soal
```javascript
async function ambil(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
    return res.json();
}

function isi(id, nilai) {
    document.querySelector(id).textContent = nilai;
}

// Versi sekuensial: BENAR, tapi lambat tiap request menunggu request sebelumnya.
// Lihat waterfall di tab Network: tiga batang berurutan seperti tangga.
async function muatDashboard() {
    const t0 = performance.now();
    const mhs = await ambil("/api/mahasiswa");
    const mk = await ambil("/api/matkul");
    const info = await ambil("/api/pengumuman");
    
    isi("#jml-mhs", mhs.length);
    isi("#jml-mk", mk.length);
    isi("#jml-info", info.length);
    isi("#waktu", `${Math.round(performance.now() - t0)} ms`);
}
muatDashboard();
```

### Jawaban
```javascript
async function ambil(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
    return res.json();
}

function isi(id, nilai) {
    document.querySelector(id).textContent = nilai;
}

async function muatDashboard() {
    const t0 = performance.now();
    
    // TODO 1: jalankan ketiga request SECARA PARALEL (Promise.all)
    // TODO 2: ganti ke Promise.allSettled: jika SATU endpoint gagal, kartu lain tetap terisi dan kartu yang gagal menampilkan "gagal"
    const hasil = await Promise.allSettled([
        ambil("/api/mahasiswa"),
        ambil("/api/matkul"),
        ambil("/api/pengumuman")
    ]);
    
    const [mhs, mk, info] = hasil.map(h => h.status === "fulfilled" ? h.value.length : "gagal");
    
    isi("#jml-mhs", mhs);
    isi("#jml-mk", mk);
    isi("#jml-info", info);
    isi("#waktu", `${Math.round(performance.now() - t0)} ms`);
}
muatDashboard();
```

---

## Pola UI Async: Loading, Error, Debounce

Jadi halaman itu ada state: **loading**, **error**, **kosong** (kalau request tapi hasilnya kosong), dan **sukses**.

### Debounce
Artinya jangan request setiap kali mengetik. Misal kita cari kata "budi". Tanpa debounce, tiap huruf yang diketik bisa memicu request: `b`, `bu`, `bud`, `budi`. Jadi total ada empat request. Dengan debounce, kita menunggu sekitar $300$ ms setelah pengguna berhenti mengetik, baru melakukan request.

**Ini kode buat debounce:**
```javascript
let timer;
function cari(teks) {
    clearTimeout(timer);
    timer = setTimeout(() => {
        fetch(`/api/mahasiswa?q=${teks}`);
    }, 300);
}
```

**Kalau di modul, debounce itu kayak gini:**
```javascript
const input = document.querySelector("#cari");
const status = document.querySelector("#status");
const hasil = document.querySelector("#hasil");
let nomor = 0;
let timer;

input.addEventListener("input", function() {
    clearTimeout(timer);
    timer = setTimeout(() => cari(input.value), 400);
});

async function cari(q) {
    const ke = ++nomor;
    status.textContent = `Memuat... (request #${ke})`;
    const res = await fetch(`/api/mahasiswa?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    tampilkan(data, q, ke);
}

function tampilkan(data, q, ke) {
    console.log(`respons #${ke} untuk "${q}" tiba`);
    status.textContent = `${data.length} hasil untuk "${q}" (dari request #${ke})`;
    hasil.replaceChildren(...data.map(m => Object.assign(document.createElement("li"), { textContent: m.nama })));
}
```

### Race Condition
Race condition itu hasil lama menimpa hasil baru. Misal kita cari dua kata:
1. Misal kita cari "Ani", terus kirim request A, tapi internetnya lambat.
2. Terus kita cari "Budi", sampai ngetik huruf B internetnya lancar-lancar aja & salah satunya muncul nama budi.
3. Tapi tiba-tiba request A baru selesai, lalu hasil Ani menimpa hasil Budi.

**Salah satu solusinya adalah AbortController:**
```javascript
let controller;
async function cari(teks) {
    if (controller) controller.abort();
    controller = new AbortController();
    
    try {
        const res = await fetch(`/api/mahasiswa?q=${teks}`, {
            signal: controller.signal
        });
        const data = await res.json();
        console.log(data);
    } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
    }
}
```
* `controller.abort()` membatalkan request sebelumnya.
* `signal: controller.signal` menghubungkan request dengan pengontrol pembatalan.
* `AbortError` berarti request dibatalkan. Abaikan error ini karena pembatalan memang disengaja.

### Ini debounce + abort kalau di contoh modul:
```javascript
const input = document.querySelector("#cari");
const status = document.querySelector("#status");
const hasil = document.querySelector("#hasil");
let nomor = 0;
let pengendali;
let timer;

input.addEventListener("input", function() {
    clearTimeout(timer);
    timer = setTimeout(() => cari(input.value), 300);
});

async function cari(q) {
    const ke = ++nomor;
    if (pengendali) pengendali.abort(); // batalkan request lama
    pengendali = new AbortController();
    
    status.textContent = `Memuat... (request #${ke})`;
    try {
        const res = await fetch(`/api/mahasiswa?q=${encodeURIComponent(q)}`, { signal: pengendali.signal });
        const data = await res.json();
        tampilkan(data, q, ke);
    } catch (err) {
        if (err.name === "AbortError") return console.log(`request #${ke} dibatalkan`);
        status.textContent = "Gagal memuat";
    }
}

function tampilkan(data, q, ke) {
    console.log(`respons #${ke} untuk "${q}" tiba`);
    status.textContent = `${data.length} hasil untuk "${q}" (dari request #${ke})`;
    hasil.replaceChildren(...data.map(m => Object.assign(document.createElement("li"), { textContent: m.nama })));
}
```

---

## Live Coding Lab 11

**Pencarian mahasiswa**
Gabungan semua materi hari ini: state, render dengan empat keadaan, fetch dengan cek `res.ok`, debounce, dan tombol coba lagi.
1. `render()` menangani loading, error (+ tombol `#ulang`), kosong, dan sukses
2. `cari(q)`: fetch dengan `encodeURIComponent`, cek `res.ok`, isi state, `render()`
3. Debounce $300$ ms pada event input
4. `#ulang` mencari ulang dengan `state.q`

```javascript
const input = document.querySelector("#cari");
const status = document.querySelector("#status");
const hasil = document.querySelector("#hasil");
const ulang = document.querySelector("#ulang");

// Satu sumber kebenaran pola state render dari Minggu 5
const state = { status: "idle", data: [], error: null, q: "" };

function render() {
    status.className = "status";
    ulang.hidden = true;
    hasil.replaceChildren();
    
    if (state.status === "loading") {
        status.textContent = "Memuat...";
    } 
    else if (state.status === "error") {
        // TODO 1: lengkapi state lainnya:
        // "error" -> #status = "Gagal memuat: <pesan>", class "error", tombol #ulang tampil (hidden = false)
        status.textContent = `Gagal memuat: ${state.error}`;
        status.className = "error";
        ulang.hidden = false;
    } 
    else if (state.status === "success" && state.data.length === 0) {
        // "success" + data kosong -> #status = 'Tidak ada hasil untuk "<q>"'
        status.textContent = `Tidak ada hasil untuk "${state.q}"`;
    } 
    else if (state.status === "success" && state.data.length > 0) {
        // "success" + ada data -> #status = "<n> hasil", tiap nama jadi <li>
        status.textContent = `${state.data.length} hasil`;
        state.data.forEach(m => {
            const li = document.createElement("li");
            li.textContent = m.nama;
            hasil.appendChild(li);
        });
    }
}

async function cari(q) {
    state.q = q;
    state.status = "loading";
    render();
    
    // TODO 2: fetch(/api/mahasiswa?q=${encodeURIComponent(q)}), cek res.ok
    // sukses -> state.status = "success", state.data = data
    // gagal (HTTP maupun jaringan) -> state.status = "error", state.error = err.message
    // lalu render()
    try {
        const res = await fetch(`/api/mahasiswa?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        state.status = "success";
        state.data = data;
    } catch (err) {
        state.status = "error";
        state.error = err.message;
    }
    render();
}

// TODO 3: debounce -> request baru dikirim 300 ms setelah user BERHENTI mengetik
let timer;
input.addEventListener("input", function() {
    clearTimeout(timer);
    timer = setTimeout(() => cari(input.value.trim()), 300);
});

// TODO 4: klik #ulang -> cari ulang dengan state.q
ulang.addEventListener("click", function() {
    cari(state.q);
});
```