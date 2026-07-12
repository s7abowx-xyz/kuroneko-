# KuroNeko API — نسخة معرّبة مع نظام حسابات حقيقي

## ما الجديد بهذي النسخة

- **إنشاء حساب وتسجيل دخول حقيقي** (بريد + كلمة مرور، مشفّرة بـ bcrypt)
- **مفتاح API خاص لكل مستخدم** — يتولّد تلقائياً عند التسجيل، يظهر بصفحة `/account` مع إمكانية النسخ والتجديد
- **بوابة حماية من البوتات** في `/verify` (proof-of-work، شبيهة بشاشة Cloudflare) — **مفعّلة افتراضياً**
- **Cloudflare Turnstile** مدمج داخل فورم الدخول والتسجيل
- **مساعد AI حقيقي** في `/api/ai/kuroneko` يستخدم Claude/GPT/Gemini الرسميين بدل سكرابر غير رسمي
- **ترجمة كاملة** لواجهات الحساب والتوثيق للعربية

### استخدام مفتاح API
كل نقاط الوصول تحت تصنيفات `maker`, `random`, `tools`, `download`, `search` تتطلب مفتاح API صالح:
```
GET /api/tools/ssweb?url=https://example.com&apikey=api-xxxxxxxx
```
أو عبر الهيدر:
```
x-api-key: api-xxxxxxxx
```
مسارات `auth` (تسجيل/دخول) و`ai` (يعتمد على تسجيل الدخول بالجلسة) مستثناة من هذا الشرط.

### تحديث قاعدة بيانات موجودة مسبقاً
لو عندك مستخدمين مسجّلين بالفعل وتبي تضيف ميزتي المتجر والدعم الفني، شغّل هذي الأوامر **كل واحد لحاله** بمحرر SQL بتاع Neon:

```sql
CREATE TYPE "Plan" AS ENUM ('FREE', 'PRO');
```
```sql
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'CLOSED');
```
```sql
ALTER TABLE "users" ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE';
```
```sql
ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT;
```
```sql
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
```
```sql
CREATE TABLE "tickets" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "subject" TEXT NOT NULL, "status" "TicketStatus" NOT NULL DEFAULT 'OPEN', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "tickets_pkey" PRIMARY KEY ("id"));
```
```sql
CREATE TABLE "ticket_messages" ("id" TEXT NOT NULL, "ticketId" TEXT NOT NULL, "senderId" TEXT NOT NULL, "body" TEXT NOT NULL, "isAdmin" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id"));
```
```sql
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
```
```sql
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE;
```
```sql
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE;
```

### المتجر والاشتراكات (`/store`)
اشتراك حقيقي عبر **Stripe** (شهري، PRO). يحتاج:
1. حساب Stripe → أنشئ **Product** بسعر شهري متكرر → انسخ الـ Price ID
2. من Developers → API Keys → انسخ الـ Secret Key
3. من Developers → Webhooks → أضف endpoint: `{APP_URL}/api/webhooks/stripe`، استمع لـ `checkout.session.completed` و`customer.subscription.deleted` → انسخ الـ Signing Secret
4. حط الثلاثة بالـ `.env`: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

### الدعم الفني (`/tickets`)
نظام تذاكر حقيقي: المستخدم يفتح تذكرة، يقدر يرد عليها، والمسؤول (role = ADMIN) يشوف كل التذاكر ويرد عليها من نفس الواجهة.

### الشروط والأحكام (`/terms`)
صفحة ثابتة بشروط استخدام عامة — عدّل نصها من `public/terms.html` حسب احتياجك.

### Spotify (بحث وتحميل منفصلين)
يستخدم **Spotify Web API الرسمي** فقط — يرجع اسم الأغنية، الفنان، الغلاف، ورابط **معاينة رسمية 30 ثانية** (لو متوفرة). لا يوجد ولن يُضاف تحميل للملف الكامل، لأن ذلك يتطلب تجاوز حماية Spotify وينتهك حقوق النشر.

احصل على `SPOTIFY_CLIENT_ID` و`SPOTIFY_CLIENT_SECRET` مجاناً من [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)، وضعهما بالـ `.env`.

```
GET /api/search/spotify?q=Blinding Lights&apikey=api-xxxxxxxx
GET /api/download/spotify?url=https://open.spotify.com/track/xxxxx&apikey=api-xxxxxxxx
```

## الإعداد السريع

```bash
npm install
cp .env.example .env   # واملأ القيم
npx prisma db push     # ينشئ جدول المستخدمين بقاعدة البيانات
npm run dev
```

