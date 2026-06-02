import React from "react";
import { getCurrentYear } from "../../utils/points";

/**
 * Currently-selected week + season year propagated from DashboardLayout
 * to every dashboard child page.
 */
export const WeekContext = React.createContext({
  week: 1,
  year: getCurrentYear(),
});
