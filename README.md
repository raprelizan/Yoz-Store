# متجر Yoz الرقمي (OneClickDZ)

متجر ويب عربي لبيع المنتجات الرقمية بالاعتماد على **OneClickDZ API v3** عبر توثيقهم الرسمي فقط.

## المتطلبات

- Node.js 18+
- API Key صالح من OneClickDZ

## الإعداد

1. تثبيت الحزم:

```bash
npm install
```

2. إنشاء ملف البيئة:

```bash
cp .env.example .env
```

3. ضع المفتاح في `.env`:

```env
ONECLICK_API_KEY=YOUR_REAL_KEY
```

4. تشغيل التطبيق:

```bash
npm run dev
```

## نقاط التكامل المستخدمة (v3)

- التحقق: `GET /validate`
- Mobile:
  - `GET /mobile/plans`
  - `POST /mobile/send`
  - `GET /mobile/check-id/:id`
  - `GET /mobile/check-ref/:ref`
  - `GET /mobile/list`
- Internet:
  - `GET /internet/products`
  - `GET /internet/check-number`
  - `POST /internet/send`
  - `GET /internet/check-id/:id`
  - `GET /internet/check-ref/:ref`
  - `GET /internet/list`
- Gift Cards:
  - `GET /gift-cards/catalog`
  - `POST /gift-cards/placeOrder`
  - `GET /gift-cards/checkOrder/:orderId`
  - `GET /gift-cards/list`
- OCPay:
  - `POST /ocpay/createLink`
  - `GET /ocpay/checkPayment/:ref`
- Account:
  - `GET /account/balance`
  - `GET /account/transactions`

## تشخيص الخطأ: "حدث خطأ أثناء الاتصال بخدمة OneClickDZ"

تم تحسين المشروع لعرض **رسالة الخطأ الأصلية من OneClickDZ** بدل رسالة عامة فقط، مع `code` و `requestId` عند توفرهما.

إذا استمر الخطأ:

1. اضغط زر **"فحص الاتصال مع OneClickDZ (/validate)"** داخل لوحة الإدارة.
2. تأكد أن المفتاح صحيح ومفعل.
3. إذا ظهر `IP_NOT_ALLOWED` فقم بإضافة IP السيرفر إلى whitelist في لوحة OneClickDZ.
4. إذا ظهر `INVALID_ACCESS_TOKEN` فالمفتاح غير صحيح/منتهي.

## الأمان

- API Key محفوظ في Environment Variables
- لا يتم كشف المفتاح للواجهة الأمامية
- Validation أساسي للمدخلات قبل أي طلب خارجي
- تمرير أخطاء مزود الخدمة بشفافية لتسهيل الدعم


## ملاحظة خاصة بـ Vite + React

إذا استخدمت JSX داخل ملفات الصفحات، يجب أن تكون الامتدادات `.jsx` أو `.tsx`.
تمت إضافة `frontend/src/pages/index.jsx` مع ملف `frontend/src/pages/index.js` لإعادة التصدير فقط حتى لا يظهر خطأ:
`Failed to parse source for import analysis`.


## عرض المنتجات تلقائياً (الاسم + الصورة + السعر)

- يتم تحميل المنتجات تلقائياً من API عند فتح الصفحة.
- كل بطاقة منتج تعرض:
  - الاسم
  - الصورة (إن كانت متوفرة من API)
  - السعر والعملة
  - تفاصيل إضافية مباشرة من استجابة API (داخل Details)
- لا يتم استخدام Mock Data أو أسعار ثابتة.


## توافق المسارات (حسب نسخ التوثيق)

بعض حسابات OneClickDZ قد تعمل بأسماء endpoints مختلفة لنفس الخدمة.
تمت إضافة fallback تلقائي في الخادم لمسارات المنتجات:
- Mobile: `/mobile/plans` ثم `/mobile/list-plans`
- Internet: `/internet/products` ثم `/internet/list-products`
- Gift Cards: `/gift-cards/catalog` ثم `/gift-cards/get-catalog`

هذا يضمن ظهور المنتجات تلقائياً حتى لو كان حسابك يعمل بصيغة المسارات البديلة.
