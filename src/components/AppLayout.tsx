import { ReactNode } from "react";
import BottomNavigation from "./BottomNavigation";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

const AppLayout = ({ children, showNav = true }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main className={showNav ? "pb-20" : ""}>{children}</main>
      {showNav && <BottomNavigation />}
    </div>
  );
};

export default AppLayout;
