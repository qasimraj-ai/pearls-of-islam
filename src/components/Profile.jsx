import { useMemo, useState } from "react";
import { useApp } from "../context";
import { fmtDate, fmtDateTime } from "../lib/utils";
import Avatar from "./Avatar";
import ScorePanel from "./ScorePanel";
import { makeAvatar } from "../lib/avatar";

/* Private profile: only the signed-in person's own details and activity are shown here.
   Nothing on this page is visible to other members. */

const TYPE_LABEL = {
  join: "Joined", login: "Sign in", logout: "Sign out", read: "Quran", listen: "Qirat", bookmark: "Bookmark",
  attendance: "Prayer", settings: "Settings", chat: "News", class: "Live class",
};

export default function Profile() {
  const { user, update, logout } = useApp();
  const [filter, setFilter] = useState("all");
  const [photoMsg, setPhotoMsg] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  async function choosePhoto(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setPhotoBusy(true); setPhotoMsg("");
    try {
      const avatar = await makeAvatar(file);
      update((u) => ({ ...u, avatar }));
      setPhotoMsg("Profile picture saved.");
    } catch (err) {
      setPhotoMsg(err.message);
    } finally {
      setPhotoBusy(false);
    }
  }
  const clearHistory = () => { update((u) => ({ ...u, history: [] })); setFilter("all"); setConfirmClear(false); };
  const removePhoto = () => { update((u) => ({ ...u, avatar: null })); setPhotoMsg("Profile picture removed."); };

  const stats = useMemo(() => {
    const attendance = user.attendance || {};
    let prayersDone = 0;
    for (const day of Object.values(attendance)) {
      for (const status of Object.values(day || {})) if (status && status !== "missed") prayersDone++;
    }
    return {
      prayersDone,
      surahs: Object.keys(user.completed || {}).length,
      bookmarks: (user.bookmarks || []).length,
      signIns: (user.history || []).filter((h) => h.type === "login").length,
    };
  }, [user]);

  const history = user.history || [];
  const items = history.filter((h) => filter === "all" || h.type === filter);
  const types = [...new Set(history.map((h) => h.type))];
  const city = user.settings?.city;
  const country = user.settings?.country;

  return (
    <>
      <div className="page-head"><h2>Profile</h2><span className="muted small">Private: only you can see this page and your photo.</span></div>

      <section className="panel profile-card">
        <Avatar user={user} size={80} className="profile-avatar" />
        <div className="profile-id">
          <h3>{user.name}</h3>
          <span className="muted small">{user.email}</span>
          <div className="chips" style={{ marginTop: 8 }}>
            <span className="chip on">{user.role === "admin" ? "Publisher" : "Member"}</span>
            {(city || country) && <span className="chip">{[city, country].filter(Boolean).join(", ")}</span>}
          </div>
        </div>
        <div className="chips">
          <label className="btn ghost small filebtn">{photoBusy ? "Saving…" : user.avatar ? "Change photo" : "Add photo"}
            <input type="file" accept="image/*" hidden onChange={choosePhoto} disabled={photoBusy} /></label>
          {user.avatar && <button className="btn ghost small" onClick={removePhoto}>Remove photo</button>}
          <button className="btn ghost small" onClick={logout}>Sign out</button>
        </div>
      </section>
      <ScorePanel />
      {photoMsg && <p className={photoMsg.includes("saved") || photoMsg.includes("removed") ? "ok" : "err"} role="status">{photoMsg}</p>}

      <div className="stat-row" style={{ marginTop: 16 }}>
        <div className="panel stat"><span className="muted small">Prayers recorded</span><b>{stats.prayersDone}</b></div>
        <div className="panel stat"><span className="muted small">Surahs completed</span><b>{stats.surahs} / 114</b></div>
        <div className="panel stat"><span className="muted small">Bookmarks</span><b>{stats.bookmarks}</b></div>
        <div className="panel stat"><span className="muted small">Sign-ins</span><b>{stats.signIns}</b></div>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 6 }}>Account</h3>
        <p className="small muted" style={{ margin: "0 0 4px" }}>Member since {fmtDate(user.joinedAt)}</p>
        <p className="small muted" style={{ margin: 0 }}>Last sign-in {fmtDateTime(user.lastLoginAt)}</p>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <div className="page-head" style={{ marginBottom: 8 }}>
          <h3>My activity</h3>
          <div className="chips" role="group" aria-label="Filter activity">
            <button className={`chip ${filter === "all" ? "on" : ""}`} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
            {types.map((t) => (
              <button key={t} className={`chip ${filter === t ? "on" : ""}`} aria-pressed={filter === t} onClick={() => setFilter(t)}>{TYPE_LABEL[t] || t}</button>
            ))}
          </div>
        </div>
        {history.length > 0 && (
          <div className="chips" style={{ marginBottom: 8, alignItems: "center" }}>
            {!confirmClear ? (
              <button className="btn danger small" onClick={() => setConfirmClear(true)}>Clear history</button>
            ) : (
              <>
                <span className="small" role="alert">Delete all {history.length} activity entries? This cannot be undone.</span>
                <button className="btn danger small" onClick={clearHistory}>Yes, delete</button>
                <button className="btn ghost small" onClick={() => setConfirmClear(false)}>Cancel</button>
              </>
            )}
          </div>
        )}
        <div className="timeline scroll">
          {items.length === 0 && <p className="muted">Nothing here yet. Your prayers, readings and other actions will appear here.</p>}
          {items.map((h) => (
            <div className="tl" key={h.id}>
              <span className="dot" />
              <div><b>{TYPE_LABEL[h.type] || h.type}</b><div>{h.detail}</div></div>
              <small>{fmtDateTime(h.at)}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
