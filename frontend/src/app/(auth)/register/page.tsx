import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Direct sign-up is not a shortcut — new accounts start at role selection. */
export default function RegisterPage() {
  redirect(ROUTES.onboardingRole);
}
