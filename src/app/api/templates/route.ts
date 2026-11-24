import { collection } from "@/lib/routes";
import { templateSchema } from "@/lib/schemas";

export const { POST } = collection({ table: "email_templates", label: "email template", action: "crm.write", schema: templateSchema, insertExtras: (c) => ({ created_by: c.userId }) });
