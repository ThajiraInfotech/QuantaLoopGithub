"use client";

import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  filterCitiesForState,
  getCitiesForStateCode,
  getCityPlaceholderForState,
  resolveCityForState,
} from "@/constants/indian-state-cities";
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

function mergeCities(base: string[], extra: string[]): string[] {
  const seen = new Set(base.map((city) => city.trim().toLowerCase()));
  const merged = [...base];
  for (const city of extra) {
    const key = city.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(city);
  }
  return merged.sort((a, b) => a.localeCompare(b));
}

function readCityNames(payload: unknown): string[] {
  const data = (payload as { data?: { cities?: Array<{ name?: string } | string> } })
    ?.data;
  const cities = data?.cities ?? [];
  return cities
    .map((city) => (typeof city === "string" ? city : city?.name ?? ""))
    .filter(Boolean);
}

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
  const queryRef = useRef(value);
  const valueRef = useRef(value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [catalog, setCatalog] = useState<string[]>(() =>
    stateCode ? getCitiesForStateCode(stateCode) : []
  );
  const requestIdRef = useRef(0);

  queryRef.current = query;
  valueRef.current = value;

  useEffect(() => {
    const local = stateCode ? getCitiesForStateCode(stateCode) : [];
    setCatalog(local);
    setQuery(value);
    queryRef.current = value;
    setOpen(false);
  }, [stateCode]);

  useEffect(() => {
    if (open) return;
    setQuery(value);
    queryRef.current = value;
  }, [value, open]);

  useEffect(() => {
    if (!stateCode || disabled) return;

    const localRequestId = (requestIdRef.current += 1);
    const controller = new AbortController();

    void apiClient
      .get("/locations/cities", {
        params: { stateCode, search: "", limit: 80, t: Date.now() },
        headers: { "Cache-Control": "no-cache" },
        signal: controller.signal,
      })
      .then((res) => {
        if (localRequestId !== requestIdRef.current) return;
        const remote = readCityNames(res.data);
        setCatalog((current) =>
          mergeCities(getCitiesForStateCode(stateCode), [
            ...current,
            ...remote,
          ])
        );
      })
      .catch(() => {
        /* Local city list remains available. */
      });

    return () => {
      controller.abort();
    };
  }, [stateCode, disabled]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q || norm(q) === norm(value)) return catalog;
    const fromCatalog = catalog.filter((city) =>
      city.toLowerCase().includes(q.toLowerCase())
    );
    if (fromCatalog.length > 0) return fromCatalog;
    return filterCitiesForState(stateCode, q);
  }, [catalog, query, value, stateCode]);

  async function commitCity(raw: string) {
    if (!stateCode) return;

    const trimmed = raw.trim();
    if (!trimmed) {
      onChange("");
      onErrorChange?.(null);
      return;
    }

    const localMatch =
      resolveCityForState(stateCode, trimmed) ??
      catalog.find((city) => norm(city) === norm(trimmed));
    if (localMatch) {
      onChange(localMatch);
      setQuery(localMatch);
      onErrorChange?.(null);
      setOpen(false);
      return;
    }

    try {
      const res = await apiClient.get("/locations/cities/resolve", {
        params: { stateCode, city: trimmed, t: Date.now() },
        headers: { "Cache-Control": "no-cache" },
      });
      const resolved = (res.data as { data?: { city?: string } })?.data?.city;
      if (!resolved) throw new Error("No resolved city");
      onChange(resolved);
      setQuery(resolved);
      onErrorChange?.(null);
      setOpen(false);
    } catch {
      onErrorChange?.(t("cityErrorInvalid"));
    }
  }

  const commitCityRef = useRef(commitCity);
  commitCityRef.current = commitCity;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        const latest = queryRef.current.trim();
        const selected = valueRef.current;
        if (latest && norm(latest) !== norm(selected)) {
          void commitCityRef.current(latest);
        }
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleSelect(city: string) {
    onChange(city);
    setQuery(city);
    onErrorChange?.(null);
    setOpen(false);
  }

  function handleInputChange(next: string) {
    setQuery(next);
    setOpen(true);
    onErrorChange?.(null);
    if (!next.trim() && value) onChange("");
  }

  const showList = Boolean(open && !disabled && stateCode);
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
          onFocus={() => {
            if (!stateCode || disabled) return;
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) handleSelect(filtered[0]);
            }
          }}
          placeholder={placeholder}
          disabled={disabled || !stateCode}
          className="h-12 border-zinc-200 bg-white pl-9 pr-9 text-base disabled:opacity-50 sm:h-10 sm:text-small"
          autoComplete="off"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
      </div>

      {showList ? (
        filtered.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            className="max-h-[min(18rem,45dvh)] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white shadow-sm sm:max-h-52 sm:rounded-md"
          >
            {filtered.map((city) => {
              const selected = norm(city) === norm(value);
              return (
                <li key={city} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-12 w-full items-center px-3 py-3 text-left text-base transition-colors sm:min-h-0 sm:py-2.5 sm:text-sm",
                      selected
                        ? "bg-[#F7FCF9] font-medium text-[#33B573]"
                        : "text-zinc-800 hover:bg-zinc-50"
                    )}
                    onPointerDown={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(city)}
                  >
                    {city}
                  </button>
                </li>
              );
            })}
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
