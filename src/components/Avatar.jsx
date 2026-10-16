/* Profile picture (or the initial) with a green ring.
   The gap between the ring and the photo is see-through, so it matches any background. */
export default function Avatar({ user, size = 40, className = "", ring = true }) {
  const ringWidth = Math.max(3, Math.round(size * 0.06));
  const gap = Math.max(2, Math.round(size * 0.035));
  const shapeStyle = { width: size, height: size, fontSize: Math.round(size * 0.42) };
  const shape = user.avatar
    ? <img src={user.avatar} alt="" width={size} height={size} className={`avatar-img ${className}`} style={shapeStyle} />
    : <span className={`avatar-init ${className}`} style={shapeStyle} aria-hidden>{(user.name || "?").trim().slice(0, 1).toUpperCase()}</span>;
  if (!ring) return shape;
  const total = size + (ringWidth + gap) * 2;
  return (
    <span className="avatar-ring" style={{ width: total, height: total, "--rw": `${ringWidth}px`, padding: ringWidth + gap }}>
      {shape}
    </span>
  );
}
