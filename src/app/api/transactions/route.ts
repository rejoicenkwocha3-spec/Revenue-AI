import { collection } from "@/lib/routes";
import { transactionSchema } from "@/lib/schemas";

export const { POST } = collection({ table: "revenue_transactions", label: "revenue record", action: "forecast.manage", schema: transactionSchema, insertExtras: (c) => ({ created_by: c.userId }), auditCreate: true });
