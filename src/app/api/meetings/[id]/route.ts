import { item } from "@/lib/routes";
import { meetingSchema } from "@/lib/schemas";

export const { PATCH, DELETE } = item({ table: "meetings", label: "meeting", action: "crm.write", schema: meetingSchema });
