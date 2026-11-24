import { item } from "@/lib/routes";
import { transactionSchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({ table: "revenue_transactions", label: "revenue record", action: "forecast.manage", schema: transactionSchema });
