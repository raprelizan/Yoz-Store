import type { OneClickDzClient } from "./oneclickdz";
import type { OwnerNotifier } from "./owner-notifier";
import type { OrderStore } from "../store/order-store";

export class OrderService {
  constructor(
    private readonly client: OneClickDzClient,
    private readonly store: OrderStore,
    private readonly notifier: OwnerNotifier
  ) {}

  async startCheckout(input: { productId: string; quantity: number; customerEmail: string }) {
    const payment = await this.client.createPaymentLink(input);
    const order = await this.store.create({ ...input, paymentId: payment.paymentId });

    return {
      orderId: order.id,
      paymentId: payment.paymentId,
      checkoutUrl: payment.checkoutUrl,
      status: order.status
    };
  }

  async refreshPaymentStatus(paymentId: string) {
    const payment = await this.client.getPaymentStatus(paymentId);
    const order = await this.store.findByPaymentId(paymentId);

    if (!order) {
      return {
        paymentId,
        paymentStatus: payment.status,
        orderStatus: "not_found"
      } as const;
    }

    if (payment.status === "paid" && order.status !== "paid" && order.status !== "fulfilled") {
      const updated = await this.store.update(order.id, { status: "paid" });
      if (updated) {
        await this.notifier.notifyPaymentConfirmed(updated);
      }
      return { paymentId, paymentStatus: payment.status, orderStatus: "paid" } as const;
    }

    if (payment.status === "failed" && order.status !== "failed") {
      await this.store.update(order.id, { status: "failed" });
      return { paymentId, paymentStatus: payment.status, orderStatus: "failed" } as const;
    }

    return { paymentId, paymentStatus: payment.status, orderStatus: order.status } as const;
  }

  async handlePaymentCallback(input: { paymentId: string; event: "paid" | "failed" }) {
    const result = await this.refreshPaymentStatus(input.paymentId);
    return {
      acknowledged: true,
      paymentId: input.paymentId,
      event: input.event,
      status: result.orderStatus
    } as const;
  }

  async confirmAndPlaceOrder(input: { paymentId: string; productId: string; quantity: number; customerEmail: string }) {
    const payment = await this.client.getPaymentStatus(input.paymentId);

    if (payment.status !== "paid") {
      throw new Error("Payment is not confirmed yet.");
    }

    const providerOrder = await this.client.placeOrder(input);
    const order = await this.store.findByPaymentId(input.paymentId);

    if (!order) {
      const created = await this.store.create({
        productId: input.productId,
        quantity: input.quantity,
        customerEmail: input.customerEmail,
        paymentId: input.paymentId
      });

      await this.store.update(created.id, {
        status: providerOrder.status === "fulfilled" ? "fulfilled" : "paid",
        providerOrderId: providerOrder.orderId
      });

      return providerOrder;
    }

    await this.store.update(order.id, {
      status: providerOrder.status === "fulfilled" ? "fulfilled" : "paid",
      providerOrderId: providerOrder.orderId
    });

    return providerOrder;
  }

  async trackOrder(input: { orderId: string; customerEmail: string }) {
    const order = await this.store.findById(input.orderId);
    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.customerEmail.toLowerCase() !== input.customerEmail.toLowerCase()) {
      throw new Error("Order access denied.");
    }

    return {
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity,
      status: order.status,
      paymentId: order.paymentId,
      updatedAt: order.updatedAt.toISOString()
    };
  }

  async listOrdersByCustomer(customerEmail: string) {
    const items = await this.store.listByEmail(customerEmail);
    return items.map((order) => ({
      orderId: order.id,
      productId: order.productId,
      quantity: order.quantity,
      status: order.status,
      createdAt: order.createdAt.toISOString()
    }));
  }
}
