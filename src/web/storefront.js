const state = {
  products: []
};

const $ = (id) => document.getElementById(id);

async function apiCall(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function renderProducts(items) {
  const grid = $("catalogGrid");
  grid.innerHTML = "";

  if (!items.length) {
    grid.innerHTML = `<p class="muted">No products found.</p>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "product";
    card.innerHTML = `
      <h4>${item.title}</h4>
      <p class="muted">${item.category ?? "digital"}</p>
      <p>${item.price} ${item.currency}</p>
      <button data-product="${item.id}">Buy now</button>
    `;

    card.querySelector("button")?.addEventListener("click", () => {
      $("productId").value = item.id;
      window.location.hash = "checkout";
    });

    grid.appendChild(card);
  });
}

async function loadProducts() {
  const category = $("categoryInput").value;
  const search = $("searchInput").value;

  const payload = {
    category: category || undefined,
    search: search || undefined
  };

  // expected adapter route (to be wired server-side): /api/catalog
  const data = await apiCall("/api/catalog", payload);
  state.products = data.items ?? [];
  renderProducts(state.products);
}

async function handleCheckout(event) {
  event.preventDefault();

  const payload = {
    productId: $("productId").value,
    customerEmail: $("customerEmail").value,
    quantity: Number($("quantity").value)
  };

  const result = await apiCall("/api/checkout", payload);
  $("checkoutResult").textContent = `Order: ${result.orderId} | Payment: ${result.paymentId}`;

  if (result.checkoutUrl) {
    window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
  }
}

async function handleTracking(event) {
  event.preventDefault();

  const payload = {
    orderId: $("trackOrderId").value,
    customerEmail: $("trackEmail").value
  };

  const result = await apiCall("/api/track", payload);
  $("trackingResult").textContent = JSON.stringify(result, null, 2);
}

$("loadProductsBtn").addEventListener("click", loadProducts);
$("checkoutForm").addEventListener("submit", handleCheckout);
$("trackingForm").addEventListener("submit", handleTracking);

loadProducts().catch((error) => {
  $("catalogGrid").innerHTML = `<p class="muted">${error.message}</p>`;
});
