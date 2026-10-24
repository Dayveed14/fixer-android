import { useNavigate } from "react-router-dom";
import { MdNotificationsNone, MdLock, MdDevices, MdSmartToy, MdMenuBook, MdHelpOutline, MdLogout, MdHistory, MdMail, MdPhone } from "react-icons/md";
import { AppBar, Avatar, List, ListItem, Pill, Screen, Section, useConfirm } from "../../ui";
import { getStoredUser, homeFor } from "../../core/session";
import { logout } from "../../core/api/auth.api";
import { useNotifications } from "../../core/notifications";
import { fullName } from "../../lib/format";

const ROLE_LABELS = { user: "Customer", technician: "Technician", admin: "Admin" };

export default function Account() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const user = getStoredUser();
  const base = homeFor(user?.role);
  const { unread } = useNotifications();

  const signOut = async () => {
    if (!(await confirm({ title: "Sign out?", body: "You'll need your password to sign back in.", confirm: "Sign out" }))) return;
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Screen appBar={<AppBar title="Account" />}>
      <div className="profile-head">
        <Avatar name={fullName(user)} size="lg" />
        <h2>{fullName(user) || "Your account"}</h2>
        <Pill tone="primary">{ROLE_LABELS[user?.role] || user?.role}</Pill>
      </div>

      <List>
        <ListItem icon={<MdMail />} leadTone="muted" over="Email" title={user?.email || "—"} />
        <ListItem icon={<MdPhone />} leadTone="muted" over="Phone" title={user?.phone || "Not added"} />
      </List>
      <p className="t-body-sm muted" style={{ margin: "-8px 4px 0" }}>
        To change your name or phone number, contact support.
      </p>

      <Section title="Settings">
        <List>
          <ListItem icon={<MdNotificationsNone />} title="Notifications" trailing={unread > 0 && <Pill tone="error">{unread} new</Pill>} to={`${base}/notifications`} />
          <ListItem icon={<MdLock />} title="Change password" text="Signs you out on your other devices" to={`${base}/password`} />
        </List>
      </Section>

      {user?.role === "user" && (
        <Section title="Your stuff">
          <List>
            <ListItem icon={<MdDevices />} title="My devices" to="/c/devices" />
            <ListItem icon={<MdSmartToy />} title="FixBot" text="Free diagnosis" to="/c/fixbot" />
          </List>
        </Section>
      )}

      {user?.role === "technician" && (
        <Section title="Work">
          <List>
            <ListItem icon={<MdHistory />} title="Completed jobs" to="/t/history" />
          </List>
        </Section>
      )}

      <Section title="Fixer">
        <List>
          <ListItem icon={<MdMenuBook />} leadTone="muted" title="Guides and videos" to="/learn" />
          <ListItem icon={<MdHelpOutline />} leadTone="muted" title="Help and policies" to="/help" />
          <ListItem icon={<MdLogout />} leadTone="error" title="Sign out" onClick={signOut} />
        </List>
      </Section>
      <p className="center t-body-sm muted">Fixer for Android · v{import.meta.env.VITE_APP_VERSION || "1.0.0"}</p>
    </Screen>
  );
}
