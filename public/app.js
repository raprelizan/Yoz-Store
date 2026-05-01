const state = {
  activeTab: 'mobile',
  search: '',
  products: {
    mobile: [],
    internet: [],
    giftCards: []
  }
};

function formatError(errorPayload) {
  const message = errorPayload?.error?.message || errorPayload?.message || 'خطأ غير متوقع';
  const code = errorPayload?.error?.code ? `\nالكود: ${errorPayload.error.code}` : '';
  const requestId = errorPayload?.requestId ? `\nRequest ID: ${errorPayload.requestId}` : '';
  return `${message}${code}${requestId}`;
}

async function api(action, payload = {}) {
  const response = await fetch(`/api/oneclick/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(formatError(data));
  }

  return data;
}

function simplifyProducts(list) {
  if (!Array.isArray(list)) return [];

  return list.map((item) => ({
    id: item.id || item.code || item._id || '-',
    name: item.name || item.title || item.operator || item.type || 'بدون اسم',
    price: item.price || item.amount || item.value || 'غير متوفر',
    image:
      item.image ||
      item.img ||
      item.photo ||
      item.logo ||
      item.icon ||
      item.thumbnail ||
      item.picture ||
      '',
    currency: item.currency || 'DZD',
    raw: item
  }));
}

function extractListByShape(data = {}) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.plans)) return data.plans;
  if (Array.isArray(data.topups)) return data.topups;

  if (Array.isArray(data.categories)) {
    return data.categories.flatMap((category) =>
      (category.products || []).map((product) => ({
        id: product.id,
        title: `${category.name} - ${product.title || product.name || 'منتج'}`,
        price: product.price || product.amount,
        ...product
      }))
    );
  }

  return [];
}

function renderProducts() {
  const container = document.getElementById('productsContainer');
  const query = state.search.trim().toLowerCase();
  const tabProducts = (state.products[state.activeTab] || []).filter((product) => {
    if (!query) return true;
    return String(product.name).toLowerCase().includes(query) || String(product.id).toLowerCase().includes(query);
  });

  if (tabProducts.length === 0) {
    container.innerHTML = '<p>لا توجد منتجات حالياً.</p>';
    return;
  }

  container.innerHTML = `
    <div class="product-grid">
      ${tabProducts
        .map(
          (product) => `
          <div class="product-item" data-select-product="1" data-id="${product.id}" data-name="${product.name}">
            <div class="product-media">
              ${
                product.image
                  ? `<img src="${product.image}" alt="${product.name}" loading="lazy" />`
                  : '<div class="product-placeholder">بدون صورة</div>'
              }
            </div>
            <strong>${product.name}</strong>
            <div>المعرّف: ${product.id}</div>
            <div>السعر: ${product.price} ${product.currency}</div>
            <details>
              <summary>تفاصيل إضافية من API</summary>
              <pre>${JSON.stringify(product.raw, null, 2)}</pre>
            </details>
          </div>
        `
        )
        .join('')}
    </div>
  `;

  container.querySelectorAll('[data-select-product]').forEach((item) => {
    item.addEventListener('click', () => {
      const id = item.getAttribute('data-id') || '';
      const name = item.getAttribute('data-name') || '';
      document.getElementById('productId').value = id;
      document.getElementById('executionResult').textContent = `تم اختيار المنتج: ${name} (${id})`;
      window.scrollTo({ top: document.getElementById('executeOrderForm').offsetTop - 80, behavior: 'smooth' });
    });
  });
}

async function loadProducts() {
  const pageLoader = document.getElementById('pageLoader');
  const button = document.getElementById('refreshPricesBtn');
  button.disabled = true;
  button.textContent = 'جاري التحديث...';

  try {
    const catalogResponse = await fetch('/api/catalog');
    const catalog = await catalogResponse.json();

    if (!catalogResponse.ok || catalog.success === false) {
      throw new Error(formatError(catalog));
    }

    const mobileResult = { status: 'fulfilled', value: catalog.data.mobile || {} };
    const internet4gResult = { status: 'fulfilled', value: catalog.data.internet4g || {} };
    const internetAdslResult = { status: 'fulfilled', value: catalog.data.internetAdsl || {} };
    const giftCardsResult = { status: 'fulfilled', value: catalog.data.giftCards || {} };

    if (mobileResult.status === 'fulfilled') {
      state.products.mobile = simplifyProducts(extractListByShape(mobileResult.value.data || mobileResult.value));
    }

    const internetCombined = [];
    if (internet4gResult.status === 'fulfilled') {
      internetCombined.push(...extractListByShape(internet4gResult.value.data || internet4gResult.value));
    }
    if (internetAdslResult.status === 'fulfilled') {
      internetCombined.push(...extractListByShape(internetAdslResult.value.data || internetAdslResult.value));
    }
    state.products.internet = simplifyProducts(internetCombined);

    if (giftCardsResult.status === 'fulfilled') {
      state.products.giftCards = simplifyProducts(extractListByShape(giftCardsResult.value.data || giftCardsResult.value));
    }

    renderProducts();
  } catch (error) {
    alert(`تعذر جلب المنتجات:\n${error.message}`);
  } finally {
    if (pageLoader) {
      pageLoader.classList.add('hidden');
    }
    button.disabled = false;
    button.textContent = 'تحديث المنتجات والأسعار';
  }
}

async function validateApiKey() {
  const target = document.getElementById('adminResult');
  target.textContent = 'جاري فحص الاتصال...';

  try {
    const response = await fetch('/api/health/validate');
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(formatError(data));
    }

    target.textContent = `الاتصال ناجح ✅\n${JSON.stringify(data, null, 2)}`;
  } catch (error) {
    target.textContent = `فشل التحقق ❌\n${error.message}`;
  }
}

async function createPayment(event) {
  event.preventDefault();
  const output = document.getElementById('paymentResult');

  const payload = {
    orderType: document.getElementById('orderType').value,
    customer: {
      number: document.getElementById('customerNumber').value.trim(),
      clientRef: document.getElementById('clientRef').value.trim()
    },
    payment: {
      amount: Number(document.getElementById('paymentAmount').value)
    }
  };

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(formatError(data));
    }

    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = `خطأ:\n${error.message}`;
  }
}

async function executeOrder(event) {
  event.preventDefault();
  const output = document.getElementById('executionResult');

  const orderType = document.getElementById('executeOrderType').value;
  const paymentRef = document.getElementById('paymentLinkId').value.trim();
  const number = document.getElementById('executeNumber').value.trim();
  const productId = document.getElementById('productId').value.trim();

  try {
    const paymentStatus = await api('checkPayment', { paymentRef });
    const paymentState = paymentStatus?.data?.status;

    if (paymentState !== 'CONFIRMED') {
      throw new Error(`الدفع غير مؤكد بعد. الحالة الحالية: ${paymentState || 'UNKNOWN'}`);
    }

    let executeResponse;

    if (orderType === 'mobile') {
      executeResponse = await api('mobileSendTopup', {
        plan_code: productId,
        MSSIDN: number,
        amount: Number(document.getElementById('paymentAmount').value),
        ref: `MOB-${Date.now()}`
      });
    } else if (orderType === 'internet') {
      const type = number.startsWith('213') ? '4G' : 'ADSL';
      await api('internetValidateNumber', { type, number });
      executeResponse = await api('internetSendTopup', {
        type,
        number,
        value: Number(productId),
        ref: `INT-${Date.now()}`
      });
    } else {
      executeResponse = await api('giftCardsPlaceOrder', {
        productId,
        typeId: productId,
        quantity: 1,
        ref: `GFT-${Date.now()}`
      });
    }

    output.textContent = JSON.stringify(executeResponse, null, 2);
  } catch (error) {
    output.textContent = `خطأ أثناء التنفيذ:\n${error.message}`;
  }
}

async function adminAction(action) {
  const output = document.getElementById('adminResult');
  output.textContent = 'جاري التنفيذ...';

  try {
    const data = await api(action);
    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = `خطأ:\n${error.message}`;
  }
}

async function checkOrderStatus(event) {
  event.preventDefault();
  const output = document.getElementById('statusResult');

  const service = document.getElementById('statusOrderType').value;
  const lookupBy = document.getElementById('statusLookupBy').value;
  const value = document.getElementById('statusLookupValue').value.trim();

  try {
    let responseData;

    if (service === 'mobile') {
      responseData = lookupBy === 'id' ? await api('mobileCheckById', { id: value }) : await api('mobileCheckByRef', { ref: value });
    } else if (service === 'internet') {
      responseData = lookupBy === 'id' ? await api('internetCheckById', { id: value }) : await api('internetCheckByRef', { ref: value });
    } else {
      if (lookupBy !== 'id') {
        throw new Error('Gift Cards يدعم التحقق عبر ID فقط في هذا الإصدار.');
      }
      responseData = await api('giftCardsCheckOrder', { orderId: value });
    }

    output.textContent = JSON.stringify(responseData, null, 2);
  } catch (error) {
    output.textContent = `خطأ:\n${error.message}`;
  }
}

async function loadAdminOverview() {
  const output = document.getElementById('adminResult');
  output.textContent = 'جاري تحميل نظرة عامة...';

  try {
    const response = await fetch('/api/admin/overview');
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(formatError(data));
    }
    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = `خطأ:\n${error.message}`;
  }
}

function setupEvents() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
      button.classList.add('active');
      state.activeTab = button.dataset.tab;
      renderProducts();
    });
  });

  document.getElementById('refreshPricesBtn').addEventListener('click', loadProducts);
  document.getElementById('productSearchInput').addEventListener('input', (event) => {
    state.search = event.target.value || '';
    renderProducts();
  });
  document.getElementById('checkoutForm').addEventListener('submit', createPayment);
  document.getElementById('executeOrderForm').addEventListener('submit', executeOrder);
  document.getElementById('statusForm').addEventListener('submit', checkOrderStatus);
  document.getElementById('validateApiBtn').addEventListener('click', validateApiKey);

  document.querySelectorAll('[data-admin]').forEach((button) => {
    button.addEventListener('click', () => adminAction(button.dataset.admin));
  });
  document.getElementById('overviewBtn').addEventListener('click', loadAdminOverview);
}

setupEvents();
loadProducts();
