# phpMyAdmin ผ่าน HTTPS ด้วย Nginx

ตั้ง DNS A record ของ `phpmyadmin.banpoolvillapattaya.com` ให้ชี้ไปยัง Public IPv4 ของเซิร์ฟเวอร์ และเปิดพอร์ต `80` ให้เข้าถึงจากอินเทอร์เน็ต หากใช้ Cloudflare ให้ตั้ง record เป็น **DNS only** ระหว่างขอ certificate ส่วน AAAA record ต้องชี้ไปยัง IPv6 ของเซิร์ฟเวอร์จริง หรือเอาออกหากไม่มี IPv6 ติดตั้ง Certbot แล้วรันคำสั่งต่อไปนี้ใน Bash ในฐานะ `root` Certbot จะสร้าง certificate และ private key บนเซิร์ฟเวอร์ โดยไม่ต้องหยุด Nginx สคริปต์ทำงานใน subshell เพื่อไม่ให้ความผิดพลาดปิด SSH session:

```bash
(
set -e
DOMAIN=phpmyadmin.banpoolvillapattaya.com
PUBLIC_IP=$(curl -4fsSL https://ifconfig.me)
if ! [[ "$PUBLIC_IP" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    echo "Could not determine a valid public IPv4 address: $PUBLIC_IP" >&2
    exit 1
fi
echo "Configuring phpMyAdmin for $DOMAIN ($PUBLIC_IP)"

CERT_DIR=/etc/letsencrypt/live/$DOMAIN
WEBROOT=/var/www/letsencrypt

mkdir -p "$WEBROOT/.well-known/acme-challenge"
tee /etc/nginx/conf.d/phpmyadmin.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

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
if ! curl --fail --silent --show-error "http://$DOMAIN/.well-known/acme-challenge/test" | grep -qx 'acme-check'; then
    echo "ACME challenge path is not reachable for $DOMAIN; check DNS and Nginx routing." >&2
    exit 1
fi
rm "$WEBROOT/.well-known/acme-challenge/test"

certbot certonly --webroot \
    --webroot-path "$WEBROOT" \
    --cert-name "$DOMAIN" \
    -d "$DOMAIN" \
    --deploy-hook "systemctl reload nginx"

tee /etc/nginx/conf.d/phpmyadmin.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location ^~ /.well-known/acme-challenge/ {
        root ${WEBROOT};
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    root /home/phpMyAdmin-5.2.3-all-languages;
    index index.php;
    autoindex off;

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;

    access_log /var/log/nginx/phpmyadmin-access.log;
    error_log /var/log/nginx/phpmyadmin-error.log;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~ /\. {
        deny all;
    }

    location ~ ^/(setup|libraries|templates|vendor|test|tests)(/|$) {
        deny all;
    }

    location ~ \.php$ {
        try_files \$uri =404;
        include /etc/nginx/fastcgi_params;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.4-fpm.sock;
    }
}
EOF

nginx -t
systemctl reload nginx
)
```

จากนั้นเข้าใช้งานที่ <https://phpmyadmin.banpoolvillapattaya.com/>.

Certbot ทดสอบ ACME URL ก่อนขอ certificate และใช้ HTTP-01 ผ่าน webroot ที่ `/var/www/letsencrypt` จึงไม่ต้องหยุด Nginx ระหว่างขอหรือต่ออายุ certificate ต้องเปิดพอร์ต `80` จากอินเทอร์เน็ต และตรวจสอบให้ Certbot renewal timer ทำงานอยู่ หากใช้ Cloudflare ให้คง DNS เป็น DNS only เพื่อให้การต่ออายุผ่าน HTTP-01 ได้ หรือเปลี่ยนไปใช้ DNS-01 ผ่าน Cloudflare API

หลังติดตั้ง certificate และเปิดใช้ HTTPS ที่ origin แล้ว ให้ตั้ง Cloudflare ที่ **SSL/TLS → Overview → Full (strict)** อย่าใช้ **Flexible** เพราะ Cloudflare จะต่อเข้า origin ด้วย HTTP ทำให้ redirect กลับ HTTPS วนซ้ำ หากเปิดทั้ง **Always Use HTTPS** ใน Cloudflare และ redirect ใน Nginx ก็ใช้ได้เมื่อ SSL/TLS mode เป็น Full (strict)
