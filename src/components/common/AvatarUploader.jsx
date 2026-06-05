import React, { useRef, useState } from "react";
import { uploadAvatar, avatarThumb } from "../../lib/cloudinary";
import { updateProfile } from "../../services";
import { useAuthStore } from "../../store/authStore";
import "./AvatarUploader.css";

/**
 * Circular avatar with a small camera button to upload/change the photo.
 * Uploads to Cloudinary, then saves the secure_url to the user's
 * `profiles/{uid}.avatar_url` document in Firestore.
 */
export default function AvatarUploader({ size = 96 }) {
  const { profile, setProfile, isGuest } = useAuthStore();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (isGuest || !profile?.id) return null;

  const initials = (profile.full_name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onPick = () => inputRef.current?.click();

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await uploadAvatar(file);
      await updateProfile(profile.id, { avatar_url: url });
      setProfile({ ...profile, avatar_url: url });
    } catch (ex) {
      setErr(ex.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="av-up" style={{ width: size, height: size }}>
      {profile.avatar_url ? (
        <img
          className="av-up__img"
          src={avatarThumb(profile.avatar_url, size * 2)}
          alt={profile.full_name}
        />
      ) : (
        <div className="av-up__placeholder">{initials}</div>
      )}

      <button
        type="button"
        className="av-up__btn"
        onClick={onPick}
        disabled={busy}
        title="Change photo"
      >
        <i className={`ti ${busy ? "ti-loader-2 av-up__spin" : "ti-camera"}`} />
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onChange}
      />

      {err && <div className="av-up__err">{err}</div>}
    </div>
  );
}
