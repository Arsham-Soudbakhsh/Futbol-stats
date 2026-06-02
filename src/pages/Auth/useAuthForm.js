import { useState } from "react";
import {
  signIn,
  signUp,
  verifyInviteCode,
  consumeInviteCode,
} from "../../services";
import { AUTH_ERROR_MESSAGES } from "./constants";

/**
 * Owns every piece of auth-form state plus the submit handler.
 * The page component just renders inputs against these values.
 *
 * On successful sign-up the invite code is consumed and the caller
 * navigates to "/" via `onSuccess`.
 */
export function useAuthForm({ initialMode = "signin", onSuccess } = {}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("player");
  const [position, setPosition] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setRole("player");
    setPosition("");
    setInviteCode("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!position) {
        setError("Please select your position.");
        return;
      }
      if (!inviteCode.trim()) {
        setError("Invite code required.");
        return;
      }
      const inviteData = await verifyInviteCode(inviteCode.trim());
      if (!inviteData) {
        setError("Invalid or used invite code.");
        return;
      }
      if (inviteData.role !== role) {
        setError(`This code is for ${inviteData.role}.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        // Position required for both player AND captain.
        const u = await signUp(email, password, fullName, role, position);
        await consumeInviteCode(inviteCode.trim(), u.uid);
        onSuccess?.();
      }
    } catch (err) {
      setError(AUTH_ERROR_MESSAGES[err.code] || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    switchMode,
    email,
    setEmail,
    password,
    setPassword,
    showPwd,
    setShowPwd,
    fullName,
    setFullName,
    role,
    setRole,
    position,
    setPosition,
    inviteCode,
    setInviteCode,
    loading,
    error,
    submit,
  };
}
