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
   apt upgrade
   ```

3. ติดตั้ง nginx

   ```bash
   apt install nginx -y
   ```

4. สร้าง config ของ nginx, สร้างโฟลเดอร์ `/home/website` และสร้างไฟล์ `index.php`

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
    args='$args'
    uri='$uri'
    document_root='$document_root'
    fastcgi_script_name='$fastcgi_script_name'
    cat > /etc/nginx/conf.d/vps.conf <<END
   server {
       listen 80;
       server_name  127.0.0.1 localhost;
       access_log /var/log/nginx/vps-access.log;
       error_log /var/log/nginx/vps-error.log error;
       root   /home/website;
       location / {
           index  index.html index.htm index.php;
    try_files $uri $uri/ /index.php?$args;
       }
       location ~ \.php$ {
           include /etc/nginx/fastcgi_params;
           fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
           fastcgi_index index.php;
           fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
       }
   }
   END
   ```

5. ติดตั้ง certificate และ package ที่จำเป็นก่อนเพิ่ม repository

   ```bash
   apt install ca-certificates apt-transport-https software-properties-common curl lsb-release -y
   ```

6. เพิ่ม repository สำหรับ PHP 7.4 (คัดลอกทั้งชุด รันด้วย `root`)

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
       apt-cache policy php7.4-fpm
       apt-get install --simulate php7.4-fpm
   )
   ```

   ถ้าชุดคำสั่งจบโดยไม่มี error ให้ทำข้อ 7 ต่อได้เลย

7. ติดตั้ง PHP 7.4 และ extension ที่ต้องใช้

   ```bash
   apt-get install php7.4 php7.4-cli php7.4-cgi php7.4-fpm php7.4-gd php7.4-mysql php7.4-imap php7.4-curl php7.4-intl php7.4-pspell php7.4-sqlite3 php7.4-tidy php7.4-xmlrpc php7.4-xsl php7.4-zip php7.4-mbstring php7.4-soap php7.4-opcache php7.4-common php7.4-json php7.4-readline php7.4-xml -y
   ```

8. ติดตั้ง mariadb-server

   ```bash
   apt install mariadb-server -y
   ```

9. ตั้งค่าเริ่มต้นของ MariaDB (รันใน shell)

   ```bash
   mariadb-secure-installation
   ```

10. เข้า MariaDB

   ```bash
   mariadb -u root -p
   ```

11. ให้สิทธิ์ `root` ในหน้า `MariaDB>` (เปลี่ยน `<รหัสผ่านที่ตั้งเอง>` เป็นรหัสที่ต้องการก่อนรัน)

   ```sql
   GRANT ALL ON *.* TO 'root'@'localhost' IDENTIFIED BY '<รหัสผ่านที่ตั้งเอง>' WITH GRANT OPTION;
   ```

12. refresh สิทธิ์ แล้วออกจาก MariaDB

   ```sql
   FLUSH PRIVILEGES;
   exit;
   ```

13. ตรวจสอบสถานะ MariaDB หลังกลับมาเห็น prompt `root@...#`

   ```bash
   systemctl status mariadb --no-pager
   ```

14. ลง phpmyadmin

15. restart nginx

   ```bash
   service nginx restart
   ```

16. ติดตั้ง npm

   ```bash
   apt install npm -y
   ```

17. ดาวน์โหลด script setup ของ NodeSource มาก่อน

   ```bash
   curl -sL https://deb.nodesource.com/setup_23.x -o /tmp/nodesource_setup.sh
   ```

18. จากนั้นค่อยใช้คำสั่ง bash เพื่อรัน script ที่ดาวน์โหลดมา

   ```bash
   bash /tmp/nodesource_setup.sh
   ```

19. ติดตั้ง nodejs

   ```bash
   apt install nodejs -y
   ```

20. ติดตั้ง PM2

   ```bash
   npm install -g pm2
   pm2 --version
   ```
