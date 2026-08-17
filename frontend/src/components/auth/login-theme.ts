/** Login page tokens — enterprise SaaS palette (scoped to auth login only). */
export const loginTheme = {
  green: "#22B573",
  greenHover: "#1D9F66",
  greenBadgeBg: "#DFF5EA",
  greenBadgeBorder: "#B5E8D0",
  greenBadgeText: "#1D9F66",
  bgLeft: "#F8FAFC",
  bgRight: "#F1F5F9",
  card: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  inputBorder: "#CBD5E1",
  panelDivider: "rgba(15, 23, 42, 0.06)",
} as const;

export const loginInputClass =
  "flex h-[52px] w-full rounded-xl border border-[#CBD5E1] bg-white px-4 text-[15px] text-[#0F172A] shadow-none transition-[border-color,box-shadow] placeholder:text-[#64748B] focus-visible:border-[#22B573] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22B573]/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50";

export const loginPasswordInputClass = `${loginInputClass} pr-12`;

export const loginButtonClass =
  "flex h-[54px] w-full items-center justify-center rounded-xl border-0 bg-[#22B573] text-base font-semibold text-white shadow-[0_4px_14px_rgba(34,181,115,0.2)] transition-colors hover:bg-[#1D9F66] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22B573]/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const loginGoogleButtonClass =
  "flex h-[54px] w-full items-center justify-center gap-3 rounded-xl border bg-white text-[15px] font-medium text-[#0F172A] shadow-none transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22B573]/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const loginLabelClass = "text-sm font-medium text-[#0F172A]";

export const loginLinkClass =
  "text-sm font-medium text-[#22B573] underline-offset-4 transition-colors hover:text-[#1D9F66] hover:underline";

export const loginErrorClass = "text-[14px] text-[#DC2626]";
