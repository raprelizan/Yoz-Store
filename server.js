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

function getValue(payload, keys = []) {
  for (const key of keys) {
    const value = payload?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }
  return '';
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
    body: method !== 'GET' && body ? JSON.stringify(body) : undefined
  });

  const rawText = await response.text();
  let data;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch (_error) {
    data = {
      success: false,
      error: {
        code: 'INVALID_JSON_RESPONSE',
        message: 'استجابة غير متوقعة من OneClickDZ.',
        details: rawText.slice(0, 300)
      }
    };
  }

  if (!response.ok || data.success === false) {
    return {
      status: response.status,
      data: {
        success: false,
        error: {
          code: data?.error?.code || 'UPSTREAM_ERROR',
          message: data?.error?.message || 'فشل الطلب إلى OneClickDZ',
          details: data?.error?.details || null
        },
        requestId: data?.requestId || null,
        meta: data?.meta || null
      }
    };
  }

  return {
    status: response.status,
    data
  };
}

const routeMap = {
  validate: { endpoint: '/validate', method: 'GET' },

  listMobilePlans: { endpoint: '/mobile/plans', method: 'GET' },
  listInternetProducts: { endpoint: '/internet/products', method: 'GET' },
  listGiftCardsCatalog: { endpoint: '/gift-cards/catalog', method: 'GET' },

  createPaymentLink: { endpoint: '/ocpay/createLink', method: 'POST', required: ['productInfo'] },
  checkPayment: {
    method: 'GET',
    required: ['paymentRef'],
    endpointBuilder: (payload) => `/ocpay/checkPayment/${encodeURIComponent(getValue(payload, ['paymentRef', 'linkId', 'ref']))}`
  },

  mobileSendTopup: { endpoint: '/mobile/send', method: 'POST', required: ['plan_code', 'MSSIDN', 'amount', 'ref'] },
  mobileCheckById: {
    method: 'GET',
    required: ['id'],
    endpointBuilder: (payload) => `/mobile/check-id/${encodeURIComponent(getValue(payload, ['id']))}`
  },
  mobileCheckByRef: {
    method: 'GET',
    required: ['ref'],
    endpointBuilder: (payload) => `/mobile/check-ref/${encodeURIComponent(getValue(payload, ['ref']))}`
  },

  internetSendTopup: { endpoint: '/internet/send', method: 'POST', required: ['type', 'number', 'value', 'ref'] },
  internetValidateNumber: { endpoint: '/internet/check-number', method: 'GET', required: ['type', 'number'] },
  internetCheckById: {
    method: 'GET',
    required: ['id'],
    endpointBuilder: (payload) => `/internet/check-id/${encodeURIComponent(getValue(payload, ['id']))}`
  },
  internetCheckByRef: {
    method: 'GET',
    required: ['ref'],
    endpointBuilder: (payload) => `/internet/check-ref/${encodeURIComponent(getValue(payload, ['ref']))}`
  },

  giftCardsPlaceOrder: { endpoint: '/gift-cards/placeOrder', method: 'POST', required: ['productId', 'typeId', 'quantity', 'ref'] },
  giftCardsCheckOrder: {
    method: 'GET',
    required: ['orderId'],
    endpointBuilder: (payload) => `/gift-cards/checkOrder/${encodeURIComponent(getValue(payload, ['orderId']))}`
  },

  getBalance: { endpoint: '/account/balance', method: 'GET' },
  listTransactions: { endpoint: '/account/transactions', method: 'GET' },
  listGiftCardOrders: { endpoint: '/gift-cards/list', method: 'GET' },
  listMobileTopups: { endpoint: '/mobile/list', method: 'GET' },
  listInternetTopups: { endpoint: '/internet/list', method: 'GET' }
};

function validatePayload(requiredFields, payload) {
  return requiredFields.filter((field) => payload?.[field] === undefined || payload?.[field] === null || payload?.[field] === '');
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

  const payload = req.body || {};
  const missing = validatePayload(config.required || [], payload);

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
    const endpoint = config.endpointBuilder ? config.endpointBuilder(payload) : config.endpoint;
    const requestConfig = {
      endpoint,
      method: config.method
    };

    if (config.method === 'GET') {
      requestConfig.query = payload;
    } else {
      requestConfig.body = payload;
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

app.get('/api/health/validate', assertApiKey, async (_req, res) => {
  const result = await oneClickRequest({ endpoint: '/validate', method: 'GET' });
  return res.status(result.status || 200).json(result.data);
});

app.post('/api/checkout', assertApiKey, async (req, res) => {
  const { orderType, customer, payment } = req.body || {};
  const amount = Number(payment?.amount || 0);

  if (!orderType || Number.isNaN(amount) || amount < 500) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'البيانات غير مكتملة. orderType و payment.amount (>=500) مطلوبان.'
      }
    });
  }

  const requestBody = {
    productInfo: {
      title: `طلب ${orderType}`,
      description: `عميل: ${customer?.number || 'N/A'}`,
      amount
    },
    feeMode: 'NO_FEE'
  };

  const paymentResult = await oneClickRequest({
    endpoint: '/ocpay/createLink',
    method: 'POST',
    body: requestBody
  });

  return res.status(paymentResult.status || 200).json(paymentResult.data);
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Yoz Store running on http://localhost:${port}`);
});
