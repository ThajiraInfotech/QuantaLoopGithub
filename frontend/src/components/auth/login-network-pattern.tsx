import { loginTheme } from "@/components/auth/login-theme";

/** Subtle network texture — felt, not seen (~6% opacity). */
export function LoginNetworkPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ color: loginTheme.textPrimary }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="login-network-pattern"
            width="140"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="24" cy="22" r="2.5" fill="currentColor" opacity="0.06" />
            <line
              x1="27"
              y1="22"
              x2="88"
              y2="22"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.06"
            />
            <circle cx="91" cy="22" r="2.5" fill="currentColor" opacity="0.06" />

            <circle cx="62" cy="58" r="2.5" fill="currentColor" opacity="0.06" />
            <line
              x1="65"
              y1="58"
              x2="118"
              y2="58"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.06"
            />
            <circle cx="121" cy="58" r="2.5" fill="currentColor" opacity="0.06" />

            <circle cx="24" cy="94" r="2.5" fill="currentColor" opacity="0.06" />
            <line
              x1="27"
              y1="94"
              x2="88"
              y2="94"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.06"
            />
            <circle cx="91" cy="94" r="2.5" fill="currentColor" opacity="0.06" />

            <line
              x1="24"
              y1="25"
              x2="62"
              y2="55"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.06"
            />
            <line
              x1="91"
              y1="25"
              x2="121"
              y2="55"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.06"
            />
            <line
              x1="62"
              y1="61"
              x2="24"
              y2="91"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.06"
            />
          </pattern>

          <radialGradient id="login-network-fade" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor={loginTheme.bgLeft} stopOpacity="0" />
            <stop offset="55%" stopColor={loginTheme.bgLeft} stopOpacity="0" />
            <stop offset="100%" stopColor={loginTheme.bgLeft} stopOpacity="0.9" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#login-network-pattern)" />
        <rect width="100%" height="100%" fill="url(#login-network-fade)" />
      </svg>
    </div>
  );
}
