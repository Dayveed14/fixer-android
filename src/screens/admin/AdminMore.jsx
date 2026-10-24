import { useNavigate } from "react-router-dom";
import { MdPeople, MdEngineering, MdPersonAdd, MdArticle, MdVideoLibrary, MdPayments, MdPriceChange, MdSmartToy, MdNotificationsNone, MdLock, MdLogout, MdHelpOutline } from "react-icons/md";
import { AppBar, Avatar, List, ListItem, Pill, Screen, Section, useConfirm } from "../../ui";
import { getStoredUser } from "../../core/session";
import { logout } from "../../core/api/auth.api";
import { useNotifications } from "../../core/notifications";
import { fullName } from "../../lib/format";

export default function AdminMore() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const user = getStoredUser();
  const { unread } = useNotifications();

  const signOut = async () => {
    if (!(await confirm({ title: "Sign out?", confirm: "Sign out" }))) return;
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <Screen appBar={<AppBar title="More" />}>
      <List>
        <ListItem avatar={<Avatar name={fullName(user)} />} title={fullName(user)} text={user?.email} trailing={<Pill tone="primary">Admin</Pill>} />
      </List>

      <Section title="People">
        <List>
          <ListItem icon={<MdPeople />} title="Customers" to="/a/people/users" />
          <ListItem icon={<MdEngineering />} title="Technicians" to="/a/people/technicians" />
          <ListItem icon={<MdPersonAdd />} title="Add a technician or customer" to="/a/people/new" />
        </List>
      </Section>

      <Section title="Money">
        <List>
          <ListItem icon={<MdPayments />} title="Payments & alerts" text="Every payment, unused payments, system health" to="/a/payments" />
          <ListItem icon={<MdPriceChange />} title="Pricing" text="Call prices, pickup areas, delivery rules" to="/a/pricing" />
        </List>
      </Section>

      <Section title="Content">
        <List>
          <ListItem icon={<MdArticle />} title="Articles" to="/a/content/articles" />
          <ListItem icon={<MdVideoLibrary />} title="DIY videos" to="/a/content/videos" />
          <ListItem icon={<MdSmartToy />} title="FixBot" text="Run a diagnosis" to="/a/fixbot" />
        </List>
      </Section>

      <Section title="Account">
        <List>
          <ListItem icon={<MdNotificationsNone />} title="Notifications" trailing={unread > 0 && <Pill tone="error">{unread} new</Pill>} to="/a/notifications" />
          <ListItem icon={<MdLock />} title="Change password" to="/a/password" />
          <ListItem icon={<MdHelpOutline />} leadTone="muted" title="Help and policies" to="/help" />
          <ListItem icon={<MdLogout />} leadTone="error" title="Sign out" onClick={signOut} />
        </List>
      </Section>
    </Screen>
  );
}
