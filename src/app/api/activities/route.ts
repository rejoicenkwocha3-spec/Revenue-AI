import { collection } from "@/lib/routes";
import { activitySchema } from "@/lib/schemas";

export const { POST } = collection({ table: "sales_activities", label: "activity", action: "crm.write", schema: activitySchema, insertExtras: (c) => ({ user_id: c.userId }) });
