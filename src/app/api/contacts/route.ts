import { collection } from "@/lib/routes";
import { contactSchema } from "@/lib/schemas";

export const { POST } = collection({ table: "contacts", label: "contact", action: "crm.write", schema: contactSchema, insertExtras: (c) => ({ created_by: c.userId }) });
