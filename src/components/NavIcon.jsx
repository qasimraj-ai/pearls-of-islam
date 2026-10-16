/* Line icons for the main menu (inherit the text colour) */
const P = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></>,
  quran: <><path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5 2-1.5 5-1.9 8-1.5V5c-3-.4-6 0-8 1.5Z" /><path d="M12 6.5v13" /></>,
  prayers: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" /><path d="m17 3 .6 1.4L19 5l-1.4.6L17 7l-.6-1.4L15 5l1.4-.6Z" /></>,
  namaz: <><circle cx="12" cy="5" r="2.2" /><path d="M12 7.5v6" /><path d="M7 20l3-6.5h4L17 20" /><path d="M8 11h8" /></>,
  ahadees: <><path d="M5 5h14v10H11l-4 4v-4H5Z" /><path d="M8.5 9h7M8.5 12h4" /></>,
  attendance: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /><path d="m9 15 2 2 4-4" /></>,
  profile: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></>,
};
export default function NavIcon({ id }) {
  return (
    <svg className="nav-ic" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[id] || P.home}
    </svg>
  );
}
