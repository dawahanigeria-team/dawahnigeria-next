/**
 * Decorative diamond-lattice pattern with three blurred lime orbs, ported from
 * CRA's `auth/Auth.jsx`. Purely presentational — inert to screen readers.
 *
 * The orbs drift on a 20s loop, offset so they never sync up; the animation is
 * dropped entirely under `prefers-reduced-motion`.
 */
export function AuthGeometricBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-60" aria-hidden>
      <svg
        className="h-full w-full text-foreground"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="auth-geometric-pattern"
            x="0"
            y="0"
            width="100"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M50 0 L100 50 L50 100 L0 50 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              opacity="0.15"
            />
            <circle cx="50" cy="50" r="3" fill="currentColor" opacity="0.2" />
          </pattern>
          <linearGradient id="auth-lime-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ddff2b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8faa00" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <rect width="800" height="800" fill="url(#auth-geometric-pattern)" />
        <circle
          className="auth-orb"
          style={{ animationDelay: "0s" }}
          cx="150"
          cy="150"
          r="100"
          fill="url(#auth-lime-glow)"
        />
        <circle
          className="auth-orb"
          style={{ animationDelay: "-7s" }}
          cx="650"
          cy="600"
          r="120"
          fill="url(#auth-lime-glow)"
        />
        <circle
          className="auth-orb"
          style={{ animationDelay: "-14s" }}
          cx="700"
          cy="200"
          r="80"
          fill="url(#auth-lime-glow)"
        />
      </svg>
    </div>
  );
}
