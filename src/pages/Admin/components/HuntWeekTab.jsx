import React, { useEffect, useState } from "react";
import {
  subscribeHuntWeek,
  setHuntWeekOpen,
  getContractsForWeek,
  settleAllForWeek,
} from "../../../services/hunt.service";
import { useAuthStore } from "../../../store/authStore";

const STATUSES = ["pending", "accepted", "settled", "rejected", "cancelled"];

/**
 * Admin tab: open / close the current Hunt week and bulk-settle accepted
 * contracts once the matches are finished.
 */
export default function HuntWeekTab({ week, year }) {
  const { profile } = useAuthStore();
  const [wk, setWk] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Live-subscribe to the week's open/closed state.
  useEffect(() => {
    const unsub = subscribeHuntWeek(week, year, setWk);
    return () => unsub && unsub();
  }, [week, year]);

  // Reload contract list when the week changes or after an admin action.
  useEffect(() => {
    getContractsForWeek(week, year).then(setContracts);
  }, [week, year, wk?.updated_at]);

  const toggle = async () => {
    setBusy(true); setMsg("");
    try {
      await setHuntWeekOpen(week, year, !wk?.open, profile?.id);
    } catch (e) {
      setMsg("err:" + e.message);
    }
    setBusy(false);
  };

  const settle = async () => {
    if (!window.confirm("تسویه‌ی همه‌ی قراردادهای accept شده‌ی این هفته؟")) return;
    setBusy(true); setMsg("");
    try {
      const n = await settleAllForWeek(week, year);
      setMsg(`ok:${n} قرارداد تسویه شد.`);
      getContractsForWeek(week, year).then(setContracts);
    } catch (e) {
      setMsg("err:" + e.message);
    }
    setBusy(false);
  };

  const counts = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="card admin-card">
      <div className="admin-card-head">
        <div>
          <h3>Hunt vs Hunter — Week {week}</h3>
          <div className="hw-status">
            وضعیت:{" "}
            <b className={wk?.open ? "hw-status__on" : "hw-status__off"}>
              {wk?.open ? "باز" : "بسته"}
            </b>
          </div>
        </div>
        <button className="btn btn--primary" disabled={busy} onClick={toggle}>
          {wk?.open ? "بستن هفته" : "بازکردن هفته"}
        </button>
      </div>

      <div className="hw-counts">
        {STATUSES.map((s) => (
          <div key={s} className="hw-count">
            <div className="hw-count__label">{s}</div>
            <div className="hw-count__value">{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      <div>
        <button
          className="btn"
          disabled={busy || !(counts.accepted > 0)}
          onClick={settle}
        >
          تسویه‌ی همه‌ی قراردادهای accept شده ({counts.accepted || 0})
        </button>
        <div className="hw-hint">
          بعد از پایان بازی‌های هفته و وارد کردن stats، این دکمه را بزن تا برنده‌ها مشخص شوند و امتیازها انتقال یابد.
        </div>
      </div>

      {msg && (
        <div className={`admin-msg ${msg.startsWith("ok:") ? "ok" : "err"}`}>
          {msg.replace(/^(ok|err):/, "")}
        </div>
      )}
    </div>
  );
}
