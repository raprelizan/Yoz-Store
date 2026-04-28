require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.ONECLICK_BASE_URL || 'https://api.oneclickdz.com/v3';
const apiKey = process.env.ONECLICK_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function assertApiKey(req, res, next) {
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'MISSING_SERVER_CONFIGURATION',
        message: 'ONECLICK_API_KEY غير موجود في إعدادات الخادم.'
      }
    });
  }
  next();
}

function normalizeErrorPayload(error) {
  if (error?.error?.message) {
    return error;
  }

  return {
    success: false,
    error: {
      code: 'UPSTREAM_ERROR',
      message: 'حدث خطأ أثناء الاتصال بخدمة OneClickDZ',
      details: error
    }
  };
}

async function oneClickRequest({ endpoint, method = 'GET', body, query }) {
  const url = new URL(`${baseUrl}${endpoint}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Access-Token': apiKey
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({
    success: false,
    error: {
      code: 'INVALID_JSON_RESPONSE',
      message: 'الاستجابة من مزود الخدمة غير صالحة.'
    }
  }));

  if (!response.ok || data.success === false) {
    const error = normalizeErrorPayload(data);
    return {
      status: response.status,
      data: error
    };
  }

  return {
    status: response.status,
    data
  };
}

const routeMap = {
  validate: { endpoint: '/validate', method: 'GET' },

  listMobilePlans: { endpoint: '/mobile/list-plans', method: 'GET' },
  listInternetProducts: { endpoint: '/internet/list-products', method: 'GET' },
  listGiftCardsCatalog: { endpoint: '/gift-cards/get-catalog', method: 'GET' },

  createPaymentLink: { endpoint: '/ocpay/create-link', method: 'POST', required: ['amount'] },
  checkPayment: { endpoint: '/ocpay/check-payment', method: 'POST', required: ['linkId'] },

  mobileSendTopup: { endpoint: '/mobile/send-topup', method: 'POST' },
  mobileCheckById: { endpoint: '/mobile/check-by-id', method: 'POST', required: ['id'] },
  mobileCheckByRef: { endpoint: '/mobile/check-by-ref', method: 'POST', required: ['ref'] },

  internetSendTopup: { endpoint: '/internet/send-topup', method: 'POST' },
  internetValidateNumber: { endpoint: '/internet/validate-number', method: 'POST', required: ['type', 'number'] },

  giftCardsPlaceOrder: { endpoint: '/gift-cards/place-order', method: 'POST' },
  giftCardsCheckOrder: { endpoint: '/gift-cards/check-order', method: 'POST', required: ['orderId'] },

  getBalance: { endpoint: '/account/get-balance', method: 'GET' },
  listTransactions: { endpoint: '/account/list-transactions', method: 'GET' },
  listGiftCardOrders: { endpoint: '/gift-cards/list-orders', method: 'GET' },
  listMobileTopups: { endpoint: '/mobile/list-topups', method: 'GET' },
  listInternetTopups: { endpoint: '/internet/list-topups', method: 'GET' }
};

function validatePayload(requiredFields, payload) {
  const missing = requiredFields.filter((field) => payload?.[field] === undefined || payload?.[field] === null || payload?.[field] === '');
  return missing;
}

app.post('/api/oneclick/:action', assertApiKey, async (req, res) => {
  const config = routeMap[req.params.action];

  if (!config) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'UNKNOWN_ACTION',
        message: 'الإجراء المطلوب غير معروف.'
      }
    });
  }

  const missing = validatePayload(config.required || [], req.body || {});
  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `الحقول التالية مطلوبة: ${missing.join(', ')}`
      }
    });
  }

  try {
    const requestConfig = {
      endpoint: config.endpoint,
      method: config.method
    };

    if (config.method === 'GET') {
      requestConfig.query = req.body;
    } else {
      requestConfig.body = req.body;
    }

    const result = await oneClickRequest(requestConfig);
    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'خطأ داخلي في الخادم.',
        details: error.message
      }
    });
  }
});

app.post('/api/checkout', assertApiKey, async (req, res) => {
  const { orderType, customer, payment, orderData } = req.body || {};

  if (!orderType || !payment?.amount) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'البيانات غير مكتملة. orderType و payment.amount مطلوبان.'
      }
    });
  }

  try {
    const paymentResult = await oneClickRequest({
      endpoint: '/ocpay/create-link',
      method: 'POST',
      body: payment
    });

    if (!paymentResult.data?.success) {
      return res.status(paymentResult.status || 400).json(paymentResult.data);
    }

    return res.status(200).json({
      success: true,
      data: {
        orderType,
        customer,
        orderData,
        payment: paymentResult.data.data
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'CHECKOUT_FAILED',
        message: 'تعذر إنشاء رابط الدفع.',
        details: error.message
      }
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Yoz Store running on http://localhost:${port}`);
});
