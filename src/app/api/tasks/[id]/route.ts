import { item } from "@/lib/routes";
import { taskSchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({
  table: "tasks", label: "task", action: "crm.write", schema: taskSchema,
  before: (_ctx, body) => { if (body.status === "done") body.completed_at = new Date().toISOString(); else if (body.status) body.completed_at = null; },
});
