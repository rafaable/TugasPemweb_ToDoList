# Endpoint yang bisa kalian pakai

| Endpoint | Keterangan | 
| :--- | :--- | 
| `GET` `/api/mahasiswa` | Daftar mahasiswa · filter `?q=nama`, `?angkatan=2024` | 
| `GET` `/api/mahasiswa/:nrp` | Satu mahasiswa · `404` jika tidak ada | 
| `POST` `/api/mahasiswa` | Body `{nama, nrp}` $\rightarrow$ `201` · `400` tidak valid · `409` NRP ganda | 
| `PATCH` / `DELETE` `/api/mahasiswa/:nrp` | Ubah sebagian · hapus (`204`, tanpa body) | 
| `GET` `/api/matkul` · `/api/nilai/:nrp` | Mata kuliah · nilai per mahasiswa | 
| `GET` `/api/pengumuman` | Daftar pengumuman | 
| `GET` / `POST` `/api/tugas` | Untuk Code Challenge · PATCH/DELETE `/api/tugas/:id` | 
| `GET` `/api/lambat?ms=2000` · `/api/rusak` | Sengaja lambat · selalu `500` | 

## Pakai di proyek sendiri

```html
<!-- muat SEBELUM app.js -->
<script src="https://fuaddary.github.io/Pemrograman-Web/assets/mock-api-kampus.js"></script>
<script src="app.js" defer></script>
```

## Ketik di Console DevTools

```javascript
__API.setMode("lambat")  // atau "offline", "error500"
__API.gagalkan("/api/matkul")
__API.pulihkan()
__API.reset()          // data kembali awal
```

# Sekilas: AJAX, XMLHttpRequest & CORS

**AJAX** (Asynchronous JavaScript and XML) adalah *konsep*: memperbarui sebagian halaman dengan data dari server tanpa reload. Dulu dilakukan dengan `XMLHttpRequest` dan data XML; sekarang dengan `fetch` dan JSON. Namanya tetap, teknologinya berganti.

### `XMLHttpRequest` — gaya lama berbasis event/callback

```javascript
const xhr = new XMLHttpRequest();
xhr.open("GET", "/api/matkul");
xhr.onload = function () {
    if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log(data);
    }
};
xhr.onerror = () => console.error("jaringan gagal");
xhr.send();
// masih ditemui di kode lama & jQuery $.ajax()
```

### CORS — kenapa fetch ke domain lain bisa "diblokir"

Browser hanya mengizinkan JavaScript membaca respons dari **origin lain** jika server tersebut mengirim header `Access-Control-Allow-Origin`. Error CORS adalah keputusan **browser**, bukan bug di kode fetch kalian — perbaikannya ada di sisi server (Modul 3).

```javascript
// Access to fetch at 'https://api.lain.com' from origin 
// 'http://localhost:5500' has been blocked by CORS policy
```

# Task Tracker Kuliah v2 — tersambung ke REST API

Lanjutkan Task Tracker Minggu 5: kini datanya hidup di server. Coba demo di bawah — ubah jaringan ke **Offline** atau **Lambat** untuk melihat perilaku yang diharapkan. AI boleh dipakai dengan deklarasi & log prompt; saat Asistensi kalian menjelaskan alur async kode kalian tanpa AI.

1. **Muat dari server:** `GET /api/tugas` saat halaman dibuka, dengan state loading (skeleton/teks), error + tombol coba lagi, dan kosong.

2. **Tambah:** form $\rightarrow$ `POST /api/tugas` (header & body JSON). Tombol nonaktif selama mengirim; tampilkan pesan error dari server (400).

3. **Selesai & hapus** lewat event delegation: `PATCH /api/tugas/:id` dan `DELETE /api/tugas/:id` (204). Perbarui state dari respons server, lalu `render()`.

4. **Helper** `api()` yang mengecek `res.ok` dan melempar Error berisi pesan server.

5. **Paralel:** muat tugas & daftar mata kuliah (untuk `<select>`) dengan `Promise.all`.

6. **Tahan banting:** uji dengan `__API.setMode("offline")` dan `"lambat"` — tidak ada error merah tak tertangani di Console.

* **Bonus:** pencarian dengan debounce; *optimistic update* (tampilan berubah dulu, dibatalkan jika server gagal).

**Kumpulkan:** `index.html`, `style.css`, `app.js` + Mock API (lihat slide referensi) di repo Git — minimal 5 commit bertahap (`GET` $\rightarrow$ render state $\rightarrow$ `POST` $\rightarrow$ `PATCH/DELETE` $\rightarrow$ error handling).

# Deklarasi AI & langkah berikutnya

> Jika kalian memakai AI saat mengerjakan lab maupun code challenge, sertakan **log prompt** singkat bersama submission. Kode async buatan AI sering "terlihat benar" tapi lupa `await`, lupa cek `res.ok`, atau menelan error — kalian yang bertanggung jawab mengujinya.

### Ringkasan satu kalimat per konsep

- **JavaScript satu thread:** pekerjaan lama dititipkan ke browser, hasilnya kembali lewat **antrean event loop**
- **Urutan:** kode sinkron $\rightarrow$ **microtask** (Promise) $\rightarrow$ **task** (setTimeout, event)
- `await` menjeda fungsinya saja, bukan halaman; bungkus dengan `try/catch/finally`
- `fetch` hanya reject saat jaringan gagal — **selalu cek** `res.ok`
- **Kirim JSON:** `method` + header `Content-Type` + `JSON.stringify(body)`
- **Request independen** $\rightarrow$ `Promise.all`; setiap tampilan async punya state loading, error, kosong, sukses