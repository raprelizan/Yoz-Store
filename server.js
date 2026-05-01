require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const baseUrl = process.env.ONECLICK_BASE_URL || 'https://api.oneclickdz.com/v3';
const apiKey = process.env.ONECLICK_API_KEY;
const recentOrders = [];
const executionRefs = new Map();

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

function sanitizeString(value, max = 120) {
  return String(value || '').trim().replace(/[<>`]/g, '').slice(0, max);
}

function ensureNumber(value, defaultValue = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
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

async function oneClickRequestWithFallback({ endpoints, method = 'GET', body, query }) {
  let lastResult = null;

  for (const endpoint of endpoints) {
    const result = await oneClickRequest({ endpoint, method, body, query });
    lastResult = result;

    if (result?.data?.success !== false) {
      return result;
    }
  }

  return lastResult;
}

async function fetchExternalJson(url) {
  const response = await fetch(url, { method: 'GET' });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { raw: text };
  }
}

const routeMap = {
  validate: { endpoint: '/validate', method: 'GET' },

  listMobilePlans: { endpoint: '/mobile/plans', fallbackEndpoints: ['/mobile/list-plans'], method: 'GET' },
  listInternetProducts: { endpoint: '/internet/products', fallbackEndpoints: ['/internet/list-products'], method: 'GET' },
  listGiftCardsCatalog: { endpoint: '/gift-cards/catalog', fallbackEndpoints: ['/gift-cards/get-catalog'], method: 'GET' },

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
      endpoints: [endpoint, ...(config.fallbackEndpoints || [])],
      method: config.method
    };

    if (config.method === 'GET') {
      requestConfig.query = payload;
    } else {
      requestConfig.body = payload;
    }

    const result = await oneClickRequestWithFallback(requestConfig);
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
  const amount = ensureNumber(payment?.amount, 0);

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
      title: `طلب ${sanitizeString(orderType, 24)}`,
      description: `عميل: ${sanitizeString(customer?.number || 'N/A', 40)}`,
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

app.post('/api/orders/recent', assertApiKey, (req, res) => {
  const payload = req.body || {};
  const entry = {
    id: `LOCAL-${Date.now()}`,
    createdAt: new Date().toISOString(),
    type: payload.type || 'unknown',
    customer: payload.customer || {},
    productId: payload.productId || '',
    amount: payload.amount || 0,
    providerRef: payload.providerRef || '',
    status: payload.status || 'CREATED'
  };

  recentOrders.unshift(entry);
  if (recentOrders.length > 50) {
    recentOrders.pop();
  }

  return res.status(200).json({ success: true, data: entry });
});

app.get('/api/orders/recent', assertApiKey, (_req, res) => {
  return res.status(200).json({ success: true, data: recentOrders });
});

app.delete('/api/orders/recent', assertApiKey, (_req, res) => {
  recentOrders.length = 0;
  return res.status(200).json({ success: true, data: [] });
});

app.get('/api/orders/recent.csv', assertApiKey, (_req, res) => {
  const header = 'id,createdAt,type,customer,productId,amount,providerRef,status';
  const rows = recentOrders.map((row) => [
    row.id,
    row.createdAt,
    row.type,
    JSON.stringify(row.customer || {}).replaceAll(',', ';'),
    row.productId,
    row.amount,
    row.providerRef,
    row.status
  ].map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','));

  const csv = [header, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=\"recent-orders.csv\"');
  return res.status(200).send(csv);
});

app.post('/api/execute-with-tracking', assertApiKey, async (req, res) => {
  const { orderType, payload } = req.body || {};

  if (!orderType || !payload) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'orderType و payload مطلوبان.' }
    });
  }

  const maxAttempts = 6;
  const waitMs = 2500;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    let submitResult;
    let checkById = null;
    let checkByRef = null;

    const safePayload = {
      ...payload,
      ref: sanitizeString(payload?.ref || `REF-${Date.now()}`, 64)
    };

    const now = Date.now();
    const existing = executionRefs.get(safePayload.ref);
    if (existing && now - existing < 5 * 60 * 1000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_REF',
          message: 'تم استخدام نفس المرجع ref مؤخراً. استخدم ref جديداً لتجنب تنفيذ مكرر.'
        }
      });
    }
    executionRefs.set(safePayload.ref, now);

    if (orderType === 'mobile') {
      submitResult = await oneClickRequest({ endpoint: '/mobile/send', method: 'POST', body: safePayload });
      checkById = (id) => oneClickRequest({ endpoint: `/mobile/check-id/${encodeURIComponent(id)}`, method: 'GET' });
      checkByRef = (ref) => oneClickRequest({ endpoint: `/mobile/check-ref/${encodeURIComponent(ref)}`, method: 'GET' });
    } else if (orderType === 'internet') {
      submitResult = await oneClickRequest({ endpoint: '/internet/send', method: 'POST', body: safePayload });
      checkById = (id) => oneClickRequest({ endpoint: `/internet/check-id/${encodeURIComponent(id)}`, method: 'GET' });
      checkByRef = (ref) => oneClickRequest({ endpoint: `/internet/check-ref/${encodeURIComponent(ref)}`, method: 'GET' });
    } else {
      submitResult = await oneClickRequest({ endpoint: '/gift-cards/placeOrder', method: 'POST', body: safePayload });
      checkById = (id) => oneClickRequest({ endpoint: `/gift-cards/checkOrder/${encodeURIComponent(id)}`, method: 'GET' });
    }

    if (submitResult?.data?.success === false) {
      return res.status(submitResult.status || 400).json(submitResult.data);
    }

    const submitData = submitResult.data?.data || submitResult.data || {};
    const trackingId = submitData.id || submitData.orderId || safePayload.id || '';
    const trackingRef = submitData.ref || safePayload.ref || '';
    const history = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let statusResult = null;
      if (trackingId && checkById) {
        statusResult = await checkById(trackingId);
      } else if (trackingRef && checkByRef) {
        statusResult = await checkByRef(trackingRef);
      }

      const statusData = statusResult?.data?.data || statusResult?.data || {};
      const statusValue = String(statusData.status || statusData.state || statusData.result || 'PENDING').toUpperCase();
      history.push({ attempt, status: statusValue, raw: statusData });

      if (['SUCCESS', 'COMPLETED', 'DONE', 'FAILED', 'REJECTED', 'CANCELLED'].includes(statusValue)) {
        return res.status(200).json({
          success: true,
          data: { submit: submitResult.data, final: statusResult?.data || null, history }
        });
      }

      await wait(waitMs);
    }

    return res.status(200).json({
      success: true,
      data: {
        submit: submitResult.data,
        final: null,
        history,
        warning: 'انتهت محاولات المتابعة وما زالت الحالة قيد المعالجة.'
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'TRACKING_FLOW_FAILED', message: 'فشل تنفيذ الطلب مع المتابعة.', details: error.message }
    });
  }
});

app.get('/api/system/status', (_req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      service: 'Yoz Store',
      apiBase: baseUrl,
      hasApiKey: Boolean(apiKey),
      recentOrdersCount: recentOrders.length,
      recentExecutionRefs: executionRefs.size,
      timestamp: new Date().toISOString()
    }
  });
});

app.get('/api/catalog', assertApiKey, async (_req, res) => {
  try {
    const [mobile, internet4g, internetAdsl, giftCards] = await Promise.all([
      oneClickRequestWithFallback({
        endpoints: ['/mobile/plans', '/mobile/list-plans'],
        method: 'GET'
      }),
      oneClickRequestWithFallback({
        endpoints: ['/internet/products', '/internet/list-products'],
        method: 'GET',
        query: { type: '4G' }
      }),
      oneClickRequestWithFallback({
        endpoints: ['/internet/products', '/internet/list-products'],
        method: 'GET',
        query: { type: 'ADSL' }
      }),
      oneClickRequestWithFallback({
        endpoints: ['/gift-cards/catalog', '/gift-cards/get-catalog'],
        method: 'GET'
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        mobile: mobile.data,
        internet4g: internet4g.data,
        internetAdsl: internetAdsl.data,
        giftCards: giftCards.data
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'CATALOG_FETCH_FAILED',
        message: 'تعذر تحميل الكتالوج الكامل من OneClickDZ.',
        details: error.message
      }
    });
  }
});

app.get('/api/admin/overview', assertApiKey, async (_req, res) => {
  try {
    const [balance, transactions, mobileTopups, internetTopups, giftOrders] = await Promise.all([
      oneClickRequest({ endpoint: '/account/balance', method: 'GET' }),
      oneClickRequest({ endpoint: '/account/transactions', method: 'GET' }),
      oneClickRequest({ endpoint: '/mobile/list', method: 'GET' }),
      oneClickRequest({ endpoint: '/internet/list', method: 'GET' }),
      oneClickRequest({ endpoint: '/gift-cards/list', method: 'GET' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        balance: balance.data,
        transactions: transactions.data,
        mobileTopups: mobileTopups.data,
        internetTopups: internetTopups.data,
        giftOrders: giftOrders.data
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'ADMIN_OVERVIEW_FAILED',
        message: 'تعذر تحميل نظرة عامة للحساب من OneClickDZ.',
        details: error.message
      }
    });
  }
});

app.get('/api/public-feed', async (_req, res) => {
  try {
    const [products, reply, news, notifications, discounts, osi] = await Promise.all([
      fetchExternalJson('https://contabo-payzaad.oneclickdz.com/api/getnokey/prodmain/all'),
      fetchExternalJson('https://contabo-payzaad.oneclickdz.com/api/support/get_one_reply'),
      fetchExternalJson('https://contabo-payzaad.oneclickdz.com/api/getnokey/getnews/dd'),
      fetchExternalJson('https://contabo-payzaad.oneclickdz.com/api/get/notification/all'),
      fetchExternalJson('https://contabo-payzaad.oneclickdz.com/api/getnokey/discounts/223'),
      fetchExternalJson('https://contabo-payzaad.oneclickdz.com/api/getusr/OSI/?v=v6.0')
    ]);

    return res.status(200).json({
      success: true,
      data: { products, reply, news, notifications, discounts, osi }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PUBLIC_FEED_FAILED',
        message: 'تعذر جلب التغذية العامة.',
        details: error.message
      }
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Yoz Store running on http://localhost:${port}`);
});
