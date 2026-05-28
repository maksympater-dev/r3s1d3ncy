import type {CSSProperties} from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const COLORS = {
  ink: "#050604",
  panel: "#10120f",
  lime: "#a8ff3e",
  mint: "#6df6d9",
  paper: "#f4f1e8",
  red: "#ff4e42",
  olive: "#223117",
  line: "rgba(244, 241, 232, 0.18)",
};

const cities = [
  {name: "LONDON", label: "SELFRIDGES", x: 1120, y: 720},
  {name: "BIRMINGHAM", label: "BULLRING", x: 920, y: 560},
  {name: "MANCHESTER", label: "TRAFFORD", x: 850, y: 410},
  {name: "NEWCASTLE", label: "FENWICK", x: 1030, y: 245},
  {name: "GLASGOW", label: "FLANNELS", x: 710, y: 170},
];

const bars = [
  92, 126, 68, 154, 108, 184, 78, 136, 210, 98, 166, 118, 240, 84, 146, 188,
  104, 172, 72, 198, 116, 154, 88, 228, 132, 176, 96, 150,
];

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const absolute: CSSProperties = {
  position: "absolute",
  inset: 0,
};

const mono: CSSProperties = {
  fontFamily:
    "Arial Narrow, Arial, Helvetica, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  letterSpacing: 0,
};

const t = (frame: number, fps: number, start: number, end: number) =>
  interpolate(frame, [start * fps, end * fps], [0, 1], {
    ...clamp,
    easing: easeOut,
  });

const smooth = (frame: number, fps: number, start: number, end: number) =>
  interpolate(frame, [start * fps, end * fps], [0, 1], {
    ...clamp,
    easing: easeInOut,
  });

const Grid = ({frame, fps}: {frame: number; fps: number}) => {
  const reveal = t(frame, fps, 0.1, 1.15);
  const drift = interpolate(frame, [0, 240], [0, 34], clamp);

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={absolute}>
      <defs>
        <linearGradient id="gridFade" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={COLORS.lime} stopOpacity="0.22" />
          <stop offset="48%" stopColor={COLORS.paper} stopOpacity="0.04" />
          <stop offset="100%" stopColor={COLORS.mint} stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill={COLORS.ink} />
      <rect
        width="1920"
        height="1080"
        fill="url(#gridFade)"
        opacity={0.46 * reveal}
      />
      {Array.from({length: 49}).map((_, i) => {
        const x = i * 40 + (drift % 40);
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1="0"
            x2={x}
            y2="1080"
            stroke={COLORS.line}
            strokeWidth="1"
            opacity={0.5 * reveal}
          />
        );
      })}
      {Array.from({length: 28}).map((_, i) => {
        const y = i * 40 + ((drift * 0.7) % 40);
        return (
          <line
            key={`h-${i}`}
            x1="0"
            y1={y}
            x2="1920"
            y2={y}
            stroke={COLORS.line}
            strokeWidth="1"
            opacity={0.45 * reveal}
          />
        );
      })}
    </svg>
  );
};

