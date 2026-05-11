# Lost & Found Management System
## ITD110 Case Study #1

A web application for managing lost and found items within a university setting. Built with Node.js, Express, MongoDB, and EJS.

---

## ⚙️ Setup Instructions

### Step 1 — Install Node.js
Download from: https://nodejs.org (choose LTS version)
Verify: open terminal and run `node -v` and `npm -v`

### Step 2 — Install MongoDB Community Edition
- Download from your professor's link
- During install, check **"Install MongoDB as a Service"**

### Step 3 — Install MongoDB Compass
- Download from your professor's link
- Open Compass → connect with `mongodb://localhost:27017`

### Step 4 — Open in VS Code
Extract the zip → File → Open Folder → select `lostandfound`

### Step 5 — Install dependencies
Open terminal (Ctrl + `) and run:
```
npm install
```

### Step 6 — Run the app
```
npm run dev
```
You should see:
```
✅ Connected to MongoDB
🚀 Lost & Found running at http://localhost:3000
```

### Step 7 — Load sample data
Visit: http://localhost:3000/seed

This creates:
- Admin account: username `admin` / password `admin123`
- Student account: username `student1` / password `student123`
- 6 sample items (lost & found)

### Step 8 — Open in browser
http://localhost:3000

---

## 👤 User Accounts

| Role | Username | Password | Access |
|---|---|---|---|
| Admin | admin | admin123 | Full access, manage claims, items, users |
| Student | student1 | student123 | Report items, submit claims |

---

## ✅ Features

| Feature | Details |
|---|---|
| Browse & Search | Filter by type, category, status, keyword |
| Report Lost Item | Form with image upload, detailed fields |
| Report Found Item | Same form, toggled to "Found" |
| Submit Claim | Students claim found items with proof message |
| Admin Panel | Approve/reject claims, manage items, view users |
| QR Code | Every item has a scannable QR code |
| Dashboard | Charts showing items by category and status |
| JSON Backup | Download all data as .json file |
| Login / Register | Student registration + admin login |

---

## 🗂️ Project Structure

```
lostandfound/
├── server.js
├── package.json
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   ├── Item.js
│   └── Claim.js
├── routes/
│   ├── auth.js
│   ├── items.js
│   ├── claims.js
│   └── admin.js
├── views/
│   ├── _nav.ejs
│   ├── index.ejs
│   ├── dashboard.ejs
│   ├── auth/
│   │   ├── login.ejs
│   │   └── register.ejs
│   ├── items/
│   │   ├── show.ejs
│   │   ├── new.ejs
│   │   └── edit.ejs
│   └── admin/
│       ├── index.ejs
│       ├── claims.ejs
│       ├── items.ejs
│       └── users.ejs
└── public/
    ├── css/style.css
    └── uploads/   ← item photos go here
