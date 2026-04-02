import { lazy } from "react";

export const ThreeScene = lazy(() => import("@/scene/ThreeScene"));
export const SolarWindChart = lazy(() => import("@/charts/SolarWindChart"));
export const KpIndexChart = lazy(() => import("@/charts/KpIndexChart"));
export const DistanceChart = lazy(() => import("@/charts/DistanceChart"));
