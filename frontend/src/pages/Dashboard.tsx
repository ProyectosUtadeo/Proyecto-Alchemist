import { useAuth } from "../auth";
import DashboardAlchemist from "./DashboardAlchemist";
import DashboardSupervisor from "./DashboardSupervisor";

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "SUPERVISOR") {
    return <DashboardSupervisor />;
  }
  // por defecto, Alchemist
  return <DashboardAlchemist />;
}
