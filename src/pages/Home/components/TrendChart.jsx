import React from "react";
import { C } from "../constants";

// Area + line chart of weekly points across the season.
export default function TrendChart({ data, highlightWeek }) {
  const W = 560;
  const H = 160;
  const pad = { l: 28, r: 12, t: 16, b: 24 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(10, ...data.map((d) => d.pts));

  const x = (i) => pad.l + (innerW / (data.length - 1 || 1)) * i;
  const y = (v) => pad.t + innerH - (v / max) * innerH;
  const line = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.pts)}`)
    .join(" ");
  const area = `${line} L${x(data.length - 1)},${pad.t + innerH} L${x(0)},${
    pad.t + innerH
  } Z`;
  const grid = [0.25, 0.5, 0.75, 1].map((k) => pad.t + innerH - innerH * k);

  return (
    <div className="trend-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="trend-svg"
      >
        <defs>
          <linearGradient id="tArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.brand} stopOpacity="0.35" />
            <stop offset="100%" stopColor={C.brand} stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((gy, i) => (
          <line
            key={i}
            x1={pad.l}
            x2={W - pad.r}
            y1={gy}
            y2={gy}
            stroke="var(--border)"
            strokeDasharray="3 4"
          />
        ))}
        <path d={area} fill="url(#tArea)" />
        <path
          d={line}
          fill="none"
          stroke={C.brand}
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => {
          const cx = x(i);
          const cy = y(d.pts);
          const hot = highlightWeek === d.w;
          return (
            <g key={d.w}>
              <circle
                cx={cx}
                cy={cy}
                r={hot ? 5.5 : 3.5}
                fill="#fff"
                stroke={hot ? C.gold : C.brand}
                strokeWidth={hot ? 3 : 2}
              />
              <text
                x={cx}
                y={H - 6}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
                fontWeight="600"
              >
                W{d.w}
              </text>
              {d.pts > 0 && (
                <text
                  x={cx}
                  y={cy - 9}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill={C.ink}
                >
                  {d.pts}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
