// Cloudinary unsigned upload helper.
// Requires two Vite env vars in your .env file:
//   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
//   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
//
// The preset MUST be "Unsigned" in your Cloudinary dashboard
// (Settings → Upload → Upload presets → Add preset → Signing Mode: Unsigned).

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export async function uploadAvatar(file, { folder = "futbolstats/avatars" } = {}) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary not configured. Add VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET to .env"
    );
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be under 5MB");
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}): ${t}`);
  }
  const data = await res.json();
  return data.secure_url;
}

// Build a small, square, face-cropped thumbnail URL from a Cloudinary URL.
// Falls back to the original URL if it isn't a Cloudinary delivery URL.
export function avatarThumb(url, size = 128) {
  if (!url || !url.includes("/upload/")) return url;
  const t = `c_thumb,g_face,w_${size},h_${size},f_auto,q_auto,r_max`;
  return url.replace("/upload/", `/upload/${t}/`);
}
