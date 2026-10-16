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

3. เข้า root และตั้งรหัสผ่าน root ในหน้าต่าง Ubuntu

   ```bash
   sudo -i
   passwd root
   ```

   ใส่รหัสของ `rot` เมื่อ sudo ถาม จากนั้นตั้งรหัสใหม่ของ root สองครั้ง

4. ตั้งให้ Ubuntu เปิดด้วย root เป็นค่าเริ่มต้น

   ```bash
   nano /etc/wsl.conf
   ```

   เพิ่มข้อความนี้ (ถ้ามี `[user]` อยู่แล้ว ให้แก้ `default` ในส่วนเดิม):

   ```ini
   [user]
   default=root
   ```

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

อ้างอิง: [ติดตั้ง WSL](https://learn.microsoft.com/en-us/windows/wsl/install), [ตั้งค่า user เริ่มต้น](https://learn.microsoft.com/en-us/windows/wsl/wsl-config#user-settings)
