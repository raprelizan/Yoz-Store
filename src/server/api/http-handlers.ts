import { OneClickDzClient } from "../services/oneclickdz";
import { parseEnv } from "../env";
import { InMemoryOrderStore } from "../store/order-store";
import { ConsoleOwnerNotifier } from "../services/owner-notifier";
import { OrderService } from "../services/order-service";

const env = parseEnv(process.env);
const oneClick = new OneClickDzClient(env.ONECLICKDZ_BASE_URL, env.ONECLICKDZ_API_KEY);
const store = new InMemoryOrderStore();
const notifier = new ConsoleOwnerNotifier(env.OWNER_NOTIFICATION_EMAIL);
const orderService = new OrderService(oneClick, store, notifier);

export async function getCatalogHttp(input: { category?: string; search?: string }) {
  const products = await oneClick.listCatalog();

  return {
    items: products.filter((product) => {
      const categoryMatch = input.category
        ? product.category?.toLowerCase() === input.category.toLowerCase()
        : true;

      const searchMatch = input.search
        ? product.title.toLowerCase().includes(input.search.toLowerCase()) ||
          product.description?.toLowerCase().includes(input.search.toLowerCase())
        : true;

      return Boolean(categoryMatch && searchMatch);
    })
  };
}

export async function checkoutHttp(input: { productId: string; quantity: number; customerEmail: string }) {
  return orderService.startCheckout(input);
}

export async function trackOrderHttp(input: { orderId: string; customerEmail: string }) {
  return orderService.trackOrder(input);
}
