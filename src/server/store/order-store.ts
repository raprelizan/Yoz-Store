export type OrderStatus = "pending" | "payment_created" | "paid" | "failed" | "fulfilled";

export type StoreOrder = {
  id: string;
  productId: string;
  quantity: number;
  customerEmail: string;
  paymentId?: string;
  providerOrderId?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrderInput = Pick<StoreOrder, "productId" | "quantity" | "customerEmail"> & {
  paymentId?: string;
};

export interface OrderStore {
  create(input: CreateOrderInput): Promise<StoreOrder>;
  update(id: string, patch: Partial<StoreOrder>): Promise<StoreOrder | null>;
  findById(id: string): Promise<StoreOrder | null>;
  findByPaymentId(paymentId: string): Promise<StoreOrder | null>;
  listByEmail(customerEmail: string): Promise<StoreOrder[]>;
}

function createId() {
  return crypto.randomUUID();
}

export class InMemoryOrderStore implements OrderStore {
  private orders = new Map<string, StoreOrder>();

  async create(input: CreateOrderInput): Promise<StoreOrder> {
    const now = new Date();
    const order: StoreOrder = {
      id: createId(),
      productId: input.productId,
      quantity: input.quantity,
      customerEmail: input.customerEmail,
      paymentId: input.paymentId,
      status: input.paymentId ? "payment_created" : "pending",
      createdAt: now,
      updatedAt: now
    };

    this.orders.set(order.id, order);
    return order;
  }

  async update(id: string, patch: Partial<StoreOrder>): Promise<StoreOrder | null> {
    const current = this.orders.get(id);
    if (!current) return null;

    const next: StoreOrder = {
      ...current,
      ...patch,
      id: current.id,
      updatedAt: new Date()
    };
    this.orders.set(id, next);
    return next;
  }

  async findById(id: string): Promise<StoreOrder | null> {
    return this.orders.get(id) ?? null;
  }

  async findByPaymentId(paymentId: string): Promise<StoreOrder | null> {
    for (const order of this.orders.values()) {
      if (order.paymentId === paymentId) {
        return order;
      }
    }
    return null;
  }

  async listByEmail(customerEmail: string): Promise<StoreOrder[]> {
    const normalized = customerEmail.toLowerCase();
    return [...this.orders.values()]
      .filter((order) => order.customerEmail.toLowerCase() === normalized)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
