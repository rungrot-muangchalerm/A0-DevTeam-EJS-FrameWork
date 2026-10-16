[คู่มือ Ubuntu](../README.md) | [รวมเอกสาร](../../README.md) | [หน้าหลักโปรเจกต์](../../../README.md)

# ติดตั้ง Ubuntu Local บน Windows (WSL) และตั้งค่า root

1. เปิด PowerShell แบบ Run as administrator แล้วติดตั้ง Ubuntu

   ```powershell
   wsl --install -d Ubuntu
   ```

   ถ้าระบบแจ้งให้รีสตาร์ต Windows ให้รีสตาร์ตก่อน แล้วเปิด Ubuntu จาก Start menu

2. สร้าง user เริ่มต้น เช่น `rot` แล้วตั้งรหัสผ่าน

   ```text
   Enter new UNIX username: rot
   New password:
   Retype new password:
   ```

   ตอนพิมพ์รหัสจะไม่มีตัวอักษรแสดง ใช้ชื่อ `root` ตรงนี้ไม่ได้ เพราะมีอยู่แล้ว

3. เข้า root ในหน้าต่าง Ubuntu (ใส่รหัสของ `rot` เมื่อ sudo ถาม)

   ```bash
   sudo -i
   ```

   เมื่อ prompt ลงท้ายด้วย `#` แล้ว ค่อยรันคำสั่งตั้งรหัส root:

   ```bash
   passwd root
   ```

   ตั้งรหัสใหม่ของ root สองครั้ง

4. ตั้งให้ Ubuntu เปิดด้วย root เป็นค่าเริ่มต้น

   ```bash
   nano /etc/wsl.conf
   ```

   เพิ่มข้อความนี้ (ถ้ามี `[user]` อยู่แล้ว ให้แก้ `default` ในส่วนเดิม):

   ```ini
   [user]
   default=root

   [boot]
   systemd=true
   ```

   ถ้ามี `[boot]` อยู่แล้ว ให้แก้ `systemd=true` ในส่วนเดิม

   บันทึกด้วย `Ctrl+O` → Enter → `Ctrl+X` แล้วปิดหน้าต่าง Ubuntu

5. เปิด PowerShell แล้วเริ่ม Ubuntu ใหม่

   ```powershell
   wsl --terminate Ubuntu
   wsl -d Ubuntu
   ```

6. ตรวจสอบ user ใน Ubuntu ต้องแสดง `root`

   ```bash
   whoami
   ```

ถ้าติดตั้ง Ubuntu และสร้าง `rot` ตามรูปแล้ว ให้เริ่มจากข้อ 3 ได้เลย

## ติดตั้ง SSH และ SFTP สำหรับเชื่อมต่อจาก Windows

1. รันใน Ubuntu ด้วย root

   ```bash
   apt update
   apt install -y openssh-server
   passwd root
   ```

   ตั้งรหัส root สองครั้ง (ถ้าตั้งแล้ว ข้าม `passwd root` ได้)

2. เปิดให้ root ล็อกอินด้วยรหัสผ่าน สำหรับ Ubuntu Local นี้

   ```bash
   cat > /etc/ssh/sshd_config.d/00-local-root.conf <<'EOF'
   PermitRootLogin yes
   PasswordAuthentication yes
   EOF
   ssh-keygen -A
   /usr/sbin/sshd -t && systemctl enable --now ssh
   systemctl restart ssh
   ```

3. ตรวจสอบ ต้องเห็นพอร์ต `22` กำลัง LISTEN

   ```bash
   ss -ltnp 'sport = :22'
   ```

4. เชื่อมต่อจาก Termius หรือโปรแกรมรับส่งไฟล์บน Windows

   | ช่อง | ค่า |
   |---|---|
   | Protocol | SSH สำหรับ Terminal / SFTP สำหรับส่งไฟล์ |
   | Host | `127.0.0.1` |
   | Port | `22` |
   | Username | `root` |
   | Password | รหัส root ที่ตั้งด้วย `passwd root` |

   ใช้ SFTP ผ่าน SSH ได้เลย ไม่ต้องติดตั้ง FTP server

5. ถ้ายังขึ้น `Connection refused` ให้เปิด Ubuntu ค้างไว้ แล้วตรวจบริการ

   ```bash
   systemctl status ssh --no-pager
   hostname -I
   ```

   ลองใช้ IP ของ Ubuntu ที่แสดงแทน `127.0.0.1` (IP อาจเปลี่ยนเมื่อเริ่ม WSL ใหม่)

   ถ้าขึ้นว่าไม่ได้ใช้ systemd ให้ตรวจ `[boot]` ในข้อ 4 แล้วทำข้อ 5 ของส่วนติดตั้ง Ubuntu อีกครั้ง

## ลบ Ubuntu ออกจาก WSL

คำสั่งนี้จะลบ Ubuntu พร้อมไฟล์และข้อมูลภายในถาวร ให้สำรองงานก่อนลบ

1. เปิด PowerShell หรือ Command Prompt แล้วตรวจชื่อที่ติดตั้ง

   ```powershell
   wsl --list --verbose
   ```

2. หยุดและลบ Ubuntu (ถ้าชื่อเป็นอย่างอื่น เช่น `Ubuntu-24.04` ให้ใช้ชื่อนั้นแทน)

   ```powershell
   wsl --terminate Ubuntu
   wsl --unregister Ubuntu
   ```

3. ตรวจสอบหลังลบ

   ```powershell
   wsl --list --verbose
   ```

   ถ้าไม่มี Linux ตัวอื่น จะขึ้น `Windows Subsystem for Linux has no installed distributions.`

4. ถ้ามีแอป Ubuntu เหลืออยู่ ให้ไปที่ Settings → Apps → Installed apps → Ubuntu → Uninstall

ขั้นตอนนี้ลบเฉพาะ Ubuntu ส่วน WSL ยังอยู่บน Windows

อ้างอิง: [ติดตั้ง WSL](https://learn.microsoft.com/en-us/windows/wsl/install), [ตั้งค่า user เริ่มต้น](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#user-settings), [คำสั่ง WSL](https://learn.microsoft.com/en-us/windows/wsl/basic-commands)
