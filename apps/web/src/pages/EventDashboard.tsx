/**
 * EventDashboard — B.6 Everything ELO
 *
 * Redirect /event/:id → /tournament/:id  (1:1 rename, "Event" = canonical term for "Tournament" in spec).
 * Keeps backward-compat for any deep-link that still uses the old URL shape.
 */

import { Navigate, useParams } from "react-router-dom";

export const EventDashboard = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/tournament/${id}`} replace />;
};
