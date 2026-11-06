[รวมเอกสาร](../../README.md) | [หน้าหลักโปรเจกต์](../../../README.md)

# ติดตั้ง Git และเชื่อมต่อ GitHub บน VPS

รันบน VPS Ubuntu/Debian ด้วย user `root`

1. ติดตั้ง Git และ SSH client

   ```bash
   apt update
   apt install -y git openssh-client
   ```

2. สร้าง SSH key แบบไม่ต้องใส่รหัสตอน pull (ถ้ามี key เดิมจะใช้ของเดิม)

   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   if [ ! -f ~/.ssh/id_ed25519 ]; then
       ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -C "A0-DevTeam server deploy"
   fi
   chmod 600 ~/.ssh/id_ed25519
   cat ~/.ssh/id_ed25519.pub
   ```

3. คัดลอก public key ที่แสดง ไปวางใน GitHub → Settings → SSH and GPG keys → New SSH key → Authentication key → Add SSH key (ถ้าเพิ่มไว้แล้วให้ข้าม)

4. ทดสอบเชื่อมต่อ GitHub

   ```bash
   ssh -T git@github.com
   ```

   ครั้งแรกให้เทียบ fingerprint กับ [GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints) แล้วตอบ `yes` ถ้าตรงกัน เมื่อสำเร็จจะขึ้น `Hi ...! You've successfully authenticated...`

5. เปลี่ยน remote ของโปรเจกต์เดิม แล้ว pull

   ```bash
   cd /home/www
   git remote set-url origin git@github.com:rungrot-muangchalerm/A0-DevTeam-EJS-FrameWork.git
   git pull
   ```

   ถ้ายังไม่มีโปรเจกต์ ให้ clone แทนข้อ 5:

   ```bash
   git clone git@github.com:rungrot-muangchalerm/A0-DevTeam-EJS-FrameWork.git /home/www
   ```

6. อัปเดตงานครั้งถัดไป

   ```bash
   cd /home/www && git pull && pm2 restart all
   ```

## กรณี key เดิมยังถามรหัสทุกครั้ง

```bash
ssh-keygen -p -f ~/.ssh/id_ed25519 -N ""
chmod 600 ~/.ssh/id_ed25519
```

ใส่รหัสเดิมตอนขึ้น `Enter old passphrase` ครั้งเดียว หลังจากนี้ pull ได้โดยไม่ถามรหัส และไม่ต้องเพิ่ม key บน GitHub ใหม่

เก็บ private key `~/.ssh/id_ed25519` ไว้เฉพาะบน VPS ห้ามส่งต่อหรือใส่ใน repository
