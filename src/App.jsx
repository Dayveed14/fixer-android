import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  MdHome, MdOutlineHome, MdSmartToy, MdOutlineSmartToy, MdMenuBook, MdOutlineMenuBook, MdHelpOutline, MdHelp,
  MdLogin, MdAddCircle, MdAddCircleOutline, MdBuild, MdOutlineBuild, MdHistory, MdPerson, MdPersonOutline,
  MdToday, MdWork, MdWorkOutline, MdCall, MdOutlineCall, MdDashboard, MdOutlineDashboard, MdEventNote,
  MdOutlineEventNote, MdConfirmationNumber, MdOutlineConfirmationNumber, MdMoreHoriz,
} from "react-icons/md";
import { BottomNav, overlayStack } from "./ui";
import { getStoredUser, homeFor, onSessionChange } from "./core/session";
import { exitApp, onHardwareBack } from "./core/native";
import { useNotifications } from "./core/notifications";
import { useGoBack } from "./core/nav";

import Home from "./screens/public/Home";
import Learn from "./screens/public/Learn";
import Reader from "./screens/public/Reader";
import Help from "./screens/public/Help";
import Contact from "./screens/public/Contact";
import InfoPage from "./screens/public/InfoPage";
import Login from "./screens/public/Login";
import Register from "./screens/public/Register";
import FixBot from "./screens/shared/FixBot";
import Account from "./screens/shared/Account";
import ChangePassword from "./screens/shared/ChangePassword";
import Notifications from "./screens/shared/Notifications";

import CustomerHome from "./screens/customer/CustomerHome";
import GetHelp from "./screens/customer/GetHelp";
import BookCall from "./screens/customer/BookCall";
import Pickup from "./screens/customer/Pickup";
import Repairs from "./screens/customer/Repairs";
import RepairDetail from "./screens/customer/RepairDetail";
import Activity from "./screens/customer/Activity";
import AppointmentDetail from "./screens/customer/AppointmentDetail";
import JobDetail from "./screens/customer/JobDetail";
import Devices from "./screens/customer/Devices";

import TechToday from "./screens/tech/TechToday";
import TechJobs from "./screens/tech/TechJobs";
import TechCalls from "./screens/tech/TechCalls";
import TechRepairs from "./screens/tech/TechRepairs";
import TechHistory from "./screens/tech/TechHistory";

import AdminHome from "./screens/admin/AdminHome";
import AdminBookings from "./screens/admin/AdminBookings";
import AdminRepairs from "./screens/admin/AdminRepairs";
import AdminRepairDetail from "./screens/admin/AdminRepairDetail";
import AdminTickets from "./screens/admin/AdminTickets";
import AdminTicketDetail from "./screens/admin/AdminTicketDetail";
import AdminMore from "./screens/admin/AdminMore";
import AdminPeople from "./screens/admin/AdminPeople";
import AdminPersonEdit from "./screens/admin/AdminPersonEdit";
import AdminPersonNew from "./screens/admin/AdminPersonNew";
import AdminContent from "./screens/admin/AdminContent";
import AdminContentEdit from "./screens/admin/AdminContentEdit";
import AdminPayments from "./screens/admin/AdminPayments";
import AdminPricing from "./screens/admin/AdminPricing";

function useUser() {
  const [user, setUser] = useState(getStoredUser);
  useEffect(() => onSessionChange((s) => setUser(s.user)), []);
  return user;
}

/** Top-level tab screens: the back button leaves the app from these. */
/** Main tabs: Android back leaves the app from these. Sign in and Create
 * account are NOT roots: back returns to where you came from. */
export const ROOTS = ["/", "/fixbot", "/learn", "/help", "/c", "/c/get-help", "/c/repairs", "/c/activity", "/c/account", "/t", "/t/jobs", "/t/calls", "/t/repairs", "/t/account", "/a", "/a/bookings", "/a/repairs", "/a/tickets", "/a/more"];

export const isRootScreen = (pathname) => ROOTS.includes(pathname);

function useAndroidBack() {
  const goBack = useGoBack();
  const { pathname } = useLocation();
  useEffect(
    () =>
      onHardwareBack(() => {
        if (overlayStack.length) return overlayStack[overlayStack.length - 1]();
        if (isRootScreen(pathname)) return exitApp();
        return goBack();
      }),
    [goBack, pathname],
  );
}

