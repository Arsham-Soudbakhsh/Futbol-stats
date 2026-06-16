import React from "react";
import FieldSVG from "./FieldSVG";
import { POSITIONS, POS_COLOR } from "../constants";
import { avatarThumb } from "../../../lib/cloudinary";

/**
 * Football pitch with the Squad of the Week bubbles overlaid.
 * Click a filled slot to focus that player. Empty slots are inert
 * (non-clickable cursor, no onClick) and surface a "needs data" hint.
 */
export default function BestPitch({ bestXI, selected, onSelect }) {
  return (
    <div className="bt-pitch">
      <FieldSVG />
      {POSITIONS.map((slot) => {
        const p = bestXI[slot.slot];
        const isActive = !!(selected?.id && p?.id === selected.id);
        const hasPhoto = !!p?.avatar_url;
        const filled = !!p;
        const handleClick = filled
          ? () => onSelect(selected?.id === p.id ? null : p)
          : undefined;
        return (
          <div
            key={slot.slot}
            role={filled ? "button" : undefined}
            tabIndex={filled ? 0 : undefined}
            aria-label={filled ? `${p.full_name}, ${slot.pos}` : `${slot.pos} slot — needs data`}
            className={`bt-slot${isActive ? " active" : ""}${filled ? "" : " bt-slot--empty"}`}
            style={{
              left: slot.x + "%",
              top: slot.y + "%",
              cursor: filled ? "pointer" : "default",
            }}
            onClick={handleClick}
            onKeyDown={(e) => {
              if (!filled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }}
          >
            {filled ? (
              <>
                {hasPhoto ? (
                  <div
                    className="bt-bubble bt-bubble--photo"
                    style={{ borderColor: POS_COLOR[slot.pos] }}
                  >
                    <img
                      src={avatarThumb(p.avatar_url, 120)}
                      alt={p.full_name}
                    />
                  </div>
                ) : (
                  <div className="bt-bubble" style={{ background: POS_COLOR[slot.pos] }}>
                    {p.full_name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="bt-name">{p.full_name.split(" ")[0]}</div>
              </>
            ) : (
              <>
                <div className="bt-empty" title={`${slot.pos} — needs data`}>
                  <i className="ti ti-minus" aria-hidden="true" />
                </div>
                <div className="bt-pos" style={{ color: "rgba(255,255,255,.55)" }}>
                  {slot.pos}
                </div>
                <div className="bt-needs-data">needs data</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
