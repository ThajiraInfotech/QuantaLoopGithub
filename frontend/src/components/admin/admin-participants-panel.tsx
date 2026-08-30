"use client";



import Link from "next/link";

import { useSearchParams } from "next/navigation";

import { useCallback, useEffect, useState } from "react";

import toast from "react-hot-toast";



import { RoleBadge } from "@/components/trust/role-badge";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {

  Card,

  CardContent,

  CardDescription,

  CardHeader,

  CardTitle,

} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { ROUTES } from "@/constants/routes";

import {

  fetchAdminParticipants,

  fetchAllAdminParticipants,

} from "@/services/admin/admin.service";

import type { AdminParticipantRow, AdminParticipantSummary, AdminMembershipStatus } from "@/types/admin";

import type { AccountStatus } from "@/types/admin";

import type { UserRole } from "@/types/user";

import { formatMediumDate, formatRelativeTime } from "@/utils/format-relative-time";



const ROLE_LABELS: Record<UserRole, string> = {

  material_provider: "Seller",

  verified_buyer: "Buyer",

  admin: "Admin",

};



const MEMBERSHIP_LABELS: Record<AdminMembershipStatus, string> = {

  paid: "Paid",

  trial_active: "Trial active",

  trial_ended: "Trial ended",

  no_trial: "No trial",

};



const SEARCH_DEBOUNCE_MS = 400;



function AccountStatusBadge({ status }: { status: AccountStatus }) {

  if (status === "suspended") {

    return (

      <Badge variant="destructive" className="gap-1">

        <span aria-hidden>🔴</span>

        Suspended

      </Badge>

    );

  }



  return (

    <Badge variant="success" className="gap-1">

      <span aria-hidden>🟢</span>

      Active

    </Badge>

  );

}



