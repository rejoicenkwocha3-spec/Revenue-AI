import { item } from "@/lib/routes";
import { activitySchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({ table: "sales_activities", label: "activity", action: "crm.write", schema: activitySchema });
