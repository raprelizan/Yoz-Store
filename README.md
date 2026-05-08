# Yoz Store — Full Stack Top-up Platform

منصة ويب كاملة لإدارة عمليات شحن الهاتف (Flexy/Mobile) والإنترنت عبر OneClickDZ API، مع لوحة تحكم أدمن، نظام أرصدة، سجل عمليات، وحساب أرباح تلقائي.

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt password hashing
- Joi validation
- Helmet, CORS, rate limiting
- Central error handling + request logging
- OneClickDZ v3 integration

### Frontend
- React + Vite
- TailwindCSS
- React Router
- Axios
- Recharts dashboard charts
- RTL Arabic UI

## Key Features

### User
- تسجيل الدخول والتسجيل
- عرض الرصيد الحالي
- تنفيذ شحن هاتف عبر `/v3/mobile/send`
- تنفيذ شحن إنترنت عبر `/v3/internet/send`
- عرض سجل العمليات

### Profit System
- يدعم ربح بالنسبة المئوية مثل `10%`
- يدعم ربح ثابت مثل `50 DZD`
- يتم حفظ طريقة الربح وقيمتها والربح المحسوب داخل كل transaction

### Admin
- Dashboard cards + chart
- تعديل إعدادات API: `apiKey`, `baseUrl`, `serviceEnabled`
- تعديل التسعير: `pricingMode`, `markupPercent`, `fixedFee`
- إدارة المستخدمين: عرض، تعديل الرصيد، حظر/تفعيل
- عرض كل العمليات مع دعم فلترة Backend حسب المستخدم، النوع، الحالة، التاريخ
- التحقق من API Key

## Project Structure

```text
backend/
  src/
    config/          # MongoDB + logger
    controllers/     # Auth, admin, transactions
    middlewares/     # Auth, validation, error handler
    models/          # User, Transaction, SystemSetting
    routes/          # Express routes
    services/        # OneClickDZ provider client
    utils/           # pricing, async handler, HttpError
frontend/
  src/
    components/      # Layout and stat cards
    contexts/        # Auth context
    pages/           # Home, Login, User, Admin
    services/        # Axios client
```

## Environment

```bash
cd backend
cp .env.example .env
```

Update `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/yoz_store
JWT_SECRET=change_me_to_a_long_random_secret
ONECLICK_BASE_URL=https://api.oneclickdz.com
ONECLICK_API_KEY=your_api_key
ADMIN_EMAIL=admin@yoz.local
ADMIN_PASSWORD=Admin@12345
```

## Run Backend

```bash
cd backend
npm install
npm run dev
```

Backend URL: `http://localhost:5000`

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

Optional frontend env:

```env
VITE_API_URL=http://localhost:5000/api
```

## Main API Routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### User Transactions
- `POST /api/transactions/topup`
- `GET /api/transactions/me`
- `POST /api/transactions/:id/check-status`

### Admin
- `GET /api/admin/settings`
- `PUT /api/admin/settings`
- `GET /api/admin/validate-api`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/transactions/admin/stats`
- `GET /api/transactions/admin/all`

## Top-up Payload Examples

### Mobile

```json
{
  "type": "mobile",
  "plan_code": "PREPAID_DJEZZY",
  "MSSIDN": "0778037340",
  "amount": 500
}
```

### Internet

```json
{
  "type": "internet",
  "internetType": "ADSL",
  "number": "036362608",
  "value": 1000
}
```

## Notes
- لا يتم نسخ أي موقع أو واجهة حرفياً؛ التصميم مستوحى من أسلوب منصات الخدمات الرقمية فقط.
- عند فشل طلب المزود بعد خصم الرصيد، يتم رد الرصيد تلقائياً وتسجيل العملية كـ `FAILED`.
- عند وصول حالة المزود إلى `REFUNDED` عبر فحص الحالة، يتم رد الرصيد مرة واحدة فقط.