function MembershipStatusBadge({
  status,
}: {
  status?: AdminMembershipStatus;
}) {
  if (!status || status === "no_trial") {
    return (
      <Badge variant="outline" className="gap-1">
        No trial
      </Badge>
    );
  }
  if (status === "paid") {
    return (
      <Badge variant="success" className="gap-1">
        Paid
      </Badge>
    );
  }
  if (status === "trial_active") {
    return (
      <Badge variant="outline" className="gap-1 border-sky-200 bg-sky-50 text-sky-800">
        Trial active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-900">
      Trial ended
    </Badge>
  );
}

function participantSubtitle(row: AdminParticipantRow) {

  const role = ROLE_LABELS[row.role];

  const account = row.accountStatus === "suspended" ? "Suspended" : "Active";
  const membership = row.membershipStatus
    ? MEMBERSHIP_LABELS[row.membershipStatus]
    : null;

  return membership
    ? `${role} • ${account} • ${membership}`
    : `${role} • ${account}`;

}



function downloadParticipantsCsv(rows: AdminParticipantRow[]) {

  const escape = (value: string) => {

    if (/[",\n]/.test(value)) {

      return `"${value.replace(/"/g, '""')}"`;

    }

    return value;

  };



  const header = [

    "Company",

    "Name",

    "Email",

    "Role",

    "Account Status",

    "Membership",

    "Trial ends",

    "Joined",

    "Last Activity",

  ];



  const lines = [

    header.join(","),

    ...rows.map((row) =>

      [

        row.companyName,

        row.name,

        row.email,

        ROLE_LABELS[row.role],

        row.accountStatus,

        row.membershipStatus
          ? MEMBERSHIP_LABELS[row.membershipStatus]
          : "",

        row.trialEndsAt ? formatMediumDate(row.trialEndsAt) : "",

        formatMediumDate(row.createdAt),

        formatMediumDate(row.lastActivityAt),

      ]

        .map(escape)

        .join(",")

    ),

  ];



  const blob = new Blob([lines.join("\n")], {

    type: "text/csv;charset=utf-8;",

  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;

  anchor.download = `participants-${new Date().toISOString().slice(0, 10)}.csv`;

  anchor.click();

  URL.revokeObjectURL(url);

}



function SummaryKpiCard({

  label,

  value,

  active,

  onClick,

}: {

  label: string;

  value: number;

  active?: boolean;

  onClick: () => void;

}) {

  return (

    <button

      type="button"

      onClick={onClick}

      className="group block w-full text-left"

    >

      <Card

        className={

          active

            ? "border-zinc-400 bg-zinc-50/80 ring-1 ring-zinc-300"

            : "border-zinc-200/80 transition-colors group-hover:border-zinc-300 group-hover:bg-zinc-50/50"

        }

      >

        <CardHeader className="pb-2">

          <CardDescription className="text-xs font-medium uppercase tracking-wide">

            {label}

          </CardDescription>

        </CardHeader>

        <CardContent>

          <p className="text-3xl font-semibold tabular-nums text-zinc-900 group-hover:text-zinc-950">

            {value}

          </p>

        </CardContent>

      </Card>

    </button>

  );

}



export function AdminParticipantsPanel() {

  const searchParams = useSearchParams();

  const [items, setItems] = useState<AdminParticipantRow[]>([]);

  const [summary, setSummary] = useState<AdminParticipantSummary | null>(null);

  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  const [accountFilter, setAccountFilter] = useState<AccountStatus | "all">(

    () => (searchParams.get("account") === "suspended" ? "suspended" : "all")

  );

  const [loading, setLoading] = useState(true);

  const [exporting, setExporting] = useState(false);

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    const timer = window.setTimeout(() => {

      setSearch(searchInput.trim());

      setPage(1);

    }, SEARCH_DEBOUNCE_MS);



    return () => window.clearTimeout(timer);

  }, [searchInput]);



  const load = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const result = await fetchAdminParticipants({

        search,

        role: roleFilter,

        accountStatus: accountFilter,

        page,

        limit: 20,

      });

      setItems(result.items);

      setTotal(result.total);

      setSummary(result.summary);

    } catch (e) {

      setError(e instanceof Error ? e.message : "Unable to load participants");

    } finally {

      setLoading(false);

    }

  }, [search, roleFilter, accountFilter, page]);



  useEffect(() => {

    void load();

  }, [load]);



  async function handleExportCsv() {

    setExporting(true);

    try {

      const rows = await fetchAllAdminParticipants({

        search,

        role: roleFilter,

        accountStatus: accountFilter,

      });

      if (rows.length === 0) {

        toast.error("No participants to export");

        return;

      }

      downloadParticipantsCsv(rows);

      toast.success(`Exported ${rows.length} participant${rows.length === 1 ? "" : "s"}`);

    } catch (e) {

      toast.error(e instanceof Error ? e.message : "Export failed");

    } finally {

      setExporting(false);

    }

  }



  function applyKpiFilter(

    nextRole: UserRole | "all",

    nextAccount: AccountStatus | "all"

  ) {

    setPage(1);

    setRoleFilter(nextRole);

    setAccountFilter(nextAccount);

  }



  const totalPages = Math.max(1, Math.ceil(total / 20));

  const kpiTotalActive =

    roleFilter === "all" && accountFilter === "all";

  const kpiProvidersActive = roleFilter === "material_provider";

  const kpiBuyersActive = roleFilter === "verified_buyer";

  const kpiSuspendedActive = accountFilter === "suspended";



  return (

    <div className="mx-auto max-w-6xl space-y-6">

      <div>

        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">

          Participants

        </h1>

        <p className="mt-2 text-sm text-zinc-600">

          Monitor growth and manage participant accounts across the network.

        </p>

      </div>



      {summary ? (

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

          <SummaryKpiCard

            label="Total participants"

            value={summary.total}

            active={kpiTotalActive}

            onClick={() => applyKpiFilter("all", "all")}

          />

          <SummaryKpiCard

            label="Sellers"

            value={summary.providers}

            active={kpiProvidersActive}

            onClick={() => applyKpiFilter("material_provider", "all")}

          />

          <SummaryKpiCard

            label="Buyers"

            value={summary.buyers}

            active={kpiBuyersActive}

            onClick={() => applyKpiFilter("verified_buyer", "all")}

          />

          <SummaryKpiCard

            label="With access"

            value={summary.withAccess ?? 0}

            active={false}

            onClick={() => applyKpiFilter("all", "all")}

          />

          <SummaryKpiCard

            label="Trial ended"

            value={summary.trialEnded ?? 0}

            active={false}

            onClick={() => applyKpiFilter("all", "all")}

          />

          <SummaryKpiCard

            label="Suspended"

            value={summary.suspended}

            active={kpiSuspendedActive}

            onClick={() => applyKpiFilter("all", "suspended")}

          />

        </div>

      ) : null}



      <Card className="border-zinc-200/80">

        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <CardTitle className="text-base">Participant Directory</CardTitle>

            <CardDescription>

              {total} participant{total === 1 ? "" : "s"}

            </CardDescription>

          </div>

          <Button

            type="button"

            size="sm"

            variant="outline"

            disabled={exporting || loading}

            onClick={() => void handleExportCsv()}

          >

            {exporting ? "Exporting…" : "Export CSV"}

          </Button>

        </CardHeader>

        <CardContent className="space-y-4">

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">

            <div className="min-w-[200px] flex-1">

              <label

                htmlFor="participant-search"

                className="mb-1 block text-xs font-medium text-zinc-600"

              >

                Search

              </label>

              <Input

                id="participant-search"

                placeholder="Company, name, or email"

                value={searchInput}

                onChange={(e) => setSearchInput(e.target.value)}

              />

            </div>

            <div>

              <label

                htmlFor="role-filter"

                className="mb-1 block text-xs font-medium text-zinc-600"

              >

                Role

              </label>

              <select

                id="role-filter"

                value={roleFilter}

                onChange={(e) => {

                  setPage(1);

                  setRoleFilter(e.target.value as UserRole | "all");

                }}

                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"

              >

                <option value="all">All roles</option>

                <option value="material_provider">Seller</option>

                <option value="verified_buyer">Buyer</option>

              </select>

            </div>

            <div>

              <label

                htmlFor="account-filter"

                className="mb-1 block text-xs font-medium text-zinc-600"

              >

                Account status

              </label>

              <select

                id="account-filter"

                value={accountFilter}

                onChange={(e) => {

                  setPage(1);

                  setAccountFilter(e.target.value as AccountStatus | "all");

                }}

                className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900"

              >

                <option value="all">All</option>

                <option value="active">Active</option>

                <option value="suspended">Suspended</option>

              </select>

            </div>

          </div>



          {error ? (

            <p className="text-sm text-red-600" role="alert">

              {error}

            </p>

          ) : null}



          {loading ? (

            <div className="h-40 animate-pulse rounded-lg bg-zinc-50" />

          ) : items.length === 0 ? (

            <p className="text-sm text-zinc-500">No participants match your filters.</p>

          ) : (

            <div className="overflow-x-auto rounded-lg border border-zinc-100">

              <table className="w-full min-w-[640px] text-left text-sm">

                <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">

                  <tr>

                    <th className="px-3 py-2.5">Company</th>

                    <th className="px-3 py-2.5">Role</th>

                    <th className="px-3 py-2.5">Account</th>

                    <th className="px-3 py-2.5">Membership</th>

                    <th className="px-3 py-2.5">Joined</th>

                    <th className="px-3 py-2.5">Last Activity</th>

                    <th className="px-3 py-2.5 text-right">Actions</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-zinc-100">

                  {items.map((row) => (

                    <tr key={row.id} className="bg-white">

                      <td className="px-3 py-3">

                        <p className="font-medium text-zinc-900">

                          {row.companyName}

                        </p>

                        <p className="text-xs text-zinc-500">

                          {participantSubtitle(row)}

                        </p>

                      </td>

                      <td className="px-3 py-3">

                        <RoleBadge role={row.role} />

                      </td>

                      <td className="px-3 py-3">

                        <AccountStatusBadge status={row.accountStatus} />

                      </td>

                      <td className="px-3 py-3">

                        <MembershipStatusBadge status={row.membershipStatus} />

                      </td>

                      <td className="px-3 py-3 text-xs text-zinc-500">

                        {formatRelativeTime(row.createdAt)}

                      </td>

                      <td className="px-3 py-3 text-xs text-zinc-500">

                        {formatRelativeTime(row.lastActivityAt)}

                      </td>

                      <td className="px-3 py-3 text-right">

                        <Link

                          href={ROUTES.adminParticipantDetail(row.id)}

                          className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-small text-foreground hover:bg-muted"

                        >

                          View

                        </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}



          {totalPages > 1 ? (

            <div className="flex items-center justify-between pt-2">

              <p className="text-xs text-zinc-500">

                Page {page} of {totalPages}

              </p>

              <div className="flex gap-2">

                <Button

                  type="button"

                  size="sm"

                  variant="outline"

                  disabled={page <= 1}

                  onClick={() => setPage((p) => Math.max(1, p - 1))}

                >

                  Previous

                </Button>

                <Button

                  type="button"

                  size="sm"

                  variant="outline"

                  disabled={page >= totalPages}

                  onClick={() => setPage((p) => p + 1)}

                >

                  Next

                </Button>

              </div>

            </div>

          ) : null}

        </CardContent>

      </Card>

    </div>

  );

}


