# Zoom Meeting App Event with golang gin and next js

## Deskripsi
Dokumentasi untuk menjalankan project ini dengan Docker.

## Persyaratan
Sebelum memulai, pastikan kamu memiliki Docker dan Docker Compose yang terinstal di mesinmu.

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Menjalankan Aplikasi dengan Docker

1. **Clone repository**:
    ```bash
    git clone <URL-repository>
    cd <folder-project>
    ```

2. **Isi variabel environment**:
    Buka file `.env` pada folder project zoom-meeting-app-api dan tambahkan variabel berikut untuk integrasi dengan Zoom API:
    ```env
    ZOOM_CLIENT_ID=<isi_zoon_client_id_anda>
    ZOOM_CLIENT_SECRET=<isi_zoon_client_secret_anda>
    ```

4. **Build dan jalankan aplikasi menggunakan Docker Compose**:
    Jalankan perintah berikut untuk membuild dan menjalankan aplikasi di container:
    ```bash
    docker-compose up --build
    ```

5. **Akses aplikasi**:
    Setelah build selesai, aplikasi dapat diakses di `http://localhost:3000`.

6. **Menjalankan perintah lainnya (opsional)**:
    - Jika kamu perlu menjalankan aplikasi dalam mode background, gunakan perintah berikut:
    ```bash
    docker-compose up -d
    ```

    - Untuk menghentikan aplikasi, gunakan:
    ```bash
    docker-compose down
    ```

## Troubleshooting

Jika terjadi masalah, pastikan semua variabel environment yang diperlukan sudah diisi dengan benar. Periksa log Docker untuk detail error:
```bash
docker-compose logs