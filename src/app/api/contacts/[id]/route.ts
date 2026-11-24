import { item } from "@/lib/routes";
import { contactSchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({ table: "contacts", label: "contact", action: "crm.write", schema: contactSchema });
