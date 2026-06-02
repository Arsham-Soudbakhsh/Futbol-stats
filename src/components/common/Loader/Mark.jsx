import React from "react";

// Orbiting jade ring used by every loader variant.
export default function Mark({ size = 56 }) {
  return (
    <div className="fs-mark" style={{ width: size, height: size }} aria-hidden>
      <span className="fs-mark__ring" />
      <span className="fs-mark__ring fs-mark__ring--2" />
      <span className="fs-mark__core" />
    </div>
  );
}
