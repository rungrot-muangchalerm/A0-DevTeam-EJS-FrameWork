# Node.js ผ่าน HTTPS ด้วย Nginx

ตัวอย่างนี้ให้ Nginx รับ HTTPS ที่ `https://banpoolvillapattaya.com/` และ `https://www.banpoolvillapattaya.com/` แล้ว proxy ไปยัง Node.js ที่ `127.0.0.1:3001`. ตั้ง DNS A record ของทั้ง `banpoolvillapattaya.com` และ `www.banpoolvillapattaya.com` ให้ชี้ไปยัง Public IPv4 ของเซิร์ฟเวอร์ก่อน

ตั้งค่าใน `.env` ของแอป:

```env
PORT=3001
LIVERELOAD=false
```

ถ้าใช้ Cloudflare ให้ตั้ง A record ของทั้งสองโดเมนเป็น **DNS only** ระหว่างขอ certificate และตรวจว่า A record ชี้ไปยัง IP ของเซิร์ฟเวอร์ ส่วน AAAA record ต้องชี้ไปยัง IPv6 ของเซิร์ฟเวอร์จริง หรือเอาออกถ้าเซิร์ฟเวอร์ไม่มี IPv6 อย่าปล่อย AAAA ชี้ไปยังปลายทางอื่น เพราะ Let’s Encrypt อาจตรวจผ่าน IPv6 แล้วได้ 404

แอป Node.js ต้อง bind เฉพาะ `127.0.0.1` ตามที่กำหนดใน `index.js`. ติดตั้ง Certbot และเปิดพอร์ต `80` ให้เข้าถึงจากอินเทอร์เน็ต จากนั้นรันคำสั่งนี้ใน Bash ในฐานะ `root` Certbot จะสร้าง certificate และ private key สำหรับโดเมนบนเซิร์ฟเวอร์ โดยไม่ต้องหยุด Nginx สคริปต์ทำงานใน subshell เพื่อไม่ให้ความผิดพลาดปิด SSH session:

```bash
(
set -e
DOMAIN=banpoolvillapattaya.com
WWW_DOMAIN=www.banpoolvillapattaya.com
CERT_DIR=/etc/letsencrypt/live/$DOMAIN
WEBROOT=/var/www/letsencrypt

mkdir -p "$WEBROOT/.well-known/acme-challenge"
tee /etc/nginx/conf.d/node.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
nginx -t
systemctl reload nginx

printf 'acme-check\n' > "$WEBROOT/.well-known/acme-challenge/test"
for host in "$DOMAIN" "$WWW_DOMAIN"; do
    if ! curl --fail --silent --show-error "http://$host/.well-known/acme-challenge/test" | grep -qx 'acme-check'; then
        echo "ACME challenge path is not reachable for $host; check DNS and Nginx routing." >&2
        exit 1
    fi
done
rm "$WEBROOT/.well-known/acme-challenge/test"

certbot certonly --webroot \
    --webroot-path "$WEBROOT" \
    --cert-name "$DOMAIN" \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --deploy-hook "systemctl reload nginx"

tee /etc/nginx/conf.d/node.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

nginx -t
systemctl reload nginx
)
```

หลังรันสำเร็จ Nginx จะ redirect HTTP ไป HTTPS และ proxy คำขอ HTTPS ไปยัง Node.js ที่ `127.0.0.1:3001` โดยไม่รีสตาร์ตแอป Node.js สคริปต์ทดสอบ ACME URL ก่อนขอ certificate และใช้ HTTP-01 ผ่าน webroot ที่ `/var/www/letsencrypt` จึงไม่ต้องหยุด Nginx ระหว่างทำงาน ต้องเปิดพอร์ต `80` จากอินเทอร์เน็ต และตรวจสอบให้ Certbot renewal timer ทำงานอยู่ หากใช้ Cloudflare ให้คง DNS เป็น DNS only เพื่อให้การต่ออายุผ่าน HTTP-01 ได้ หรือเปลี่ยนไปใช้ DNS-01 ผ่าน Cloudflare API

หลังติดตั้ง certificate และเปิดใช้ HTTPS ที่ origin แล้ว ให้ตั้ง Cloudflare ที่ **SSL/TLS → Overview → Full (strict)** อย่าใช้ **Flexible** เพราะ Cloudflare จะต่อเข้า origin ด้วย HTTP ทำให้ redirect กลับ HTTPS วนซ้ำ หากเปิดทั้ง **Always Use HTTPS** ใน Cloudflare และ redirect ใน Nginx ก็ใช้ได้เมื่อ SSL/TLS mode เป็น Full (strict)
