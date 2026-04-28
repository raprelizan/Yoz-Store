const state = {
  activeTab: 'mobile',
  products: {
    mobile: [],
    internet: [],
    giftCards: []
  }
};

async function api(action, payload = {}) {
  const response = await fetch(`/api/oneclick/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    const message = data?.error?.message || 'خطأ غير متوقع';
    throw new Error(message);
  }
  return data;
}

function simplifyProducts(list) {
  if (!Array.isArray(list)) return [];

  return list.map((item) => ({
    id: item.id || item.productId || item.planId || item.code || '-',
    name: item.name || item.title || item.operator || 'بدون اسم',
    price: item.price || item.amount || item.cost || 'غير متوفر',
    raw: item
  }));
}

function renderProducts() {
  const container = document.getElementById('productsContainer');
  const tabProducts = state.products[state.activeTab] || [];

  if (tabProducts.length === 0) {
    container.innerHTML = '<p>لا توجد منتجات حالياً.</p>';
    return;
  }

  container.innerHTML = `
    <div class="product-grid">
      ${tabProducts
        .map(
          (product) => `
          <div class="product-item">
            <strong>${product.name}</strong>
            <div>المعرّف: ${product.id}</div>
            <div>السعر: ${product.price}</div>
          </div>
        `
        )
        .join('')}
    </div>
  `;
}

async function loadProducts() {
  const button = document.getElementById('refreshPricesBtn');
  button.disabled = true;
  button.textContent = 'جاري التحديث...';

  try {
    const [mobile, internet, giftCards] = await Promise.all([
      api('listMobilePlans'),
      api('listInternetProducts'),
      api('listGiftCardsCatalog')
    ]);

    state.products.mobile = simplifyProducts(mobile.data || []);
    state.products.internet = simplifyProducts(internet.data || []);
    state.products.giftCards = simplifyProducts(giftCards.data || []);
    renderProducts();
  } catch (error) {
    alert(`تعذر جلب المنتجات: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = 'تحديث المنتجات والأسعار';
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
    },
    orderData: {}
  };

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data?.error?.message || 'فشل إنشاء رابط الدفع');
    }

    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = `خطأ: ${error.message}`;
  }
}

async function executeOrder(event) {
  event.preventDefault();
  const output = document.getElementById('executionResult');

  const orderType = document.getElementById('executeOrderType').value;
  const linkId = document.getElementById('paymentLinkId').value.trim();
  const number = document.getElementById('executeNumber').value.trim();
  const productId = document.getElementById('productId').value.trim();

  try {
    await api('checkPayment', { linkId });

    let executeResponse;

    if (orderType === 'mobile') {
      executeResponse = await api('mobileSendTopup', { number, productId });
    } else if (orderType === 'internet') {
      await api('internetValidateNumber', { type: 'ADSL', number });
      executeResponse = await api('internetSendTopup', { number, productId });
    } else {
      executeResponse = await api('giftCardsPlaceOrder', { productId, quantity: 1 });
    }

    output.textContent = JSON.stringify(executeResponse, null, 2);
  } catch (error) {
    output.textContent = `خطأ أثناء التنفيذ: ${error.message}`;
  }
}

async function adminAction(action) {
  const output = document.getElementById('adminResult');
  output.textContent = 'جاري التنفيذ...';

  try {
    const data = await api(action);
    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = `خطأ: ${error.message}`;
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
  document.getElementById('checkoutForm').addEventListener('submit', createPayment);
  document.getElementById('executeOrderForm').addEventListener('submit', executeOrder);

  document.querySelectorAll('[data-admin]').forEach((button) => {
    button.addEventListener('click', () => adminAction(button.dataset.admin));
  });
}

setupEvents();
loadProducts();
