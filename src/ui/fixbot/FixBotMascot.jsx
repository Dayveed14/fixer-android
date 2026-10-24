import "./fixbot.css";

/**
 * FixBot — Fixer's repair robot. Pure SVG + CSS, no image files.
 *
 * mood:
 *   idle      — a little dance, screwdriver twirling
 *   thinking  — leans in, screwdriver spins fast, antenna blinks
 *   happy     — hops and waves (an answer was found)
 *   puzzled   — head tilt with a question mark (no confident answer)
 *   oops      — droops (something went wrong)
 *
 * Motion is switched off for people who ask for reduced motion.
 */
export default function FixBotMascot({ mood = "idle", size = 168, className = "" }) {
  return (
    <div
      className={`fixbot fixbot--${mood} ${className}`}
      style={{ width: size, height: size * 1.1 }}
      role="img"
      aria-label={`FixBot, Fixer's repair robot, ${
        { idle: "dancing", thinking: "thinking", happy: "celebrating", puzzled: "puzzled", oops: "looking worried" }[mood] || "waving"
      }`}>
      <svg viewBox="0 0 200 220" width="100%" height="100%" aria-hidden="true" focusable="false">
        {/* floor shadow */}
        <ellipse className="fixbot__shadow" cx="100" cy="210" rx="46" ry="7" />

        <g className="fixbot__body-group">
          {/* legs */}
          <g className="fixbot__leg fixbot__leg--l">
            <rect x="72" y="168" width="18" height="30" rx="9" fill="#1a1d2e" />
            <rect x="64" y="190" width="30" height="13" rx="6.5" fill="#1a1d2e" />
          </g>
          <g className="fixbot__leg fixbot__leg--r">
            <rect x="110" y="168" width="18" height="30" rx="9" fill="#1a1d2e" />
            <rect x="106" y="190" width="30" height="13" rx="6.5" fill="#1a1d2e" />
          </g>

          {/* left arm (waving) */}
          <g className="fixbot__arm fixbot__arm--wave">
            <rect x="30" y="118" width="32" height="15" rx="7.5" fill="#4F6AF0" stroke="#1a1d2e" strokeWidth="3" />
            <circle cx="30" cy="125" r="10" fill="#fff" stroke="#1a1d2e" strokeWidth="3" />
          </g>

          {/* right arm with screwdriver */}
          <g className="fixbot__arm fixbot__arm--tool">
            <rect x="138" y="118" width="32" height="15" rx="7.5" fill="#4F6AF0" stroke="#1a1d2e" strokeWidth="3" />
            <g className="fixbot__screwdriver">
              <rect x="166" y="70" width="7" height="44" rx="2.5" fill="#e6e9f5" stroke="#1a1d2e" strokeWidth="2.5" />
              <path d="M166 71 l3.5 -11 l3.5 11 z" fill="#e6e9f5" stroke="#1a1d2e" strokeWidth="2.5" strokeLinejoin="round" />
              <rect x="159" y="106" width="21" height="30" rx="8" fill="#FFC845" stroke="#1a1d2e" strokeWidth="3" />
              <line x1="164" y1="114" x2="175" y2="114" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="164" y1="121" x2="175" y2="121" stroke="#1a1d2e" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            <circle cx="170" cy="125" r="10" fill="#fff" stroke="#1a1d2e" strokeWidth="3" />
          </g>

          {/* t-shirt torso with the Fixer logo */}
          <path
            d="M58 112 q0 -10 12 -12 h60 q12 2 12 12 l10 18 l-14 7 l-4 -8 v41 q0 8 -8 8 h-52 q-8 0 -8 -8 v-41 l-4 8 l-14 -7 z"
            fill="#4F6AF0"
            stroke="#1a1d2e"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M86 100 q14 10 28 0" fill="none" stroke="#1a1d2e" strokeWidth="3" strokeLinecap="round" />
          <rect x="74" y="128" width="52" height="24" rx="8" fill="#fff" />
          <text x="100" y="146" textAnchor="middle" fontFamily="Sora, 'Segoe UI', sans-serif" fontWeight="800" fontSize="17" letterSpacing="-0.5">
            <tspan fill="#4F6AF0">fix</tspan>
            <tspan fill="#1a1d2e">er</tspan>
          </text>

          {/* head */}
          <g className="fixbot__head">
            <line x1="100" y1="30" x2="100" y2="14" stroke="#1a1d2e" strokeWidth="3" strokeLinecap="round" />
            <circle className="fixbot__bulb" cx="100" cy="11" r="7" fill="#FFC845" stroke="#1a1d2e" strokeWidth="3" />
            <circle cx="44" cy="64" r="9" fill="#4F6AF0" stroke="#1a1d2e" strokeWidth="3" />
            <circle cx="156" cy="64" r="9" fill="#4F6AF0" stroke="#1a1d2e" strokeWidth="3" />
            <rect x="48" y="28" width="104" height="74" rx="30" fill="#fff" stroke="#1a1d2e" strokeWidth="3" />
            <rect x="60" y="40" width="80" height="50" rx="20" fill="#1a1d2e" />
            {/* eyes */}
            <g className="fixbot__eyes">
              <rect className="fixbot__eye" x="76" y="54" width="12" height="16" rx="6" fill="#8FE3FF" />
              <rect className="fixbot__eye" x="112" y="54" width="12" height="16" rx="6" fill="#8FE3FF" />
            </g>
            <path className="fixbot__mouth" d="M88 78 q12 9 24 0" fill="none" stroke="#8FE3FF" strokeWidth="3" strokeLinecap="round" />
            <circle cx="70" cy="76" r="4" fill="#ff8fab" opacity="0.7" />
            <circle cx="130" cy="76" r="4" fill="#ff8fab" opacity="0.7" />
          </g>
        </g>

        {/* mood extras */}
        <g className="fixbot__sparks" fill="#FFC845">
          <path d="M28 40 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
          <path d="M176 30 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" />
          <circle cx="182" cy="70" r="3" />
        </g>
        <text className="fixbot__question" x="166" y="40" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="34" fill="#FFC845" stroke="#1a1d2e" strokeWidth="2">
          ?
        </text>
        <g className="fixbot__dots" fill="#fff">
          <circle cx="160" cy="34" r="4" />
          <circle cx="172" cy="34" r="4" />
          <circle cx="184" cy="34" r="4" />
        </g>
      </svg>
    </div>
  );
}
