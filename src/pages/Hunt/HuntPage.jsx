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
import { usePointsData } from "../Points/usePointsData";
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

  // Season totals → used as the stake budget for both sides.
  const { rows: seasonRows } = usePointsData({ week, year, profile, mode: "season" });
  const pointsMap = useMemo(() => {
    const m = {};
    (seasonRows || []).forEach((r) => { m[r.id] = Math.max(0, Math.floor(r.total || 0)); });
    return m;
  }, [seasonRows]);
  const myTotal = profile?.id ? (pointsMap[profile.id] || 0) : 0;

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
      setErr(e.message || "Failed to send challenge");
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
            <p>Weekly head-to-head stat battles — winner takes the stake, loser pays it.</p>
          </div>
        </div>

        <div className="hunt-hero__meta">
          <div className="hunt-stat">
            <span className="hunt-stat__label">Week status</span>
            <span className="hunt-stat__value">
              <span className={`dot ${isOpen ? "ok" : "off"}`} />
              {isOpen ? "Open" : "Closed"}
            </span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">Week / Year</span>
            <span className="hunt-stat__value">W{week} · {year}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">Slots left</span>
            <span className="hunt-stat__value">{left}/{MAX_CONTRACTS_PER_WEEK}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">Active</span>
            <span className="hunt-stat__value">{active.length}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">Pending</span>
            <span className="hunt-stat__value">{pending.length}</span>
          </div>
          <div className="hunt-stat">
            <span className="hunt-stat__label">Net P/L</span>
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
            title={!isOpen ? "Week is closed" : left === 0 ? "No slots left" : ""}
          >
            <i className="ti ti-plus" /> New challenge
          </button>
        </div>

        {err && <div className="hunt-err"><i className="ti ti-alert-triangle" /> {err}</div>}
      </header>

      <Section title="Awaiting response" icon="ti-hourglass" count={pending.length}
               empty="Nothing waiting right now">
        {pending.map((c) => (
          <ContractCard key={c.id} c={c} me={profile.id}
            onAccept={() => acceptContract(c.id, profile.id).catch((e) => setErr(e.message))}
            onReject={() => rejectContract(c.id, profile.id).catch((e) => setErr(e.message))}
            onCancel={() => cancelContract(c.id, profile.id).catch((e) => setErr(e.message))}
            onCounter={(v) => counterContract(c.id, profile.id, v).catch((e) => setErr(e.message))}
          />
        ))}
      </Section>

      <Section title="Active challenges" icon="ti-bolt" count={active.length} empty="No active challenges">
        {active.map((c) => <ContractCard key={c.id} c={c} me={profile.id} />)}
      </Section>

      <Section title="History" icon="ti-history" count={history.length} empty="Nothing to show yet">
        {history.map((c) => <ContractCard key={c.id} c={c} me={profile.id} />)}
      </Section>

      {openNew && (
        <NewContractDialog
          me={profile}
          players={players.filter((p) => p.id !== profile.id)}
          onClose={() => setOpenNew(false)}
          onSubmit={send}
          myTotal={myTotal}
          pointsMap={pointsMap}
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
