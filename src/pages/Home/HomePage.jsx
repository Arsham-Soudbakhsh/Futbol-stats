import React, { useContext, useState } from "react";
import Loader from "../../components/common/Loader";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { calcStatPoints, calcAwardPoints } from "../../utils/points";
import { useHomeWeek, useHomeSeason } from "./useHomeData";
import { greeting } from "./constants";
import WeekView from "./components/WeekView";
import SeasonView from "./components/SeasonView";
import { GuestView } from "./components/States";
import "./Home.css";

/**
 * HomePage — the player dashboard. Two views: current week (KPIs +
 * radar + breakdown + mini trend) and full season (totals + chart + radar).
 */
export default function HomePage() {
  const { week, year } = useContext(WeekContext);
  const { profile, isGuest } = useAuthStore();
  const [view, setView] = useState("week");

  const { stats, awards, ratings, loading, skillFill } = useHomeWeek({
    profile,
    week,
    year,
  });
  const season = useHomeSeason({ profile, year });

  if (isGuest) return <GuestView />;
  if (loading) return <Loader label="Loading your week" />;

  const statPts = calcStatPoints(stats);
  const awardPts = calcAwardPoints(awards);
  const totalPts = statPts + awardPts;
  const avgOverall = ratings
    ? Math.round(
        (ratings.passing +
          ratings.shooting +
          ratings.defending +
          ratings.dribbling) /
          4,
      )
    : 0;

  return (
    <div className="hp">
      <header className="hp-head">
        <div>
          <div className="hp-greet">{greeting()},</div>
          <h1 className="hp-name">{profile?.name || profile?.full_name || "Player"}</h1>
        </div>
        <div className="hp-seg" role="tablist">
          <button
            className={`hp-seg__btn${view === "week" ? " on" : ""}`}
            onClick={() => setView("week")}
          >
            <i className="ti ti-calendar-week" /> Week {week}
          </button>
          <button
            className={`hp-seg__btn${view === "total" ? " on" : ""}`}
            onClick={() => setView("total")}
          >
            <i className="ti ti-sigma" /> Season
          </button>
        </div>
      </header>

      {view === "week" ? (
        <WeekView
          profile={profile}
          week={week}
          year={year}
          stats={stats}
          awards={awards}
          ratings={ratings}
          totalPts={totalPts}
          awardPts={awardPts}
          avgOverall={avgOverall}
          skillFill={skillFill}
          season={season}
        />
      ) : (
        <SeasonView season={season} year={year} />
      )}
    </div>
  );
}
