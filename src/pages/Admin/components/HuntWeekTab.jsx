import React, { useEffect, useState } from "react";
import {
  subscribeHuntWeek,
  setHuntWeekOpen,
  getContractsForWeek,
  settleAllForWeek,
} from "../../../services/hunt.service";
import { useAuthStore } from "../../../store/authStore";

export default function HuntWeekTab({ week, year }) {
  const { profile } = useAuthStore();
  const [wk, setWk] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const u = subscribeHuntWeek(week, year, setWk);
    return () => u && u();
  }, [week, year]);

  useEffect(() => {
    getContractsForWeek(week, year).then(setContracts);
  }, [week, year, wk?.updated_at]);

  const toggle = async () => {
    setBusy(true); setMsg("");
    try {
      await setHuntWeekOpen(week, year, !wk?.open, profile?.id);
    } catch (e) { setMsg("err:" + e.message); }
    setBusy(false);
  };

  const settle = async () => {
    if (!window.confirm("تسویه‌ی همه‌ی قراردادهای accept شده‌ی این هفته؟")) return;
    setBusy(true); setMsg("");
    try {
      const n = await settleAllForWeek(week, year);
      setMsg(`ok:${n} قرارداد تسویه شد.`);
      getContractsForWeek(week, year).then(setContracts);
    } catch (e) { setMsg("err:" + e.message); }
    setBusy(false);
  };

  const counts = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1; return acc;
  }, {});

  return (
    <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0 }}>Hunt vs Hunter — Week {week}</h3>
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            وضعیت: <b style={{ color: wk?.open ? "var(--success)" : "var(--danger)" }}>
              {wk?.open ? "باز" : "بسته"}
            </b>
          </div>
        </div>
        <button className="btn btn--primary" disabled={busy} onClick={toggle}>
          {wk?.open ? "بستن هفته" : "بازکردن هفته"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
        {["pending","accepted","settled","rejected","cancelled"].map((s) => (
          <div key={s} style={{ padding: 10, background: "rgba(255,255,255,.04)", borderRadius: 8, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{counts[s] || 0}</div>
          </div>
        ))}
      </div>

      <div>
        <button className="btn" disabled={busy || !(counts.accepted > 0)} onClick={settle}>
          تسویه‌ی همه‌ی قراردادهای accept شده ({counts.accepted || 0})
        </button>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
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
