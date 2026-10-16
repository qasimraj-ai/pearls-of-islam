/* Profile picture: the chosen photo is cropped to a square and shrunk in the browser,
   so it stays small enough to save. Returns a JPEG data address. */
const SIZE = 256;
const MAX_CHARS = 300000; // must match the server's limit

export async function makeAvatar(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Choose a picture file (JPG, PNG or similar).");
  if (file.size > 15 * 1024 * 1024) throw new Error("This picture is too large. Choose one under 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("This picture could not be opened. Try another one."));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    if (!side) throw new Error("This picture could not be opened. Try another one.");
    const canvas = document.createElement("canvas");
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, SIZE, SIZE);
    for (const quality of [0.85, 0.7, 0.55]) {
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= MAX_CHARS) return data;
    }
    throw new Error("This picture is too detailed to save. Choose a simpler one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
