import { z } from "zod";

import {
  isOtherCleanlinessLabelOnly,
  isOtherFormLabelOnly,
} from "@/constants/material-attributes";
import { isMaterialCategoryGroup } from "@/constants/material-categories";
import { isOtherUnitLabelOnly } from "@/constants/material-form";
import {
  isOtherSubtypeLabelOnly,
  isValidSubtypeForCategory,
} from "@/constants/material-taxonomy";

const availabilityEnum = z.enum(["one_time", "daily", "weekly", "monthly"]);
const visibilityEnum = z.enum(["network", "restricted"]);
const statusEnum = z.enum([
  "available",
  "in_discussion",
  "fulfilled",
  "archived",
  "active",
  "inactive",
]);

export type MaterialValidationMessages = {
  categoryRequired: string;
  categoryFromList: string;
  materialRequired: string;
  quantityRequired: string;
  quantityNonNegative: string;
  unitRequired: string;
  locationRequired: string;
  otherMaterialRequired: string;
  otherUnitRequired: string;
  otherFormRequired: string;
  otherCleanlinessRequired: string;
};

export function createMaterialFormSchema(messages: MaterialValidationMessages) {
  return z
    .object({
      title: z.string().max(200).default(""),
      materialType: z
        .string()
        .min(1, messages.categoryRequired)
        .max(120)
        .refine(isMaterialCategoryGroup, messages.categoryFromList),
      materialSubtype: z.string().min(1, messages.materialRequired).max(120),
      materialForm: z.string().max(60).optional().default(""),
      cleanliness: z.string().max(60).optional().default(""),
      description: z.string().max(5000).default(""),
      quantity: z.preprocess(
        (val) =>
          val === "" || val === null || val === undefined ? undefined : val,
        z.coerce
          .number({ message: messages.quantityRequired })
          .nonnegative(messages.quantityNonNegative)
      ),
      unit: z.string().min(1, messages.unitRequired).max(60),
      location: z.string().min(1, messages.locationRequired).max(300),
      country: z.string().max(8).optional().default("IN"),
      marketScope: z.enum(["india", "global"]).optional().default("india"),
      availabilityFrequency: availabilityEnum,
      pickupAvailable: z.boolean(),
      estimatedValueRange: z.string().max(200).default(""),
      industryType: z.string().max(120).default(""),
      visibility: visibilityEnum.default("network"),
      status: statusEnum.default("available"),
      imageUrls: z.array(z.string().url().max(2048)).max(3).optional().default([]),
    })
    .superRefine((values, ctx) => {
      const subtype = values.materialSubtype?.trim() ?? "";
      if (
        values.materialType &&
        subtype &&
        !isValidSubtypeForCategory(values.materialType, subtype) &&
        isOtherSubtypeLabelOnly(subtype)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["materialSubtype"],
          message: messages.otherMaterialRequired,
        });
      }

      const unit = values.unit?.trim() ?? "";
      if (unit && isOtherUnitLabelOnly(unit)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unit"],
          message: messages.otherUnitRequired,
        });
      }

      const materialForm = values.materialForm?.trim() ?? "";
      if (materialForm && isOtherFormLabelOnly(materialForm)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["materialForm"],
          message: messages.otherFormRequired,
        });
      }

      const cleanliness = values.cleanliness?.trim() ?? "";
      if (cleanliness && isOtherCleanlinessLabelOnly(cleanliness)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["cleanliness"],
          message: messages.otherCleanlinessRequired,
        });
      }
    });
}

export type CreateMaterialFormValues = z.infer<
  ReturnType<typeof createMaterialFormSchema>
>;
