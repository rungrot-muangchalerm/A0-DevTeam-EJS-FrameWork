[รวมเอกสาร](../README.md) | [หน้าหลักโปรเจกต์](../../README.md)

# Project Structure

```text
project-root/
├─ app/
│  ├─ config/
│  │  └─ mysqli.config.js    # MySQL pool (mysql2)
│  ├─ controller/
│  │  └─ user.controller.js
│  ├─ data/
│  ├─ middleware/
│  │  └─ jwt.middleware.js   # JWT verify, authenticate, role, revoke
│  ├─ model/
│  └─ routes/
│     ├─ api/
│     │  ├─ api.routes.js
│     │  └─ user/
│     │     └─ user.routes.js
│     ├─ frontend/
│     │  └─ frontend.routes.js
│     └─ router.js
├─ assets/
├─ docs/
│  └─ framework/             # เอกสาร framework
├─ tools/
│  ├─ live_server.js
│  └─ scripts/
├─ views/
│  ├─ components/
│  ├─ layouts/
│  │  └─ main.layout.ejs
│  └─ page/
│     ├─ index.ejs
│     └─ 404.ejs
├─ example.env
├─ index.js
├─ package.json
└─ README.md
```
