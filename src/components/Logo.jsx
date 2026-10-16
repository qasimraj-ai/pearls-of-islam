import { LOGO_SRC } from "../lib/logoData";

/* The Quran logo, shown in the navbar, splash screen and sign-in page */
export default function Logo({ size = 34, className = "" }) {
  return <img src={LOGO_SRC} width={size} height={size} alt="Quran logo" className={`logo ${className}`} draggable={false} />;
}
