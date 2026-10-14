# ติดตั้ง Git และตั้งค่า SSH key บนเซิร์ฟเวอร์

คู่มือนี้ใช้กับเซิร์ฟเวอร์ Ubuntu/Debian ที่ล็อกอินเป็น `root` และ repository `rungrot-muangchalerm/A0-DevTeam-EJS-FrameWork` บน GitHub คำสั่งในข้อ 1–3 ให้รันบนเซิร์ฟเวอร์ใน shell ของ `root` โดย `~/.ssh` จะหมายถึง `/root/.ssh`

## 1. ติดตั้ง Git และ SSH client บนเซิร์ฟเวอร์

```bash
apt update
apt install -y git openssh-client
git --version
ssh -V
```

## 2. สร้าง SSH key บนเซิร์ฟเวอร์สำหรับ GitHub

ตรวจสอบก่อนว่ามีไฟล์ชื่อนี้อยู่แล้วหรือไม่ ถ้ามี ให้ใช้ key เดิมหรือเลือกชื่อใหม่เพื่อไม่ให้ทับ key ที่ใช้งานอยู่ สำหรับเซิร์ฟเวอร์คนละเครื่อง ให้สร้างคู่ key ใหม่บนเครื่องนั้นและเพิ่ม public key เป็น Authentication key อีกรายการในบัญชี GitHub ไม่ต้องนำ private key จากเครื่องอื่นมาใช้ร่วมกัน

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
ls -la ~/.ssh
ssh-keygen -t ed25519 -f ~/.ssh/github_a0_devteam -C "A0-DevTeam server deploy"
chmod 600 ~/.ssh/github_a0_devteam
cat ~/.ssh/github_a0_devteam.pub
```

`ssh-keygen` จะถาม passphrase หากต้องดึงโค้ดอัตโนมัติโดยไม่มีคนกรอก สามารถกด Enter เพื่อเว้นว่างได้ แต่ต้องจำกัดสิทธิ์เข้าถึงบัญชีบนเซิร์ฟเวอร์และไฟล์ private key ให้ดี คัดลอกเฉพาะข้อความจากไฟล์ `.pub` ไปยัง GitHub ห้ามนำไฟล์ `~/.ssh/github_a0_devteam` ไปใส่ใน repository หรือส่งให้ผู้อื่น

ใน GitHub ให้เปิด **Settings ของบัญชี → SSH and GPG keys → New SSH key** ตั้งชื่อและเลือก **Authentication key** แล้ววาง public key ที่คัดลอกมา หาก key นี้มีอยู่ในรายการแล้ว ไม่ต้องเพิ่มซ้ำ เพราะ GitHub ไม่รับ public key เดิมเป็นรายการใหม่

## 3. ผูก key กับ Git และตรวจสอบการเชื่อมต่อ

เปิด `~/.ssh/config` บนเซิร์ฟเวอร์:

```bash
nano ~/.ssh/config
```

เพิ่มรายการนี้ (หากมี config อยู่แล้ว ให้เพิ่มต่อท้าย):

```sshconfig
Host github-a0-devteam
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_a0_devteam
    IdentitiesOnly yes
```

```bash
chmod 600 ~/.ssh/config
ssh -T git@github-a0-devteam
```

ครั้งแรกที่เชื่อมต่อ SSH จะให้ยืนยัน host key ของ GitHub ให้เทียบ fingerprint กับ [รายการทางการของ GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints) ก่อนตอบ `yes` เมื่อยืนยันตัวตนสำเร็จ GitHub จะแสดงข้อความต้อนรับ แต่คำสั่ง `ssh -T` อาจจบด้วย exit code 1 เพราะ GitHub ไม่มี shell ให้ใช้งาน

ทดสอบสิทธิ์อ่าน repository แล้ว clone ด้วย URL แบบ SSH ที่ใช้ host alias นี้:

```bash
git ls-remote git@github-a0-devteam:rungrot-muangchalerm/A0-DevTeam-EJS-FrameWork.git HEAD
git clone git@github-a0-devteam:rungrot-muangchalerm/A0-DevTeam-EJS-FrameWork.git
```

หาก clone ไว้แล้วด้วย HTTPS ให้เปลี่ยน `origin` ภายในโฟลเดอร์ repository เดิมก่อนดึงโค้ด:

```bash
git remote set-url origin git@github-a0-devteam:rungrot-muangchalerm/A0-DevTeam-EJS-FrameWork.git
git remote -v
git fetch origin
```

SSH key ที่ผูกกับบัญชี GitHub ใช้สิทธิ์เข้าถึง repository ตามสิทธิ์ของบัญชีนั้น

## 4. ตั้ง key สำหรับ SSH จากเครื่องส่วนตัวเข้าเซิร์ฟเวอร์ (กรณีที่ยังไม่ได้ตั้ง)

Key ชุดนี้ใช้ล็อกอิน **เครื่องส่วนตัว → เซิร์ฟเวอร์** คนละชุดกับ key ในข้อ 2 ซึ่งใช้ **เซิร์ฟเวอร์ → GitHub** สร้าง key บนเครื่องส่วนตัว ไม่ใช่บนเซิร์ฟเวอร์:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/server_login -C "login to server"
```

ถ้าเครื่องส่วนตัวเป็น Linux/macOS ให้ติดตั้ง public key สำหรับล็อกอินเป็น `root` บนเซิร์ฟเวอร์:

```bash
ssh-copy-id -i ~/.ssh/server_login.pub root@<server-ip>
ssh -i ~/.ssh/server_login root@<server-ip>
```

ถ้าเครื่องส่วนตัวเป็น Windows PowerShell ให้สร้าง key และแสดง public key:

```powershell
ssh-keygen -t ed25519 -f "$HOME\.ssh\server_login" -C "login to server"
Get-Content "$HOME\.ssh\server_login.pub"
```

บนเซิร์ฟเวอร์ ให้คัดลอกบรรทัด public key ที่แสดงไป **ต่อท้าย** ไฟล์ `/root/.ssh/authorized_keys` (อย่าลบ key เดิม):

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

จาก PowerShell ทดสอบว่าเข้าเซิร์ฟเวอร์ด้วย key ได้:

```powershell
ssh -i "$HOME\.ssh\server_login" root@<server-ip>
```

## อ้างอิง

- [Ubuntu: ติดตั้ง Git และสร้าง SSH key](https://ubuntu.com/developers/docs/explanation/use-vcs/)
- [Ubuntu Server: ตั้งค่า SSH key สำหรับล็อกอิน](https://ubuntu.com/server/docs/how-to/security/openssh-server/)
- [GitHub: เพิ่ม SSH key ให้บัญชี](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account)
- [GitHub: ทดสอบการเชื่อมต่อ SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection)
