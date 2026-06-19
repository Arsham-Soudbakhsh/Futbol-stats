import React, { useContext, useEffect, useMemo, useState } from "react";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { getAllPlayers } from "../../services/profiles.service";
import {
  subscribeContractsForUser,
  subscribeHuntWeek,
  sendContract,
  acceptContract,
  rejectContract,
  counterContract,
  cancelContract,
  countSentByHunterThisWeek,
  MAX_CONTRACTS_PER_WEEK,
} from "../../services/hunt.service";
import Loader from "../../components/common/Loader";
import NewContractDialog from "./components/NewContractDialog";
import ContractCard from "./components/ContractCard";
import GuestHuntView from "./GuestHuntView";
import "./Hunt.css";

export default function HuntPage() {
  const { week, year } = useContext(WeekContext);
  const { profile, isGuest } = useAuthStore();

  // ── Guest sees the teaser, not the real page ──────────────────────────────
  if (isGuest) return <GuestHuntView />;

  const [players, setPlayers] = useState([]);
  const [contracts, setContracts] = useState(null);
  const [huntWeek, setHuntWeek] = useState(null);
  const [usedSlots, setUsedSlots] = useState(0);
  const [openNew, setOpenNew] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    getAllPlayers().then(setPlayers).catch(() => setPlayers([]));
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    const u = subscribeContractsForUser(profile.id, setContracts);
    return () => u && u();
  }, [profile?.id]);

  useEffect(() => {
    const u = subscribeHuntWeek(week, year, setHuntWeek);
    return () => u && u();
  }, [week, year]);

  useEffect(() => {
    if (!profile?.id) return;
    countSentByHunterThisWeek(profile.id, week, year)
      .then(setUsedSlots)
      .catch(() => setUsedSlots(0));
  }, [profile?.id, week, year, contracts]);

  const isOpen = !!huntWeek?.open;
  const left = Math.max(0, MAX_CONTRACTS_PER_WEEK - usedSlots);

  const send = async (data) => {
    setErr("");
    try {
      await sendContract({
        hunter: profile,
        hunted: players.find((p) => p.id === data.hunted_id),
        week, year,
        metric: data.metric,
        stake: data.stake,
      });
      setOpenNew(false);
    } catch (e) {
      setErr(e.message || "خطا در ارسال");
    }
  };

  const { pending, active, history, totalEarnings } = useMemo(() => {
    const list = contracts || [];
    const earnings = list
      .filter((c) => c.status === "settled" && c.hunt_delta)
      .reduce((acc, c) => acc + (c.hunt_delta[profile?.id] || 0), 0);
    return {
      pending: list.filter((c) => c.status === "pending"),
      active:  list.filter((c) => c.status === "accepted"),
      history: list.filter((c) => ["settled","rejected","cancelled"].includes(c.status)),
      totalEarnings: earnings,
    };
  }, [contracts, profile?.id]);

  if (contracts == null) return <Loader label="Loading hunts" />;

  return (
    <div className="hunt-page fade-up">
      <header className="hunt-hero">
        <div className="hunt-hero__top">
          <div className="hunt-hero__icon"><i className="ti ti-crosshair" /></div>
          <div className="hunt-hero__title">
            <h1>Hunt vs Hunter</h1>
            <p>چالش هفتگی بازیکنان روی آمار — برنده امتیاز می‌گیرد، بازنده از دست می‌دهد.</p>
          </div>
        </div>

        <div className="hunt-hero__meta">
          <div className="hunt-stat">
            <span className="hunt-stat__label">وضعیت هفته</span>
            <span className="hunt-stat__value">
              <span className={`dot ${isOpen ? "ok" : "off"}`} />
              {isOpen ? "باز" : "بسته"}
            </span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">هفته / سال</span>
            <span className="hunt-stat__value">W{week} · {year}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">فرصت باقی‌مانده</span>
            <span className="hunt-stat__value">{left}/{MAX_CONTRACTS_PER_WEEK}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">فعال</span>
            <span className="hunt-stat__value">{active.length}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">در انتظار</span>
            <span className="hunt-stat__value">{pending.length}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">سود خالص</span>
            <span className="hunt-stat__value" style={{
              color: totalEarnings > 0 ? "#4ade80" : totalEarnings < 0 ? "#f87171" : undefined
            }}>
              {totalEarnings > 0 ? `+${totalEarnings}` : totalEarnings}
            </span>
          </div>
        </div>

        <div className="hunt-hero__actions">
          <button
            className="btn btn--primary"
            disabled={!isOpen || left === 0}
            onClick={() => setOpenNew(true)}
            title={!isOpen ? "هفته بسته است" : left === 0 ? "فرصتی باقی نیست" : ""}
          >
            <i className="ti ti-plus" /> چالش جدید
          </button>
        </div>

        {err && <div className="hunt-err"><i className="ti ti-alert-triangle" /> {err}</div>}
      </header>

      <Section title="در انتظار پاسخ" icon="ti-hourglass" count={pending.length}
               empty="در حال حاضر چیزی منتظر نیست">
        {pending.map((c) => (
          <ContractCard key={c.id} c={c} me={profile.id}
            onAccept={() => acceptContract(c.id, profile.id).catch((e) => setErr(e.message))}
            onReject={() => rejectContract(c.id, profile.id).catch((e) => setErr(e.message))}
            onCancel={() => cancelContract(c.id, profile.id).catch((e) => setErr(e.message))}
            onCounter={(v) => counterContract(c.id, profile.id, v).catch((e) => setErr(e.message))}
          />
        ))}
      </Section>

      <Section title="چالش‌های فعال" icon="ti-bolt" count={active.length} empty="چالش فعالی نداری">
        {active.map((c) => <ContractCard key={c.id} c={c} me={profile.id} />)}
      </Section>

      <Section title="تاریخچه" icon="ti-history" count={history.length} empty="چیزی برای نمایش نیست">
        {history.map((c) => <ContractCard key={c.id} c={c} me={profile.id} />)}
      </Section>

      {openNew && (
        <NewContractDialog
          me={profile}
          players={players.filter((p) => p.id !== profile.id)}
          onClose={() => setOpenNew(false)}
          onSubmit={send}
        />
      )}
    </div>
  );
}

function Section({ title, icon, count, empty, children }) {
  const kids = React.Children.toArray(children);
  return (
    <section className="hunt-section">
      <div className="hunt-section__head">
        <i className={`ti ${icon}`} /> {title}
        <span className="count">{count}</span>
      </div>
      {kids.length === 0
        ? <div className="hunt-empty"><i className={`ti ${icon}`} />{empty}</div>
        : <div className="hunt-grid">{kids}</div>}
    </section>
  );
}
