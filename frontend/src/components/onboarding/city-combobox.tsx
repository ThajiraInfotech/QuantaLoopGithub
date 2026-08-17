"use client";

import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCityPlaceholderForState } from "@/constants/indian-state-cities";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/api/client";

type CityComboboxProps = {
  stateCode: string;
  value: string;
  onChange: (city: string) => void;
  disabled?: boolean;
  error?: string | null;
  onErrorChange?: (message: string | null) => void;
};

export function CityCombobox({
  stateCode,
  value,
  onChange,
  disabled = false,
  error,
  onErrorChange,
}: CityComboboxProps) {
  const t = useTranslations("onboarding.location");
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [remoteCities, setRemoteCities] = useState<string[]>([]);
  const [matchedCities, setMatchedCities] = useState(0);
  const [loadingCities, setLoadingCities] = useState(false);
  const requestIdRef = useRef(0);

  const filtered = remoteCities;

  // Keep the input in sync when parent clears/changes the selected city.
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!stateCode) {
      setRemoteCities([]);
      setMatchedCities(0);
      return;
    }
    if (!open || disabled) return;

    const localRequestId = (requestIdRef.current += 1);

    // If the input still shows the currently selected city, browse the full
    // state list instead of filtering to that one name.
    const search =
      query.trim() && norm(query) !== norm(value) ? query.trim() : "";
    const limit = search ? 50 : 80;

    setLoadingCities(true);
    const timeout = window.setTimeout(async () => {
      try {
        const res = await apiClient.get("/locations/cities", {
          params: {
            stateCode,
            search,
            limit,
          },
        });
        if (localRequestId !== requestIdRef.current) return;

        const data = res.data?.data ?? {};
        const cities: Array<{ name: string; stateCode: string }> =
          data.cities ?? [];
        setRemoteCities(cities.map((c) => c.name).filter(Boolean));
        setMatchedCities(
          typeof data.matched === "number" ? data.matched : cities.length
        );
      } catch {
        if (localRequestId !== requestIdRef.current) return;
        setRemoteCities([]);
        setMatchedCities(0);
      } finally {
        if (localRequestId !== requestIdRef.current) return;
        setLoadingCities(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [stateCode, query, value, open, disabled]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function commitCity(raw: string) {
    if (!stateCode) return;

    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      onErrorChange?.(null);
      setOpen(false);
      return;
    }

    try {
      const res = await apiClient.get("/locations/cities/resolve", {
        params: {
          stateCode,
          city: trimmed,
        },
      });
      const resolved = res.data?.data?.city;
      if (!resolved) throw new Error("No resolved city");

      onChange(resolved);
      setQuery(resolved);
      onErrorChange?.(null);
      setOpen(false);
    } catch {
      onChange("");
      onErrorChange?.(t("cityErrorInvalid"));
    }
  }

  function handleSelect(city: string) {
    onChange(city);
    setQuery(city);
    onErrorChange?.(null);
    setOpen(false);
  }

  function handleInputChange(next: string) {
    setQuery(next);
    setOpen(true);

    if (norm(next) === norm(value)) {
      onErrorChange?.(null);
      return;
    }
    onChange("");
    onErrorChange?.(null);
  }

  function handleBlur() {
    window.setTimeout(() => {
      if (!query.trim()) {
        onChange("");
        onErrorChange?.(null);
        return;
      }
      void commitCity(query);
    }, 120);
  }

  const showList = Boolean(open && !disabled && stateCode);
  const isBrowsing =
    !query.trim() || norm(query) === norm(value);
  const placeholder = stateCode
    ? getCityPlaceholderForState(stateCode)
    : t("selectStateFirst");

  const hintText = !stateCode
    ? t("selectStateToSearch")
    : t("citySearchHint");

  return (
    <div ref={rootRef} className="space-y-2">
      <Label htmlFor="geo-city">
        {t("cityLabel")}{" "}
        <span className="font-normal text-zinc-500">{t("required")}</span>
      </Label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <Input
          id="geo-city"
          role="combobox"
          aria-expanded={showList || undefined}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={Boolean(error)}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => stateCode && setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "Enter" && filtered[0]) {
              e.preventDefault();
              handleSelect(filtered[0]);
            }
          }}
          placeholder={placeholder}
          disabled={disabled || !stateCode}
          className="border-zinc-200 bg-white pl-9 pr-9 disabled:opacity-50"
          autoComplete="off"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
      </div>

      {showList ? (
        loadingCities ? (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {t("loadingCities")}
          </p>
        ) : filtered.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="max-h-52 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-sm"
          >
            {filtered.map((city) => {
              const selected = norm(city) === norm(value);
              return (
                <li key={city} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-[#F7FCF9] font-medium text-[#33B573]"
                        : "text-zinc-800 hover:bg-zinc-50"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(city)}
                  >
                    {city}
                  </button>
                </li>
              );
            })}
            {matchedCities > filtered.length ? (
              <li className="border-t border-zinc-100 px-3 py-2 text-xs text-zinc-500">
                {isBrowsing
                  ? t("cityListTruncatedBrowse")
                  : t("cityListTruncatedSearch")}
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
            {t("noMatchingCities")}
          </p>
        )
      ) : null}

      <p className="text-sm text-zinc-500">{hintText}</p>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function norm(s: string) {
  return s.trim().toLowerCase();
}
