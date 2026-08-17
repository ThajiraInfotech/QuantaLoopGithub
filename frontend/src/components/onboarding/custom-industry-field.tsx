"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CustomIndustryFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CustomIndustryField({ value, onChange }: CustomIndustryFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="custom-industry">Other industry (optional)</Label>
      <Input
        id="custom-industry"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Battery recycling, e-waste recovery, lithium processing"
        className="border-zinc-200 bg-white"
        maxLength={120}
      />
    </div>
  );
}
