import React, { useContext, useState } from "react";
import Loader from "../../components/common/Loader";
import AvatarUploader from "../../components/common/AvatarUploader";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { calcStatPoints, calcAwardPoints, calcRatingBonus } from "../../utils/points";
import { useHomeWeek, useHomeSeason, useHomePeers } from "./useHomeData";
import { greeting } from "./constants";
import WeekView from "./components/WeekView";
import SeasonView from "./components/SeasonView";
import { GuestView } from "./components/States";
import NotificationsPanel from "../../components/Notifications/NotificationsPanel";
import "./Home.css";

export default function HomePage() {
  const { week, year } = useContext(WeekContext);
  const { profile, isGuest } = useAuthStore();
  const [view, setView] = useState("week");

  const { stats, awards, ratings, loading, skillFill } = useHomeWeek({ profile, week, year });
  const season = useHomeSeason({ profile, year });
  const peers = useHomePeers({
    profile, week, year,
    selfOverall: ratings?.overall ?? 0,
  });

  if (isGuest) return <GuestView />;
  if (loading) return <Loader label="Loading your week" />;

  const statPts = calcStatPoints(stats, profile?.position);
  const awardPts = calcAwardPoints(awards);
  const avgOverall = ratings?.overall ?? 0;
  const ratingBonus = calcRatingBonus(avgOverall);
  const totalPts = statPts + awardPts + ratingBonus;

  return (
    <div className="hp">
      <header className="hp-head">
        <div className="hp-head__id">
          <AvatarUploader size={72} />
          <div>
            <div className="hp-greet">{greeting()},</div>
            <h1 className="hp-name">{profile?.name || profile?.full_name || "Player"}</h1>
          </div>
        </div>
        <div className="hp-seg" role="tablist">
          <button className={`hp-seg__btn${view === "week" ? " on" : ""}`}
            onClick={() => setView("week")}>
            <i className="ti ti-calendar-week" /> Week {week}
          </button>
          <button className={`hp-seg__btn${view === "total" ? " on" : ""}`}
            onClick={() => setView("total")}>
            <i className="ti ti-sigma" /> Season
          </button>
        </div>
      </header>

      <NotificationsPanel userId={profile?.id} />

      {view === "week" ? (
        <WeekView
          profile={profile} week={week} year={year}
          stats={stats} awards={awards} ratings={ratings}
          totalPts={totalPts} awardPts={awardPts}
          avgOverall={avgOverall} skillFill={skillFill}
          season={season} peers={peers}
        />
      ) : (
        <SeasonView season={season} year={year} profile={profile} />
      )}
    </div>
  );
}
