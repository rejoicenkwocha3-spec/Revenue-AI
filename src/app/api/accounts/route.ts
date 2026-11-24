import { collection } from "@/lib/routes";
import { accountSchema } from "@/lib/schemas";

export const { POST } = collection({ table: "accounts", label: "account", action: "crm.write", schema: accountSchema, insertExtras: (c) => ({ created_by: c.userId }), auditCreate: true });
