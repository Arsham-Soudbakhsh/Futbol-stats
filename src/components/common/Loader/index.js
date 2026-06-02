// Public Loader API. Styles are imported once here so any consumer that
// imports from "@/components/common/Loader" gets them automatically.
import "./Loader.css";

import PageLoader from "./PageLoader";

export default PageLoader;
export { default as PageLoader } from "./PageLoader";
export { default as SplashLoader } from "./SplashLoader";
export { default as InlineLoader } from "./InlineLoader";
export { default as Mark } from "./Mark";
export { Skeleton, SkeletonCard, SkeletonStatsGrid, SkeletonTable } from "./Skeletons";
