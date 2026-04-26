import type { StoreOrder } from "../store/order-store";

export interface OwnerNotifier {
  notifyPaymentConfirmed(order: StoreOrder): Promise<void>;
}

export class ConsoleOwnerNotifier implements OwnerNotifier {
  constructor(private readonly ownerEmail?: string) {}

  async notifyPaymentConfirmed(order: StoreOrder): Promise<void> {
    const destination = this.ownerEmail ?? "owner";
    console.info(
      `[owner-notification] to=${destination} order=${order.id} product=${order.productId} status=${order.status}`
    );
  }
}
