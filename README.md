# متجر Yoz الرقمي (OneClickDZ)

متجر ويب عربي لبيع المنتجات الرقمية بالاعتماد على OneClickDZ API v3.

## المتطلبات

- Node.js 18+
- API Key من OneClickDZ

## الإعداد

1. تثبيت الحزم:

```bash
npm install
```

2. إنشاء ملف البيئة:

```bash
cp .env.example .env
```

3. أضف قيمة `ONECLICK_API_KEY` داخل `.env`.

4. تشغيل التطبيق:

```bash
npm run dev
```

## ما الذي يدعمه المشروع؟

- جلب المنتجات مباشرة من API:
  - `/mobile/list-plans`
  - `/internet/list-products`
  - `/gift-cards/get-catalog`
- الدفع عبر OCPay:
  - `/ocpay/create-link`
  - `/ocpay/check-payment`
- تنفيذ الطلبات:
  - Mobile: `/mobile/send-topup` + check endpoints
  - Internet: `/internet/send-topup` + validate endpoint
  - Gift Cards: `/gift-cards/place-order` + `/gift-cards/check-order`
- لوحة إدارة:
  - الرصيد
  - العمليات
  - الطلبات

## الأمان

- API Key محفوظ في Environment Variables
- منع تسريب المفتاح للواجهة الأمامية
- التحقق من البيانات الأساسية قبل إرسال الطلبات
- معالجة أخطاء موحّدة لعرض رسائل واضحة
