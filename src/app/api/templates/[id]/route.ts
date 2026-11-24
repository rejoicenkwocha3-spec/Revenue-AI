import { item } from "@/lib/routes";
import { templateSchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({ table: "email_templates", label: "email template", action: "crm.write", schema: templateSchema });
