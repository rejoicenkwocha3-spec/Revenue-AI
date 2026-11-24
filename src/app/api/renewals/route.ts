import { collection } from "@/lib/routes";
import { renewalSchema } from "@/lib/schemas";

export const { POST } = collection({ table: "renewals", label: "renewal", action: "crm.write", schema: renewalSchema });
