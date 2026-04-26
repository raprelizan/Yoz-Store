import { describe, expect, it, vi } from "vitest";
import { OrderService } from "../src/server/services/order-service";
import { InMemoryOrderStore } from "../src/server/store/order-store";

function createDeps() {
  const client = {
    createPaymentLink: vi.fn(),
    getPaymentStatus: vi.fn(),
    placeOrder: vi.fn()
  };

  const notifier = {
    notifyPaymentConfirmed: vi.fn()
  };

  const store = new InMemoryOrderStore();

  return {
    service: new OrderService(client as never, store, notifier),
    client,
    notifier,
    store
  };
}

describe("OrderService", () => {
  it("creates checkout and stores payment_created order", async () => {
    const { service, client, store } = createDeps();
    client.createPaymentLink.mockResolvedValue({
      paymentId: "pay_1",
      checkoutUrl: "https://checkout.test/pay_1"
    });

    const checkout = await service.startCheckout({
      productId: "prod_1",
      quantity: 2,
      customerEmail: "buyer@example.com"
    });

    expect(checkout.paymentId).toBe("pay_1");
    expect(checkout.status).toBe("payment_created");

    const order = await store.findById(checkout.orderId);
    expect(order?.paymentId).toBe("pay_1");
  });

  it("marks order paid and notifies owner", async () => {
    const { service, client, notifier } = createDeps();
    client.createPaymentLink.mockResolvedValue({
      paymentId: "pay_2",
      checkoutUrl: "https://checkout.test/pay_2"
    });
    client.getPaymentStatus.mockResolvedValue({ paymentId: "pay_2", status: "paid" });

    await service.startCheckout({
      productId: "prod_2",
      quantity: 1,
      customerEmail: "buyer@example.com"
    });

    const result = await service.refreshPaymentStatus("pay_2");

    expect(result.orderStatus).toBe("paid");
    expect(notifier.notifyPaymentConfirmed).toHaveBeenCalledTimes(1);
  });

  it("acknowledges payment callback", async () => {
    const { service, client } = createDeps();
    client.createPaymentLink.mockResolvedValue({
      paymentId: "pay_7",
      checkoutUrl: "https://checkout.test/pay_7"
    });
    client.getPaymentStatus.mockResolvedValue({ paymentId: "pay_7", status: "paid" });

    await service.startCheckout({
      productId: "prod_7",
      quantity: 1,
      customerEmail: "buyer@example.com"
    });

    const callback = await service.handlePaymentCallback({ paymentId: "pay_7", event: "paid" });
    expect(callback.acknowledged).toBe(true);
    expect(callback.status).toBe("paid");
  });

  it("requires payment confirmation before placing order", async () => {
    const { service, client } = createDeps();
    client.getPaymentStatus.mockResolvedValue({ paymentId: "pay_3", status: "pending" });

    await expect(
      service.confirmAndPlaceOrder({
        productId: "prod_2",
        quantity: 1,
        customerEmail: "buyer@example.com",
        paymentId: "pay_3"
      })
    ).rejects.toThrow("Payment is not confirmed yet.");
  });

  it("tracks order only for the same customer email", async () => {
    const { service, client } = createDeps();
    client.createPaymentLink.mockResolvedValue({
      paymentId: "pay_4",
      checkoutUrl: "https://checkout.test/pay_4"
    });

    const checkout = await service.startCheckout({
      productId: "prod_4",
      quantity: 1,
      customerEmail: "buyer@example.com"
    });

    const tracked = await service.trackOrder({
      orderId: checkout.orderId,
      customerEmail: "buyer@example.com"
    });

    expect(tracked.orderId).toBe(checkout.orderId);

    await expect(
      service.trackOrder({
        orderId: checkout.orderId,
        customerEmail: "other@example.com"
      })
    ).rejects.toThrow("Order access denied.");
  });
});
