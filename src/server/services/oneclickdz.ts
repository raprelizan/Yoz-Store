import { z } from "zod";

const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  currency: z.string(),
  category: z.string().optional(),
  description: z.string().optional()
});

const paymentLinkSchema = z.object({
  paymentId: z.string(),
  checkoutUrl: z.string().url()
});

const paymentStatusSchema = z.object({
  paymentId: z.string(),
  status: z.enum(["pending", "paid", "failed"])
});

const placeOrderSchema = z.object({
  orderId: z.string(),
  status: z.enum(["paid", "fulfilled"])
});

export type OneClickProduct = z.infer<typeof productSchema>;
export type OneClickPaymentStatus = z.infer<typeof paymentStatusSchema>;

export class OneClickDzClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string
  ) {}

  private async request<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...init?.headers
      }
    });

    if (!response.ok) {
      throw new Error(`OneClickDZ API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return schema ? schema.parse(data) : (data as T);
  }

  listCatalog() {
    return this.request("/catalog", { method: "GET" }, z.array(productSchema));
  }

  getProductDetails(productId: string) {
    return this.request(`/products/${productId}`, { method: "GET" }, productSchema);
  }

  createPaymentLink(input: { productId: string; quantity: number; customerEmail: string }) {
    return this.request(
      "/payments/ocpay/link",
      {
        method: "POST",
        body: JSON.stringify(input)
      },
      paymentLinkSchema
    );
  }

  getPaymentStatus(paymentId: string) {
    return this.request(`/payments/${paymentId}/status`, { method: "GET" }, paymentStatusSchema);
  }

  placeOrder(input: { productId: string; quantity: number; customerEmail: string; paymentId: string }) {
    return this.request(
      "/orders",
      {
        method: "POST",
        body: JSON.stringify(input)
      },
      placeOrderSchema
    );
  }
}
