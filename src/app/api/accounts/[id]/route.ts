import { item } from "@/lib/routes";
import { accountSchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({ table: "accounts", label: "account", action: "crm.write", schema: accountSchema });
