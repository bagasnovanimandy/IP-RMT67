# CORS Troubleshooting Guide

## Error: "CORS Multiple Origin Not Allowed"

Error ini terjadi ketika ada **duplikasi header** `Access-Control-Allow-Origin` dalam response HTTP.

### Penyebab Umum:

1. **Reverse Proxy (Nginx/Apache) juga menambahkan CORS header**
   - Jika menggunakan Nginx/Apache sebagai reverse proxy di AWS
   - Keduanya (Express + Reverse Proxy) menambahkan header CORS
   - Hasilnya: Multiple `Access-Control-Allow-Origin` headers

2. **Multiple CORS middleware di Express**
   - Pastikan hanya ada **satu** `app.use(cors(...))` di `app.js`

### Solusi:

#### 1. Jika menggunakan Nginx sebagai Reverse Proxy

Edit file `/etc/nginx/sites-available/default` atau konfigurasi nginx Anda:

```nginx
server {
    listen 80;
    server_name bagas14258.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # HAPUS atau COMMENT semua baris CORS di bawah ini
        # Jangan tambahkan CORS header di Nginx
        # Biarkan Express yang menangani CORS
        
        # add_header 'Access-Control-Allow-Origin' '*';  # ❌ HAPUS INI
        # add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';  # ❌ HAPUS INI
        # add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';  # ❌ HAPUS INI
    }
}
```

**PENTING:** Hanya Express yang harus menangani CORS, bukan Nginx!

#### 2. Jika menggunakan Apache sebagai Reverse Proxy

Edit file `/etc/apache2/sites-available/000-default.conf`:

```apache
<VirtualHost *:80>
    ServerName bagas14258.duckdns.org
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # HAPUS atau COMMENT semua Header set untuk CORS
    # Jangan tambahkan CORS header di Apache
    # Header set Access-Control-Allow-Origin "*"  # ❌ HAPUS INI
</VirtualHost>
```

#### 3. Verifikasi tidak ada duplikasi di Express

Pastikan di `app.js` hanya ada **satu** middleware CORS:

```javascript
// ✅ BENAR - Hanya satu middleware CORS
app.use(cors({ ... }));

// ❌ SALAH - Jangan ada duplikasi
// app.use(cors({ ... }));
// app.use(cors({ ... }));  // ❌ HAPUS INI
```

#### 4. Restart Services

Setelah memperbaiki konfigurasi:

```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart Apache (jika menggunakan)
sudo systemctl restart apache2

# Restart PM2 (Express server)
pm2 restart Phase2-GC1
```

### Testing CORS

Setelah deploy, test dengan curl:

```bash
curl -H "Origin: https://galindo-client.web.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://bagas14258.duckdns.org/api/vehicles \
     -v
```

Cek response header, harusnya hanya ada **satu** `Access-Control-Allow-Origin`:

```
< Access-Control-Allow-Origin: https://galindo-client.web.app
```

Jika ada **dua atau lebih**, berarti masih ada duplikasi.

### Domain yang Diizinkan

Domain berikut sudah dikonfigurasi di `app.js`:

- ✅ `https://galindo-client.web.app`
- ✅ `https://galindo-client.firebaseapp.com`
- ✅ `https://galindojmtransport-f87dc.web.app`
- ✅ `https://galindojmtransport-f87dc.firebaseapp.com`
- ✅ Semua domain Firebase (`*.web.app` dan `*.firebaseapp.com`)
- ✅ `http://localhost:5173` (development)
- ✅ `http://localhost:3000` (development)
- ✅ `https://bagas14258.duckdns.org`

### Logging

Server akan log origin yang diblokir:
```
⚠️ CORS blocked origin: https://example.com
```

Cek log PM2:
```bash
pm2 logs Phase2-GC1
```

