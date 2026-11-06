[คู่มือ Ubuntu](../README.md) | [รวมเอกสาร](../../README.md) | [หน้าหลักโปรเจกต์](../../../README.md)

# How to Setup server Website

## วิธีทำให้ VPS ใช้ user root ได้

\#วิธีทำ'4' ขั้นตอน \#ทำได้ทุก vps ทุก cloud

1. `nano /etc/ssh/sshd_config`
2. ลบ `without-password` ใส่ `yes` บันทึก
3. `passwd root` ตั้งรหัสใหม่
4. `/etc/init.d/ssh restart`

## Setup server Website

1. อัปเดตรายการ package ในระบบ

   ```bash
   apt update
   ```

2. อัปเกรด package ในระบบ

   ```bash
   apt upgrade -y
   ```

3. ติดตั้ง nginx

   ```bash
   apt install nginx -y
   ```

4. ติดตั้ง Certbot และขอ SSL certificate สำหรับ Public IP (ใช้ Certbot 5.3 ขึ้นไป)

   ```bash
   apt install curl snapd -y
   snap install --classic certbot
   ln -sf /snap/bin/certbot /usr/bin/certbot
   PUBLIC_IP=$(curl -4fsS https://api.ipify.org)
   certbot certonly --standalone --cert-name vps-ip --preferred-profile shortlived --ip-address "$PUBLIC_IP" --pre-hook "systemctl stop nginx" --post-hook "systemctl start nginx"
   ```

   เมื่อ Certbot ถามอีเมล ให้กรอกอีเมลหรือกด Enter เพื่อข้าม แล้วตอบ `Y` เพื่อยอมรับเงื่อนไข

5. สร้าง config ของ nginx, สร้างโฟลเดอร์ `/home/website` และสร้างไฟล์ `index.php`

   ```bash
   cat > /etc/nginx/nginx.conf <<END
   user www-data;
   worker_processes 2;
   pid /var/run/nginx.pid;
   events {
    multi_accept on;
           worker_connections 1024;
   }
   http {
    autoindex on;
           sendfile on;
           tcp_nopush on;
           tcp_nodelay on;
           keepalive_timeout 65;
           types_hash_max_size 2048;
           server_tokens off;
           include /etc/nginx/mime.types;
           default_type application/octet-stream;
           access_log /var/log/nginx/access.log;
           error_log /var/log/nginx/error.log;
           client_max_body_size 32M;
    client_header_buffer_size 8m;
    large_client_header_buffers 8 8m;
    fastcgi_buffer_size 8m;
    fastcgi_buffers 8 8m;
    fastcgi_read_timeout 600;
           include /etc/nginx/conf.d/*.conf;
   }
   END
    mkdir -p /home/website
    echo "<?php

   phpinfo();

   ?>
   " > /home/website/index.php
    PUBLIC_IP=$(curl -4fsS https://api.ipify.org)
    args='$args'
    uri='$uri'
    host='$host'
    request_uri='$request_uri'
    document_root='$document_root'
    fastcgi_script_name='$fastcgi_script_name'
    cat > /etc/nginx/conf.d/vps.conf <<END
    server {
        listen 80 default_server;
        server_name $PUBLIC_IP;
        return 301 https://$host$request_uri;
    }
    server {
        listen 443 ssl default_server;
        server_name $PUBLIC_IP;
        access_log /var/log/nginx/vps-access.log;
        error_log /var/log/nginx/vps-error.log error;
        root   /home/website;
        ssl_certificate /etc/letsencrypt/live/vps-ip/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/vps-ip/privkey.pem;
        location / {
            index  index.html index.htm index.php;
     try_files $uri $uri/ /index.php?$args;
       }
       location ~ \.php$ {
           include /etc/nginx/fastcgi_params;
           fastcgi_pass unix:/var/run/php/php8.4-fpm.sock;
           fastcgi_index index.php;
           fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
       }
   }
   END
   nginx -t && systemctl restart nginx
   ```

6. ติดตั้ง package ที่จำเป็นก่อนเพิ่ม repository

   ```bash
   apt install ca-certificates apt-transport-https software-properties-common curl lsb-release -y
   ```

7. เพิ่ม repository สำหรับ PHP 8.4 (คัดลอกทั้งชุด รันด้วย `root`)

   ```bash
   (
       set -e
       ubuntu_codename=$(lsb_release -sc)
       case "$ubuntu_codename" in
           resolute)
               curl -fSsLo /tmp/debsuryorg-archive-keyring.deb https://packages.sury.org/debsuryorg-archive-keyring.deb
               dpkg -i /tmp/debsuryorg-archive-keyring.deb
               echo "deb [signed-by=/usr/share/keyrings/debsuryorg-archive-keyring.gpg] https://packages.sury.org/php/ $ubuntu_codename main" > /etc/apt/sources.list.d/php.list
               ;;
           jammy|noble)
               add-apt-repository ppa:ondrej/php -y
               ;;
           *)
               echo "ยังไม่ได้กำหนด repository สำหรับ Ubuntu $ubuntu_codename"
               exit 1
               ;;
       esac
       apt update
       apt-cache policy php8.4-fpm
       apt-get install --simulate php8.4-fpm
   )
   ```

   ถ้าชุดคำสั่งจบโดยไม่มี error ให้ทำข้อ 8 ต่อได้เลย

8. ติดตั้ง PHP 8.4 และ extension ที่ต้องใช้

   ```bash
   apt-get install php8.4 php8.4-cli php8.4-cgi php8.4-fpm php8.4-gd php8.4-mysql php8.4-imap php8.4-curl php8.4-intl php8.4-pspell php8.4-sqlite3 php8.4-tidy php8.4-xsl php8.4-zip php8.4-mbstring php8.4-soap php8.4-opcache php8.4-common php8.4-readline php8.4-xml -y
   php8.4 -v
   ```

9. ติดตั้ง mariadb-server

   ```bash
   apt install mariadb-server -y
   ```

10. ตั้งค่าเริ่มต้นของ MariaDB (รันใน shell)

   ```bash
   mariadb-secure-installation
   ```

11. เข้า MariaDB

   ```bash
   mariadb -u root -p
   ```

12. ให้สิทธิ์ `root` ในหน้า `MariaDB>` (เปลี่ยน `<รหัสผ่านที่ตั้งเอง>` เป็นรหัสที่ต้องการก่อนรัน)

   ```sql
   GRANT ALL ON *.* TO 'root'@'localhost' IDENTIFIED BY '<รหัสผ่านที่ตั้งเอง>' WITH GRANT OPTION;
   ```

13. refresh สิทธิ์ แล้วออกจาก MariaDB

   ```sql
   FLUSH PRIVILEGES;
   exit;
   ```

14. ตรวจสอบสถานะ MariaDB หลังกลับมาเห็น prompt `root@...#`

   ```bash
   systemctl status mariadb --no-pager
   ```

15. ลง phpmyadmin

16. restart nginx

   ```bash
   service nginx restart
   ```

17. ติดตั้ง npm

   ```bash
   apt install npm -y
   ```

18. ดาวน์โหลด script setup ของ Node.js 26 LTS

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_26.x -o /tmp/nodesource_setup.sh
   ```

19. จากนั้นค่อยใช้คำสั่ง bash เพื่อรัน script ที่ดาวน์โหลดมา

   ```bash
   bash /tmp/nodesource_setup.sh
   ```

20. ติดตั้ง Node.js และตรวจสอบเวอร์ชัน

   ```bash
   apt install nodejs -y
   node -v
   ```

21. ติดตั้ง PM2

   ```bash
   npm install -g pm2
   pm2 --version
   ```
