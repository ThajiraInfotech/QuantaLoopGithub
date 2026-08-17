export type PasswordStrength = "weak" | "medium" | "strong";

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}

export function passwordStrengthLabel(strength: PasswordStrength): string {
  if (strength === "weak") return "Weak";
  if (strength === "medium") return "Medium";
  return "Strong";
}

export function passwordStrengthClass(strength: PasswordStrength): string {
  if (strength === "weak") return "bg-red-500";
  if (strength === "medium") return "bg-amber-500";
  return "bg-emerald-500";
}