const CityRoute = ({frame, fps}: {frame: number; fps: number}) => {
  const mapIn = t(frame, fps, 0.6, 1.8);
  const draw = t(frame, fps, 1.05, 5.7);
  const scanX = interpolate(frame, [0.8 * fps, 6.5 * fps], [-320, 2240], {
    ...clamp,
    easing: easeInOut,
  });
  const activeRaw = Math.floor((frame - 40) / 28);
  const activeIndex = Math.max(0, Math.min(cities.length - 1, activeRaw));

  return (
    <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={absolute}>
      <defs>
        <filter id="routeGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="scanClip">
          <path d="M 498 850 L 1210 835 L 1445 135 L 600 120 Z" />
        </clipPath>
      </defs>
      <path
        d="M 498 850 L 1210 835 L 1445 135 L 600 120 Z"
        fill="rgba(5, 6, 4, 0.35)"
        stroke={COLORS.lime}
        strokeWidth="2"
        opacity={0.5 * mapIn}
      />
      <path
        d="M 595 790 L 1340 748 L 1292 270 L 500 225 Z"
        fill="none"
        stroke={COLORS.paper}
        strokeWidth="2"
        opacity={0.22 * mapIn}
      />
      <g clipPath="url(#scanClip)" opacity={mapIn}>
        <rect
          x={scanX}
          y="0"
          width="210"
          height="1080"
          fill={COLORS.mint}
          opacity="0.1"
          transform="skewX(-14)"
        />
        <rect
          x={scanX + 72}
          y="0"
          width="5"
          height="1080"
          fill={COLORS.paper}
          opacity="0.42"
          transform="skewX(-14)"
        />
      </g>
      <path
        d="M 1120 720 C 1010 665 950 625 920 560 C 882 494 870 452 850 410 C 850 330 930 305 1030 245 C 910 214 806 195 710 170"
        fill="none"
        pathLength={1}
        stroke={COLORS.lime}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray="1"
        strokeDashoffset={1 - draw}
        filter="url(#routeGlow)"
        opacity={0.9}
      />
      <path
        d="M 1120 720 C 1010 665 950 625 920 560 C 882 494 870 452 850 410 C 850 330 930 305 1030 245 C 910 214 806 195 710 170"
        fill="none"
        pathLength={1}
        stroke={COLORS.paper}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.03 0.055"
        strokeDashoffset={-draw * 0.25}
        opacity={0.72}
      />
      {cities.map((city, index) => {
        const nodeIn = t(frame, fps, 1 + index * 0.55, 1.6 + index * 0.55);
        const active = index === activeIndex;
        const pulse = active
          ? 1 + Math.sin(frame / 5) * 0.13
          : interpolate(nodeIn, [0, 1], [0.72, 1], clamp);
        return (
          <g key={city.name} opacity={0.25 + nodeIn * 0.75}>
            <circle
              cx={city.x}
              cy={city.y}
              r={active ? 38 * pulse : 24 * pulse}
              fill={active ? COLORS.lime : COLORS.olive}
              opacity={active ? 0.2 : 0.16}
            />
            <circle
              cx={city.x}
              cy={city.y}
              r={active ? 16 * pulse : 10}
              fill={active ? COLORS.lime : COLORS.paper}
              stroke={active ? COLORS.paper : COLORS.lime}
              strokeWidth={active ? 3 : 2}
            />
            <text
              x={city.x + 34}
              y={city.y - 22}
              fill={active ? COLORS.paper : "rgba(244, 241, 232, 0.46)"}
              fontSize={active ? 28 : 20}
              fontWeight="800"
              style={mono}
            >
              {city.name}
            </text>
            <text
              x={city.x + 36}
              y={city.y + 8}
              fill={active ? COLORS.lime : "rgba(168, 255, 62, 0.36)"}
              fontSize="15"
              fontWeight="900"
              style={mono}
            >
              {city.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const Skyline = ({frame, fps}: {frame: number; fps: number}) => {
  const inValue = t(frame, fps, 2.4, 4.7);
  const exit = smooth(frame, fps, 6.7, 8);
  const opacity = inValue * (1 - exit * 0.25);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 320,
        opacity,
      }}
    >
      <svg width="1920" height="320" viewBox="0 0 1920 320" style={absolute}>
        <defs>
          <linearGradient id="skylineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={COLORS.red} stopOpacity="0.62" />
            <stop offset="45%" stopColor={COLORS.lime} stopOpacity="0.3" />
            <stop offset="100%" stopColor={COLORS.ink} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {bars.map((height, index) => {
          const local = t(frame, fps, 2.5 + index * 0.035, 3.4 + index * 0.035);
          const width = 54;
          const x = 120 + index * 62;
          const visibleHeight = height * local;
          return (
            <rect
              key={index}
              x={x}
              y={300 - visibleHeight}
              width={width}
              height={visibleHeight}
              fill="url(#skylineFill)"
              opacity={0.72}
            />
          );
        })}
        <path
          d="M0 294 C 280 248 420 310 710 270 C 960 236 1105 262 1290 226 C 1530 184 1710 238 1920 188 L1920 320 L0 320 Z"
          fill="rgba(5, 6, 4, 0.7)"
        />
      </svg>
    </div>
  );
};

const TitleLockup = ({frame, fps}: {frame: number; fps: number}) => {
  const preTitle = t(frame, fps, 0.7, 1.6);
  const titleIn = t(frame, fps, 4.15, 5.2);
  const final = t(frame, fps, 6.1, 7.05);
  const titleY = interpolate(titleIn, [0, 1], [62, 0], clamp);
  const cityIndex = Math.max(0, Math.min(cities.length - 1, Math.floor((frame - 40) / 28)));
  const city = cities[cityIndex];
  const typedLength = Math.floor(
    interpolate(frame, [0.8 * fps, 2.2 * fps], [0, 18], clamp),
  );

  return (
    <div style={absolute}>
      <div
        style={{
          position: "absolute",
          top: 64,
          left: 72,
          padding: "20px 28px",
          border: `1px solid rgba(168, 255, 62, ${0.35 + preTitle * 0.45})`,
          background: "rgba(8, 10, 7, 0.76)",
          color: COLORS.lime,
          fontSize: 18,
          fontWeight: 900,
          opacity: preTitle,
          ...mono,
        }}
      >
        {"CITY ACCESS BOOT".slice(0, typedLength)}
      </div>

      <div
        style={{
          position: "absolute",
          right: 92,
          top: 72,
          width: 420,
          border: "1px solid rgba(244, 241, 232, 0.18)",
          background: "rgba(10, 12, 9, 0.72)",
          padding: "28px",
          opacity: preTitle,
          transform: `translateX(${interpolate(preTitle, [0, 1], [55, 0], clamp)}px)`,
        }}
      >
        <div style={{color: COLORS.lime, fontSize: 16, fontWeight: 900, ...mono}}>
          ACTIVE CITY NODE
        </div>
        <div
          style={{
            color: COLORS.paper,
            fontSize: 56,
            fontWeight: 950,
            lineHeight: 0.92,
            marginTop: 18,
            ...mono,
          }}
        >
          {city.name}
        </div>
        <div
          style={{
            color: "rgba(244, 241, 232, 0.6)",
            fontSize: 20,
            fontWeight: 700,
            marginTop: 18,
            ...mono,
          }}
        >
          {city.label} SIGNAL
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 78,
          top: 696,
          color: COLORS.paper,
          opacity: titleIn,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div style={{fontSize: 28, fontWeight: 900, color: COLORS.red, ...mono}}>
          RESIDENT ROUTE
        </div>
        <div
          style={{
            fontSize: 148,
            fontWeight: 950,
            lineHeight: 0.86,
            marginTop: 18,
            textShadow: `0 0 24px rgba(168, 255, 62, ${0.18 * titleIn})`,
            ...mono,
          }}
        >
          R3S1D3NCY
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 26,
            color: COLORS.ink,
            fontSize: 17,
            fontWeight: 950,
            ...mono,
          }}
        >
          {["LONDON", "MANCHESTER", "NEWCASTLE", "GLASGOW"].map((item) => (
            <span
              key={item}
              style={{
                background: item === city.name ? COLORS.red : COLORS.lime,
                padding: "12px 17px",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(5, 6, 4, ${final * 0.78})`,
          opacity: final,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 315,
          textAlign: "center",
          opacity: final,
          transform: `translateY(${interpolate(final, [0, 1], [80, 0], clamp)}px)`,
        }}
      >
        <div
          style={{
            color: COLORS.lime,
            fontSize: 26,
            fontWeight: 950,
            ...mono,
          }}
        >
          CITY GRID ONLINE
        </div>
        <div
          style={{
            color: COLORS.paper,
            fontSize: 172,
            fontWeight: 950,
            lineHeight: 0.85,
            marginTop: 24,
            ...mono,
          }}
        >
          R3S1D3NCY
        </div>
        <div
          style={{
            color: COLORS.red,
            fontSize: 38,
            fontWeight: 950,
            marginTop: 32,
            ...mono,
          }}
        >
          CITY INTRO
        </div>
      </div>
    </div>
  );
};

const FrameMarks = ({frame, fps}: {frame: number; fps: number}) => {
  const inValue = t(frame, fps, 0.2, 0.9);
  const sweep = interpolate(frame, [0, 240], [0, 1], clamp);

  return (
    <div style={{...absolute, opacity: inValue, pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: 36,
          right: 36,
          top: 36,
          bottom: 36,
          border: "1px solid rgba(244, 241, 232, 0.18)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 36,
          top: 36,
          width: 320 + sweep * 1150,
          height: 3,
          background: COLORS.lime,
          boxShadow: "0 0 26px rgba(168, 255, 62, 0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 52,
          bottom: 48,
          color: "rgba(244, 241, 232, 0.58)",
          fontSize: 18,
          fontWeight: 900,
          ...mono,
        }}
      >
        00:{Math.floor(frame / fps).toString().padStart(2, "0")} / 00:08
      </div>
    </div>
  );
};

export const R3CityIntro = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flash = Math.sin(frame * 0.62) > 0.965 ? 0.11 : 0;
  const openingScale = interpolate(frame, [0, fps * 1.2], [1.045, 1], {
    ...clamp,
    easing: easeOut,
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.ink,
        overflow: "hidden",
        transform: `scale(${openingScale})`,
      }}
    >
      <Grid frame={frame} fps={fps} />
      <CityRoute frame={frame} fps={fps} />
      <Skyline frame={frame} fps={fps} />
      <TitleLockup frame={frame} fps={fps} />
      <FrameMarks frame={frame} fps={fps} />
      <div
        style={{
          ...absolute,
          background: COLORS.paper,
          opacity: flash,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
