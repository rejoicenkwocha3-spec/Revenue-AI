import { z } from "zod";
import { collection } from "@/lib/routes";

export const { POST } = collection({ table: "teams", label: "team", action: "team.manage", schema: z.object({ name: z.string().trim().min(1).max(120), manager_id: z.string().uuid().nullable().optional() }), auditCreate: true });
