import React from "react";

export default function InlineLoader({ size = 16, color }) {
  return (
    <span
      className="fs-spinner"
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 8)),
        borderTopColor: color || "var(--primary)",
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
