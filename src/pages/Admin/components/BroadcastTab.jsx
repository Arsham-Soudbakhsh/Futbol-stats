import React, { useEffect, useMemo, useState } from "react";
import { getAllProfiles } from "../../../services/profiles.service";
import { createNotificationsBatch } from "../../../services/notifications.service";

/**
 * Admin → Notifications tab.
 *
 * Compose a message and send it to everyone or a selected subset of users.
 */
function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function BroadcastTab({ week, year }) {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mode, setMode] = useState("all"); // "all" | "select"
  const [selected, setSelected] = useState({});
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    getAllProfiles()
      .then((list) => {
        const players = list.filter((p) => p.role !== "admin");
        setPeople(players);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) =>
      (p.full_name || p.name || "").toLowerCase().includes(q),
    );
  }, [people, search]);

  const selectedIds = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected],
  );

  const selectedPeople = useMemo(
    () => people.filter((p) => selected[p.id]),
    [people, selected],
  );

  const recipientCount =
    mode === "all" ? people.length : selectedIds.length;

  const toggle = (id) =>
    setSelected((s) => ({ ...s, [id]: !s[id] }));

  const selectAllVisible = () => {
    const next = { ...selected };
    filtered.forEach((p) => (next[p.id] = true));
    setSelected(next);
  };

  const clearSelection = () => setSelected({});

  const handleSend = async () => {
    setMsg("");
    if (!title.trim()) {
      setMsg("err:Please enter a title.");
      return;
    }
    const targets =
      mode === "all" ? people.map((p) => p.id) : selectedIds;
    if (!targets.length) {
      setMsg("err:Select at least one recipient.");
      return;
    }
    setSending(true);
    try {
      const items = targets.map((uid) => ({
        user_id: uid,
        title: title.trim(),
        body: body.trim(),
        type: "broadcast",
        week,
        year,
      }));
      const n = await createNotificationsBatch(items);
      setMsg(`ok:Message sent to ${n} ${n === 1 ? "user" : "users"}.`);
      setTitle("");
      setBody("");
      setSelected({});
    } catch (e) {
      setMsg("err:" + (e?.message || "Failed to send"));
    }
    setSending(false);
  };

  const isOk = msg.startsWith("ok:");
  const msgText = msg.replace(/^(ok|err):/, "");

  return (
    <div className="card" style={{ padding: 0 }}>
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border, rgba(255,255,255,.06))",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <i
          className="ti ti-speakerphone"
          style={{ fontSize: 18, color: "var(--primary)" }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
            Send notification
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
            Reaches the Home page + browser push for everyone on the list.
          </div>
        </div>
      </div>

      <div className="bcast-form">
        <div className="bcast-row">
          <label>Title</label>
          <input
            className="admin-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Week 4 matches start at 8 PM"
            maxLength={120}
          />
        </div>

        <div className="bcast-row">
          <label>Message (optional)</label>
          <textarea
            className="admin-input"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add more detail here..."
            maxLength={600}
          />
        </div>

        <div className="bcast-row">
          <label>Recipients</label>
          <div className="bcast-mode">
            <button
              type="button"
              className={`bcast-mode__btn${mode === "all" ? " bcast-mode__btn--active" : ""}`}
              onClick={() => setMode("all")}
            >
              <i className="ti ti-users" />
              <span>
                Everyone
                <small>{people.length} users</small>
              </span>
            </button>
            <button
              type="button"
              className={`bcast-mode__btn${mode === "select" ? " bcast-mode__btn--active" : ""}`}
              onClick={() => setMode("select")}
            >
              <i className="ti ti-user-check" />
              <span>
                Select users
                <small>
                  {selectedIds.length
                    ? `${selectedIds.length} chosen`
                    : "Pick individuals"}
                </small>
              </span>
            </button>
          </div>
        </div>

        {mode === "select" && (
          <div className="bcast-row">
            <div className="bcast-picker">
              <div className="bcast-picker__toolbar">
                <div className="bcast-search">
                  <i className="ti ti-search" />
                  <input
                    className="admin-input"
                    type="search"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="bcast-toolbtn"
                  onClick={selectAllVisible}
                  disabled={loading || filtered.length === 0}
                >
                  <i className="ti ti-checks" /> Select shown
                </button>
                <button
                  type="button"
                  className="bcast-toolbtn"
                  onClick={clearSelection}
                  disabled={selectedIds.length === 0}
                >
                  <i className="ti ti-eraser" /> Clear
                </button>
              </div>

              <div className="bcast-chips">
                {selectedPeople.length === 0 ? (
                  <span className="bcast-chips__empty">
                    No users selected yet.
                  </span>
                ) : (
                  selectedPeople.map((p) => (
                    <span key={p.id} className="bcast-chip">
                      {p.full_name || p.name || "Unnamed"}
                      <button
                        type="button"
                        onClick={() => toggle(p.id)}
                        aria-label="Remove"
                      >
                        <i className="ti ti-x" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div className="bcast-list">
                {loading && (
                  <div className="bcast-list__empty">Loading users…</div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="bcast-list__empty">
                    No users match this search.
                  </div>
                )}
                {!loading &&
                  filtered.map((p) => {
                    const isSel = !!selected[p.id];
                    const name = p.full_name || p.name || "Unnamed";
                    return (
                      <label
                        key={p.id}
                        className={`bcast-row-item${isSel ? " bcast-row-item--selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggle(p.id)}
                        />
                        <span className="bcast-avatar">{initials(name)}</span>
                        <div className="bcast-row-item__main">
                          <span className="bcast-row-item__name">{name}</span>
                          {p.role && (
                            <span
                              className={`bcast-role-badge${
                                p.role === "captain"
                                  ? " bcast-role-badge--captain"
                                  : ""
                              }`}
                            >
                              {p.role}
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        <div className="bcast-actions">
          <div className="bcast-count">
            <i className="ti ti-send" /> Will send to{" "}
            <strong>{recipientCount}</strong>{" "}
            {recipientCount === 1 ? "user" : "users"}
          </div>
          <button
            className="btn btn-primary"
            disabled={sending || !title.trim() || recipientCount === 0}
            onClick={handleSend}
          >
            <i className="ti ti-send" />
            {sending ? "Sending..." : "Send notification"}
          </button>
        </div>

        {msg && (
          <div
            className={`admin-msg${isOk ? " ok" : " err"}`}
            style={{ marginTop: 4 }}
          >
            {msgText}
          </div>
        )}
      </div>
    </div>
  );
}
