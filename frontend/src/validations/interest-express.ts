import { z } from "zod";

export const expressInterestSchema = z.object({
  message: z.string().max(2000).optional().default(""),
  pickupTimeline: z.string().max(500).optional().default(""),
});

export type ExpressInterestFormValues = z.infer<typeof expressInterestSchema>;
