import React from "react";
import FieldSVG from "./FieldSVG";
import { POSITIONS, POS_COLOR } from "../constants";
import { avatarThumb } from "../../../lib/cloudinary";

/**
 * Football pitch with the Best XI bubbles overlaid.
 * Click a filled slot to focus that player (handled by parent via `onSelect`).
 *
 * When a player has an `avatar_url` it replaces the colored initials bubble;
 * otherwise we fall back to the original initials + position-colored circle.
 */
export default function BestPitch({ bestXI, selected, onSelect }) {
  return (
    <div className="bt-pitch">
      <FieldSVG />
      {POSITIONS.map((slot) => {
        const p = bestXI[slot.slot];
        const isActive = selected?.id && p?.id === selected.id;
        const hasPhoto = !!p?.avatar_url;
        return (
          <div
            key={slot.slot}
            className={`bt-slot${isActive ? " active" : ""}`}
            style={{ left: slot.x + "%", top: slot.y + "%" }}
            onClick={() => p && onSelect(selected?.id === p.id ? null : p)}
          >
            {p ? (
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
                <div className="bt-empty">
                  <i className="ti ti-minus" />
                </div>
                <div className="bt-pos" style={{ color: "rgba(255,255,255,.45)" }}>
                  {slot.pos}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
