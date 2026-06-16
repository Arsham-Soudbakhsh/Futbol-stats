import React, { useEffect, useMemo, useState } from "react";
import {
  subscribeUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from "../../services/notifications.service";
import {
  notificationPermission,
  requestNotificationPermission,
  showBrowserNotification,
} from "../../lib/browserNotifications";
import { initFcmForUser } from "../../lib/fcm";
import "./Notifications.css";

const TYPE_META = {
  rating_received: { icon: "ti-star-filled", color: "var(--warning)" },
  rating_visible:  { icon: "ti-eye",         color: "var(--primary)" },
  broadcast:       { icon: "ti-speakerphone",color: "var(--primary)" },
  info:            { icon: "ti-bell",        color: "var(--text-muted)" },
};

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function NotifItem({ n, onClickItem, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[n.type] || TYPE_META.info;
  const longBody = (n.body || "").length > 160;

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(n.id);
  };

  return (
    <li
      className={`notif-item${n.read ? "" : " notif-item--unread"}`}
      onClick={() => onClickItem(n)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClickItem(n);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${n.read ? "Read" : "Unread"} notification: ${n.title}`}
    >
      <span className="notif-item__icon" style={{ color: meta.color }}>
        <i className={`ti ${meta.icon}`} />
      </span>
      <div className="notif-item__body">
        <div className="notif-item__title">{n.title}</div>
        {n.body && (
          <div
            className={`notif-item__text${
              longBody && !expanded ? " notif-item__text--clamp" : ""
            }`}
          >
            {n.body}
          </div>
        )}
        {longBody && (
          <button
            type="button"
            className="notif-item__more"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
        <div className="notif-item__meta">
          {n.week ? <span>Week {n.week}</span> : null}
          {n.week ? <span aria-hidden="true">·</span> : null}
          <span>{timeAgo(n.created_at)}</span>
        </div>
      </div>
      <div className="notif-item__side">
        {!n.read && <span className="notif-item__dot" aria-hidden="true" />}
        <button
          type="button"
          className="notif-item__delete"
          aria-label="Delete notification"
          title="Delete"
          onClick={handleDelete}
        >
          <i className="ti ti-x" />
        </button>
      </div>
    </li>
  );
}

export default function NotificationsPanel({ userId }) {
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [seenOpen, setSeenOpen] = useState(false);
  const [perm, setPerm] = useState(notificationPermission());

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeUserNotifications(
      userId,
      (list) => setItems(list),
      (n) => {
        showBrowserNotification({
          title: n.title,
          body: n.body,
          tag: n.id,
          data: { link: n.link || "/" },
        });
      },
    );
    return () => unsub && unsub();
  }, [userId]);

  const { unread, seen } = useMemo(() => {
    const u = [];
    const s = [];
    for (const n of items) (n.read ? s : u).push(n);
    return { unread: u, seen: s };
  }, [items]);

  if (!userId) return null;

  const enable = async () => {
    const r = await requestNotificationPermission();
    setPerm(r);
    if (r === "granted" && userId) {
      try { await initFcmForUser(userId); } catch {}
    }
  };

  // If permission was already granted on a previous visit, register the FCM
  // token automatically so this device keeps receiving background pushes.
  useEffect(() => {
    if (perm === "granted" && userId) {
      initFcmForUser(userId).catch(() => {});
    }
  }, [perm, userId]);

  const onClickItem = async (n) => {
    if (!n.read) {
      try { await markNotificationRead(n.id); } catch {}
    }
  };

  const handleDelete = async (id) => {
    try { await deleteNotification(id); } catch {}
  };

  const handleClearSeen = async () => {
    if (!seen.length) return;
    if (!window.confirm(`Delete all ${seen.length} read notifications?`)) return;
    try { await deleteAllReadNotifications(userId); } catch {}
  };

  return (
    <section className="card notif-card">
      <header className="notif-head">
        <div className="notif-head__title">
          <span className="notif-head__icon">
            <i className="ti ti-bell" />
            {unread.length > 0 && (
              <span className="notif-dot">
                {unread.length > 9 ? "9+" : unread.length}
              </span>
            )}
          </span>
          <div>
            <div className="notif-head__h">Notifications</div>
            <div className="notif-head__sub">
              {items.length === 0
                ? "You're all caught up"
                : `${unread.length} unread · ${seen.length} seen`}
            </div>
          </div>
        </div>
        <div className="notif-head__actions">
          {unread.length > 0 && (
            <button
              className="notif-btn notif-btn--ghost"
              onClick={() => markAllNotificationsRead(userId)}
            >
              Mark all read
            </button>
          )}
          <button
            className="notif-btn notif-btn--ghost"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand" : "Collapse"}
          >
            <i className={`ti ${collapsed ? "ti-chevron-down" : "ti-chevron-up"}`} />
          </button>
        </div>
      </header>

      {perm === "default" && (
        <div className="notif-banner">
          <i className="ti ti-device-mobile-message" />
          <span>Enable push notifications on this device.</span>
          <button className="notif-btn notif-btn--solid" onClick={enable}>
            Enable
          </button>
        </div>
      )}
      {perm === "denied" && (
        <div className="notif-banner notif-banner--muted">
          <i className="ti ti-bell-off" />
          <span>Push notifications are blocked. Enable them in your browser settings.</span>
        </div>
      )}

      {!collapsed && (
        <>
          <ul className="notif-list">
            {unread.length === 0 && seen.length === 0 && (
              <li className="notif-empty">
                <i className="ti ti-mood-smile" />
                <span>No notifications yet.</span>
              </li>
            )}
            {unread.map((n) => (
              <NotifItem
                key={n.id}
                n={n}
                onClickItem={onClickItem}
                onDelete={handleDelete}
              />
            ))}
          </ul>

          {seen.length > 0 && (
            <div className="notif-seen">
              <button
                type="button"
                className="notif-seen__toggle"
                onClick={() => setSeenOpen((v) => !v)}
              >
                <i className={`ti ${seenOpen ? "ti-chevron-down" : "ti-chevron-right"}`} />
                <span>Seen ({seen.length})</span>
                <span className="notif-seen__spacer" />
                {seenOpen && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="notif-seen__clear"
                    onClick={(e) => { e.stopPropagation(); handleClearSeen(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        handleClearSeen();
                      }
                    }}
                  >
                    <i className="ti ti-trash" /> Clear all
                  </span>
                )}
              </button>
              {seenOpen && (
                <ul className="notif-list notif-list--seen">
                  {seen.map((n) => (
                    <NotifItem
                      key={n.id}
                      n={n}
                      onClickItem={onClickItem}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