function RequireRole({ role, children }) {
  const user = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

/* Bottom navigation per role */
function Shell({ items }) {
  return (
    <div className="has-nav">
      <Outlet />
      <BottomNav items={items} />
    </div>
  );
}

function PublicShell() {
  const user = useUser();
  return (
    <Shell
      items={[
        { to: "/", end: true, label: "Home", icon: <MdOutlineHome />, activeIcon: <MdHome /> },
        { to: "/fixbot", label: "FixBot", icon: <MdOutlineSmartToy />, activeIcon: <MdSmartToy /> },
        { to: "/learn", label: "Learn", icon: <MdOutlineMenuBook />, activeIcon: <MdMenuBook /> },
        { to: "/help", label: "Help", icon: <MdHelpOutline />, activeIcon: <MdHelp /> },
        user
          ? { to: homeFor(user.role), label: "My Fixer", icon: <MdPersonOutline />, activeIcon: <MdPerson /> }
          : { to: "/login", label: "Sign in", icon: <MdLogin /> },
      ]}
    />
  );
}

function CustomerShell() {
  const { unread } = useNotifications();
  return (
    <RequireRole role="user">
      <Shell
        items={[
          { to: "/c", end: true, label: "Home", icon: <MdOutlineHome />, activeIcon: <MdHome />, badge: unread },
          { to: "/c/get-help", label: "Get help", icon: <MdAddCircleOutline />, activeIcon: <MdAddCircle /> },
          { to: "/c/repairs", label: "Repairs", icon: <MdOutlineBuild />, activeIcon: <MdBuild /> },
          { to: "/c/activity", label: "Activity", icon: <MdHistory /> },
          { to: "/c/account", label: "Account", icon: <MdPersonOutline />, activeIcon: <MdPerson /> },
        ]}
      />
    </RequireRole>
  );
}

function TechShell() {
  const { unread } = useNotifications();
  return (
    <RequireRole role="technician">
      <Shell
        items={[
          { to: "/t", end: true, label: "Today", icon: <MdToday />, badge: unread },
          { to: "/t/jobs", label: "Jobs", icon: <MdWorkOutline />, activeIcon: <MdWork /> },
          { to: "/t/calls", label: "Calls", icon: <MdOutlineCall />, activeIcon: <MdCall /> },
          { to: "/t/repairs", label: "Repairs", icon: <MdOutlineBuild />, activeIcon: <MdBuild /> },
          { to: "/t/account", label: "Account", icon: <MdPersonOutline />, activeIcon: <MdPerson /> },
        ]}
      />
    </RequireRole>
  );
}

function AdminShell() {
  const { unread } = useNotifications();
  return (
    <RequireRole role="admin">
      <Shell
        items={[
          { to: "/a", end: true, label: "Home", icon: <MdOutlineDashboard />, activeIcon: <MdDashboard />, badge: unread },
          { to: "/a/bookings", label: "Bookings", icon: <MdOutlineEventNote />, activeIcon: <MdEventNote /> },
          { to: "/a/repairs", label: "Repairs", icon: <MdOutlineBuild />, activeIcon: <MdBuild /> },
          { to: "/a/tickets", label: "Tickets", icon: <MdOutlineConfirmationNumber />, activeIcon: <MdConfirmationNumber /> },
          { to: "/a/more", label: "More", icon: <MdMoreHoriz /> },
        ]}
      />
    </RequireRole>
  );
}

function SignedInRedirect({ children }) {
  const user = useUser();
  return user ? <Navigate to={homeFor(user.role)} replace /> : children;
}

export default function App() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useAndroidBack();

  useEffect(() => {
    const expired = () => navigate("/login", { replace: true, state: { expired: true } });
    window.addEventListener("fixer:session-expired", expired);
    return () => window.removeEventListener("fixer:session-expired", expired);
  }, [navigate]);

  // New screen → start at the top (like a new Android activity).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Routes>
      {/* Guests */}
      <Route element={<PublicShell />}>
        <Route path="/" element={<SignedInRedirect><Home /></SignedInRedirect>} />
        <Route path="/fixbot" element={<FixBot />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/help" element={<Help />} />
      </Route>
      <Route path="/learn/:kind/:slug" element={<Reader />} />
      <Route path="/help/contact" element={<Contact />} />
      <Route path="/info/:page" element={<InfoPage />} />
      <Route path="/login" element={<SignedInRedirect><Login /></SignedInRedirect>} />
      <Route path="/register" element={<SignedInRedirect><Register /></SignedInRedirect>} />

      {/* Customer */}
      <Route path="/c" element={<CustomerShell />}>
        <Route index element={<CustomerHome />} />
        <Route path="get-help" element={<GetHelp />} />
        <Route path="repairs" element={<Repairs />} />
        <Route path="activity" element={<Activity />} />
        <Route path="account" element={<Account />} />
      </Route>
      <Route path="/c/book" element={<RequireRole role="user"><BookCall /></RequireRole>} />
      <Route path="/c/pickup" element={<RequireRole role="user"><Pickup /></RequireRole>} />
      <Route path="/c/fixbot" element={<RequireRole role="user"><FixBot standalone /></RequireRole>} />
      <Route path="/c/repairs/:id" element={<RequireRole role="user"><RepairDetail /></RequireRole>} />
      <Route path="/c/appointments/:id" element={<RequireRole role="user"><AppointmentDetail /></RequireRole>} />
      <Route path="/c/jobs/:id" element={<RequireRole role="user"><JobDetail /></RequireRole>} />
      <Route path="/c/devices" element={<RequireRole role="user"><Devices /></RequireRole>} />
      <Route path="/c/notifications" element={<RequireRole role="user"><Notifications /></RequireRole>} />
      <Route path="/c/password" element={<RequireRole role="user"><ChangePassword /></RequireRole>} />

      {/* Technician */}
      <Route path="/t" element={<TechShell />}>
        <Route index element={<TechToday />} />
        <Route path="jobs" element={<TechJobs />} />
        <Route path="calls" element={<TechCalls />} />
        <Route path="repairs" element={<TechRepairs />} />
        <Route path="account" element={<Account />} />
      </Route>
      <Route path="/t/history" element={<RequireRole role="technician"><TechHistory /></RequireRole>} />
      <Route path="/t/notifications" element={<RequireRole role="technician"><Notifications /></RequireRole>} />
      <Route path="/t/password" element={<RequireRole role="technician"><ChangePassword /></RequireRole>} />

      {/* Admin */}
      <Route path="/a" element={<AdminShell />}>
        <Route index element={<AdminHome />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="repairs" element={<AdminRepairs />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="more" element={<AdminMore />} />
      </Route>
      <Route path="/a/repairs/:id" element={<RequireRole role="admin"><AdminRepairDetail /></RequireRole>} />
      <Route path="/a/tickets/:id" element={<RequireRole role="admin"><AdminTicketDetail /></RequireRole>} />
      <Route path="/a/people/:kind" element={<RequireRole role="admin"><AdminPeople /></RequireRole>} />
      <Route path="/a/people/new" element={<RequireRole role="admin"><AdminPersonNew /></RequireRole>} />
      <Route path="/a/person/:id" element={<RequireRole role="admin"><AdminPersonEdit /></RequireRole>} />
      <Route path="/a/content/:kind" element={<RequireRole role="admin"><AdminContent /></RequireRole>} />
      <Route path="/a/content/:kind/new" element={<RequireRole role="admin"><AdminContentEdit /></RequireRole>} />
      <Route path="/a/content/:kind/:key/edit" element={<RequireRole role="admin"><AdminContentEdit /></RequireRole>} />
      <Route path="/a/payments" element={<RequireRole role="admin"><AdminPayments /></RequireRole>} />
      <Route path="/a/pricing" element={<RequireRole role="admin"><AdminPricing /></RequireRole>} />
      <Route path="/a/fixbot" element={<RequireRole role="admin"><FixBot standalone /></RequireRole>} />
      <Route path="/a/notifications" element={<RequireRole role="admin"><Notifications /></RequireRole>} />
      <Route path="/a/password" element={<RequireRole role="admin"><ChangePassword /></RequireRole>} />
      <Route path="/a/learn/:kind/:slug" element={<RequireRole role="admin"><Reader /></RequireRole>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
