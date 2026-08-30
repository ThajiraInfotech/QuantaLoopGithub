/**
 * Flat solid-silhouette globe (Atlantic: Americas + Europe/Africa).
 * Same visual weight as IndiaMapIcon — filled land + thin ring.
 */
export function EarthGlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="M26.0 7.3L30.3 9.0L34.0 8.0L36.5 10.3L34.0 18.3L28.0 22.5L26.8 20.0L27.5 14.8L24.5 12.0L23.3 14.5L25.3 19.3L22.8 21.8L24.0 22.3L25.8 27.5L21.3 28.3L17.8 32.5L17.8 34.5L20.5 36.3L17.0 35.3L16.3 32.8L13.0 34.5L13.8 36.0L15.8 35.0L17.0 38.5L22.3 38.3L29.5 42.8L28.3 47.3L22.5 53.5L23.0 58.8L20.3 57.3L20.0 46.5L17.0 43.0L17.8 39.5L11.0 36.3L7.0 30.3L7.5 25.8L6.0 19.3L9.3 14.3L13.8 15.0L13.3 12.8L15.8 11.5L15.8 10.0L18.5 9.0L22.0 9.8L23.0 8.0L25.8 7.5Z" />
      <path d="M50.5 12.8L50.5 17.3L52.0 17.0L52.0 15.0L54.3 14.5L56.3 16.5L60.5 29.3L59.8 39.0L57.3 35.5L54.5 34.3L49.3 42.5L49.8 45.5L52.0 44.5L51.0 48.3L49.8 48.0L49.3 45.5L46.3 50.3L43.3 51.0L40.8 40.5L36.0 40.0L34.0 37.8L34.3 34.5L36.5 31.5L36.3 28.8L37.8 28.3L36.0 26.0L37.0 23.3L39.8 25.3L39.5 22.0L41.8 18.5L43.5 17.5L48.0 18.5L50.3 13.0Z" />
      <circle
        cx="32"
        cy="32"
        r="29.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
      />
    </svg>
  );
}
