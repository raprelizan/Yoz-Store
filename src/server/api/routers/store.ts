import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { OneClickDzClient } from "../../services/oneclickdz";
import { parseEnv } from "../../env";
import { InMemoryOrderStore } from "../../store/order-store";
import { ConsoleOwnerNotifier } from "../../services/owner-notifier";
import { OrderService } from "../../services/order-service";

const env = parseEnv(process.env);
const oneClick = new OneClickDzClient(env.ONECLICKDZ_BASE_URL, env.ONECLICKDZ_API_KEY);
const store = new InMemoryOrderStore();
const notifier = new ConsoleOwnerNotifier(env.OWNER_NOTIFICATION_EMAIL);
const orderService = new OrderService(oneClick, store, notifier);

export const storeRouter = router({
  catalog: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          search: z.string().optional()
        })
        .optional()
    )
    .query(async ({ input }) => {
      const products = await oneClick.listCatalog();
      return products.filter((product) => {
        const matchCategory = input?.category
          ? product.category?.toLowerCase() === input.category.toLowerCase()
          : true;

        const matchSearch = input?.search
          ? product.title.toLowerCase().includes(input.search.toLowerCase()) ||
            product.description?.toLowerCase().includes(input.search.toLowerCase())
          : true;

        return Boolean(matchCategory && matchSearch);
      });
    }),

  productDetails: publicProcedure
    .input(z.object({ productId: z.string().min(1) }))
    .query(async ({ input }) => {
      return oneClick.getProductDetails(input.productId);
    }),

  startCheckout: publicProcedure
    .input(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        customerEmail: z.string().email()
      })
    )
    .mutation(async ({ input }) => {
      return orderService.startCheckout(input);
    }),

  paymentStatus: publicProcedure
    .input(z.object({ paymentId: z.string().min(1) }))
    .query(async ({ input }) => {
      return orderService.refreshPaymentStatus(input.paymentId);
    }),

  paymentCallback: publicProcedure
    .input(
      z.object({
        paymentId: z.string().min(1),
        event: z.enum(["paid", "failed"])
      })
    )
    .mutation(async ({ input }) => {
      return orderService.handlePaymentCallback(input);
    }),

  placeOrder: publicProcedure
    .input(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        customerEmail: z.string().email(),
        paymentId: z.string().min(1)
      })
    )
    .mutation(async ({ input }) => {
      return orderService.confirmAndPlaceOrder(input);
    }),

  trackOrder: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        customerEmail: z.string().email()
      })
    )
    .query(async ({ input }) => {
      return orderService.trackOrder(input);
    }),

  listMyOrders: publicProcedure
    .input(
      z.object({
        customerEmail: z.string().email()
      })
    )
    .query(async ({ input }) => {
      return orderService.listOrdersByCustomer(input.customerEmail);
    })
});
