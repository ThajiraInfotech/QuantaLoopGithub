"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  MATERIAL_PHOTO_ACCEPT,
  MAX_MATERIAL_PHOTO_BYTES,
  MAX_MATERIAL_PHOTOS,
} from "@/constants/material-photos";
import { uploadMaterialImage } from "@/services/materials/material.service";
import { cn } from "@/lib/utils";

type MaterialPhotoFieldProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
};

export function MaterialPhotoField({
  value,
  onChange,
  disabled = false,
}: MaterialPhotoFieldProps) {
  const t = useTranslations("materials.form.photos");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length || disabled || uploading) return;

    const remaining = MAX_MATERIAL_PHOTOS - value.length;
    if (remaining <= 0) {
      toast.error(t("maxReached", { count: MAX_MATERIAL_PHOTOS }));
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        if (!MATERIAL_PHOTO_ACCEPT.split(",").includes(file.type)) {
          toast.error(t("invalidType"));
          continue;
        }
        if (file.size > MAX_MATERIAL_PHOTO_BYTES) {
          toast.error(t("tooLarge"));
          continue;
        }
        const url = await uploadMaterialImage(file);
        uploaded.push(url);
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded].slice(0, MAX_MATERIAL_PHOTOS));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("uploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function removePhoto(url: string) {
    onChange(value.filter((item) => item !== url));
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{t("label")}</Label>
        <p className="text-xs text-zinc-500">{t("hint", { count: MAX_MATERIAL_PHOTOS })}</p>
      </div>

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url) => (
            <div
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
            >
              <img
                src={url}
                alt={t("previewAlt")}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => removePhoto(url)}
                className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
              >
                {t("remove")}
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={MATERIAL_PHOTO_ACCEPT}
          multiple
          className="hidden"
          disabled={disabled || uploading || value.length >= MAX_MATERIAL_PHOTOS}
          onChange={(e) => void handleFilesSelected(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || uploading || value.length >= MAX_MATERIAL_PHOTOS}
          onClick={() => inputRef.current?.click()}
          className={cn(uploading && "opacity-70")}
        >
          {uploading ? t("uploading") : t("addPhotos")}
        </Button>
        <span className="text-xs text-zinc-500">
          {t("count", { current: value.length, max: MAX_MATERIAL_PHOTOS })}
        </span>
      </div>
    </div>
  );
}
