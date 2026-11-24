import { item } from "@/lib/routes";
import { targetSchema } from "@/lib/schemas";

export const { DELETE } = item({ table: "revenue_targets", label: "target", action: "target.manage", schema: targetSchema });
