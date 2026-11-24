import { item } from "@/lib/routes";
import { renewalSchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({ table: "renewals", label: "renewal", action: "crm.write", schema: renewalSchema });
