import React from "react";

// Animated brand background (pitch + colour blobs + grid).
export default function AuthBackground() {
  return (
    <div className="auth-bg" aria-hidden>
      <div className="auth-bg__pitch" />
      <div className="auth-bg__blob auth-bg__blob--1" />
      <div className="auth-bg__blob auth-bg__blob--2" />
      <div className="auth-bg__blob auth-bg__blob--3" />
      <div className="auth-bg__grid" />
    </div>
  );
}