بعدها افتح:
- `/` الصفحة الرئيسية (تتطلب تسجيل دخول)
- `/register` و `/login` لإنشاء حساب وتسجيل الدخول
- `/account` لعرض بيانات حسابك
- `/docs` توثيق كل نقاط الوصول

### بوابة الحماية من البوتات
مفعّلة افتراضياً (`ENABLE_BOT_CHECK="true"` بالـ `.env.example`). كل صفحات الموقع (عدا الـ API نفسه) تتطلب اجتياز تحدي أمني قبل الدخول. لتعطيلها مؤقتاً أثناء التطوير، خلها `"false"`.

### تفعيل مساعد AI
حط مفتاح واحد على الأقل بالـ `.env`:
```
ANTHROPIC_API_KEY="..."
```
واستدعِ `/api/ai/kuroneko?q=مرحبا&provider=anthropic`

---

## التوثيق الأصلي (بالإنجليزية)


**Simple, Fast, and Dynamic REST API Base built with Express & TypeScript.**

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white" alt="PM2" />
  <img src="https://img.shields.io/badge/VPS_Ready-107C10?style=for-the-badge&logo=windows-terminal&logoColor=white" alt="VPS" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

[Demo Website](https://your-demo-link.com) • [Rest Api](https://your-api-link.com) • [Bug Report](https://github.com/DanzzAraAra/kuroneko-base-api/issues)

</div>

---

## 📖 Introduction

**KuroNeko API** adalah template dasar (boilerplate) untuk membuat REST API yang modern, rapi, dan mudah dikembangkan.

Project ini dirancang untuk mengatasi kerumitan setup awal dengan menyediakan fitur **Auto-Load Router** berbasis konfigurasi JSON, penghitung pengunjung (visitor counter), dan antarmuka dokumentasi (Docs UI) yang estetik secara otomatis.

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
| :--- | :--- |
| 🚀 **TypeScript** | Coding lebih aman, rapi, dan minim bug dengan static typing. |
| ⚙️ **Dynamic Routing** | Tambah endpoint via `src/config.json` tanpa perlu mengubah `index.ts`. |
| 📖 **Auto Docs** | Halaman `/docs` otomatis tergenerate berdasarkan config yang dibuat. |
| 🎨 **Modern UI** | Tampilan Landing page & Docs yang bersih, modern, dan responsif. |
| 📊 **Visitor Counter** | Database JSON sederhana untuk melacak traffic API. |
| 📂 **Modular Structure** | Susunan folder dikelompokkan rapi berdasarkan kategori. |
| 🔧 **Build System** | Script otomatis untuk kompilasi TypeScript ke JavaScript (Production Ready). |

---

## 📂 Project Structure

Struktur folder disusun agar mudah dipahami dan dimodifikasi:

```txt
.
├── index.ts                   # Entry point utama server
├── dist/                      # Compiled JavaScript files (Production)
│   ├── index.js               # Compiled main server file
│   ├── src/                   # Compiled source files & configs
│   └── router/                # Compiled route handlers
├── public/                    # Frontend files
│   ├── 404.html
│   ├── docs.html              # Halaman docs API
│   ├── landing.html           # Halaman utama
│   └── ...
├── router/                    # Folder Endpoint (Kategori - TypeScript)
│   ├── ai/
│   ├── download/
│   ├── maker/
│   ├── random/
│   ├── search/
│   └── tools/
├── src/                       # Source files & Logic
│   ├── autoload.ts            # Logic auto load router
│   ├── config.json            # Configuration router
│   ├── logger.ts
│   └── ...
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
└── vercel.json                # Vercel deployment config
```

📦 Build System & Folder dist/
Apa itu Folder dist/?
dist/ (singkatan dari distribution) adalah folder yang berisi hasil kompilasi kode dari TypeScript menjadi JavaScript. Folder ini penting karena:
 * Runtime: Node.js hanya bisa menjalankan JavaScript, bukan TypeScript secara langsung.
 * Performance: Kode yang dikompilasi lebih optimal untuk production.
 * Deploy: Folder ini yang akan dijalankan di server.
Perbandingan Mode
| Mode | Command | Folder | Keterangan |
|---|---|---|---|
| Development | npm run dev | Memory | Langsung jalankan TS dengan ts-node (Hot Reload). |
| Production | npm run build + npm start | dist/ | Kompilasi TS ke JS dulu, lalu jalankan file JS. |
🛠️ Installation & Running
Pastikan kamu sudah menginstall Node.js (versi 18 atau lebih baru).
1. Clone & Install
```bash
git clone [https://github.com/DanzzAraAra/kuroneko-base-api.git](https://github.com/DanzzAraAra/kuroneko-base-api.git)
cd kuroneko-base-api
npm install
```

3. Mode Development
Gunakan ini saat sedang mengedit kode. Server akan restart otomatis jika ada perubahan file.
```bash
npm run dev
```

> Server berjalan di: http://localhost:3000
> 
3. Build untuk Production
Gunakan ini sebelum upload ke server hosting/VPS.
```bash
npm run build
```

Script ini akan membersihkan folder dist/, mengkompilasi TS ke JS, dan menyalin file asset (html, json, gambar).
4. Jalankan Production
```bash
npm start
```

📝 Scripts Reference
Berikut adalah penjelasan script yang ada di package.json:
```json
{
  "scripts": {
    "clean": "rm -rf dist",                // Hapus folder build lama
    "build": "tsc && npm run copy-assets", // Compile TS & copy file pendukung
    "copy-assets": "...",                  // Copy .json, .jpg, dan public folder ke dist
    "start": "node dist/index.js",         // Jalankan mode Production (JS)
    "dev": "ts-node index.ts",             // Jalankan mode Development (TS)
    "pm2": "pm2 start index.ts ...",       // Jalankan di background (Support TypeScript langsung)
  }
}
```

⚡ Adding a New Endpoint
Kamu tidak perlu mengedit index.ts! Cukup ikuti 3 langkah ini:
Step 1: Daftarkan di src/config.json
Buka file src/config.json dan tambahkan metadata endpoint kamu di dalam object "tags".
```json
{
  "tags": {
    "games": [
      {
        "name": "Tebak Gambar",          // Judul di Docs
        "endpoint": "/api/games/tebak",  // URL Path
        "filename": "tebak",             // Nama file logic (tanpa .ts)
        "method": "GET",                 // Method HTTP
        "params": [                      // Parameter (muncul di Docs)
          {
            "name": "level",
            "required": true,
            "description": "1-100"
          }
        ]
      }
    ]
  }
}
```

Step 2: Buat Logic File
Buat file TypeScript sesuai struktur folder kategori di router/.
 * Kategori: games
 * Filename: tebak.ts
 * Path: router/games/tebak.ts
<!-- end list -->
```typescript
import { Request, Response } from 'express';

export default async function (req: Request, res: Response) {
    // 1. Ambil parameter
    const { level } = req.query;

    // 2. Validasi
    if (!level) return res.json({ status: false, message: "Level required!" });

    // 3. Logic & Response
    res.json({
        status: true,
        result: {
            message: `Kamu memilih level ${level}`,
            image: "[https://example.com/img.jpg](https://example.com/img.jpg)"
        }
    });
};
```

Step 3: Test
Jika mode dev, cukup refresh browser. Jika mode prod, lakukan npm run build lagi. 
Endpoint baru akan otomatis muncul di halaman /docs.
Deployment
Option A: Vercel (Recommended)

 * Push kode ke GitHub.
 * Import repository ke Vercel.
 * Vercel akan otomatis mendeteksi vercel.json dan melakukan build.

Option B: VPS / Panel

 * Build project di komputer lokal atau di server:
```bash
   npm run build
```

 * Pastikan folder dist/ sudah terbentuk.
 * Jalankan command start:
   npm start

Option C: PM2 (Process Manager)
Agar server tetap berjalan di background (VPS) walaupun terminal ditutup.
Cara Cepat (via Script):

# Jalankan PM2
```bash
npm run pm2
```

Cara Manual:
```bash
npm install -g pm2
pm2 start dist/index.js --name "kuroneko-api"
pm2 save
pm2 startup
```

🖼️ Dokumentasi UI
Project ini dilengkapi GUI bawaan:
 * / : Landing Page
 * /docs : Swagger-like documentation (Auto generated)
 * /config : Cek konfigurasi JSON
 * /donasi : Support creator page

🐛 Troubleshooting Common Issues

<details>
<summary><b>Error: "Cannot find module './src/qris'"</b></summary>

 * Penyebab: Kamu mencoba menjalankan file JS tapi belum melakukan build, atau file asset tidak tersalin.
 * Solusi: Jalankan npm run build terlebih dahulu. Cek apakah file dist/src/qris.js sudah terbentuk.

</details>
<details>
<summary><b>Error TypeScript Compilation</b></summary>

 * Solusi: Cek error log. Jika terlalu ketat, kamu bisa mematikan strict mode di tsconfig.json dengan mengubah "strict": true menjadi false. * 

</details>

<div align="center">
Created with ❤️ by Danzz
</div>
