# חשבונית - Heshbonit

מערכת לניהול חשבוניות, קבלות והצעות מחיר בעברית.

## 🚀 טכנולוגיות

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)
- React Query (Data Fetching)
- Recharts (Charts)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication

## 📋 תכונות

- ✅ ניהול לקוחות
- ✅ ניהול מוצרים/שירותים
- ✅ יצירת חשבוניות מס
- ✅ יצירת קבלות
- ✅ הצעות מחיר
- ✅ ייצוא PDF
- ✅ דוחות מע"מ
- ✅ דשבורד עם גרפים
- ✅ תמיכה מלאה בעברית (RTL)

## 🛠️ התקנה מקומית

### דרישות
- Node.js 18+
- PostgreSQL (או SQLite לפיתוח)

### שלבים

1. שכפל את הפרויקט:
```bash
git clone https://github.com/YOUR_USERNAME/heshbonit.git
cd heshbonit
```

2. התקן dependencies:
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

3. הגדר משתני סביבה (server):
```bash
cd server
cp .env.example .env
# ערוך את .env עם הפרטים שלך
```

4. צור את בסיס הנתונים:
```bash
cd server
npx prisma db push
```

5. הפעל את השרתים:
```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

6. פתח בדפדפן: http://localhost:5173

## ☁️ פריסה ל-Render

1. העלה את הפרויקט ל-GitHub

2. צור חשבון ב-[Render](https://render.com)

3. לחץ על "New" → "Blueprint"

4. חבר את ה-Repository מ-GitHub

5. Render יזהה את `render.yaml` ויפרוס אוטומטית:
   - PostgreSQL Database
   - Backend API
   - Frontend Static Site

### משתני סביבה (יוגדרו אוטומטית)
- `DATABASE_URL` - מוגדר אוטומטית מה-database
- `JWT_SECRET` - נוצר אוטומטית
- `VITE_API_URL` - כתובת ה-API

## 📁 מבנה הפרויקט

```
heshbonit/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── api/           # API calls
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   └── types/         # TypeScript types
│   └── ...
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   └── services/      # Business logic
│   └── prisma/            # Database schema
└── render.yaml            # Render deployment config
```

## 📄 רישיון

MIT
