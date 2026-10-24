import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdNotificationsNone, MdWork, MdCheckCircle, MdBuild, MdLaptop, MdCall, MdVideocam, MdDesktopWindows, MdPerson, MdStar } from "react-icons/md";
import { AppBar, Button, Card, EmptyState, IconButton, List, ListItem, Notice, Pill, Screen, Section, StatTile, useAsync } from "../../ui";
import api from "../../core/api/client";
import { getStoredUser } from "../../core/session";
import { useNotifications } from "../../core/notifications";
import { nowInBusinessTz } from "../../core/utils/schedule";
import { whatsappNumber } from "../../core/utils/jobs";
import { openExternal } from "../../core/native";
import { CALL_LABELS, formatTime, telHref, dayKey } from "../../lib/format";
import useJobs from "./useJobs";
import { AppointmentSheet, RepairSheet } from "./JobSheets";

const CALL_ICONS = { voice: <MdCall />, video: <MdVideocam />, remote_desktop: <MdDesktopWindows /> };

export default function TechToday() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { unread } = useNotifications();
  const { appointments, repairs, reload } = useJobs();
  const [openCall, setOpenCall] = useState(null);
  const [openRepair, setOpenRepair] = useState(null);

  const { data: extra, reload: reloadExtra } = useAsync(async () => {
    const [stats, active] = await Promise.allSettled([
      api.get(`/api/stats/technician/${user.id}`).then((r) => r.data),
      api.get(`/api/tickets/active/${user.id}`).then((r) => r.data),
    ]);
    return { stats: stats.status === "fulfilled" ? stats.value : {}, active: active.status === "fulfilled" ? active.value : null };
  });

  const today = nowInBusinessTz().date;
  const todaysCalls = appointments
    .filter((b) => dayKey(b.booking_date) === today && b.status === "confirmed")
    .sort((a, b) => String(a.booking_time).localeCompare(String(b.booking_time)));
  const waitingRepairs = repairs.filter((r) => r.status === "repair" && !r.repair_outcome);
  const s = extra?.stats || {};
  const active = extra?.active;
  const refresh = () => {
    reload();
    reloadExtra();
  };

  return (
    <Screen appBar={<AppBar variant="brand" logo actions={<IconButton icon={<MdNotificationsNone />} label="Notifications" badge={unread} onClick={() => navigate("/t/notifications")} />} />}>
      <div className="brand-head">
        <h2>Hi {user?.first_name || "there"}</h2>
        <p>
          {todaysCalls.length ? `${todaysCalls.length} call${todaysCalls.length > 1 ? "s" : ""} today` : "No calls today"}
          {waitingRepairs.length ? ` · ${waitingRepairs.length} repair${waitingRepairs.length > 1 ? "s" : ""} waiting` : ""}
        </p>
      </div>

      {active && (
        <Card variant="primary">
          <div className="row" style={{ gap: 16 }}>
            <span className="route-card__icon">
              <MdPerson />
            </span>
            <div className="grow">
              <span className="t-label-sm">Current customer</span>
              <p className="card__title" style={{ margin: 0 }}>
                {active.customer_name}
              </p>
              <p className="card__text">{active.device ? `${active.device}: ${active.issue}` : active.issue}</p>
            </div>
          </div>
          {active.customer_phone && (
            <div className="btn-row" style={{ marginTop: 12 }}>
              <Button icon={<MdCall />} onClick={() => openExternal(telHref(active.customer_phone))}>
                Call
              </Button>
              {whatsappNumber(active.customer_phone) && (
                <Button variant="tonal" onClick={() => openExternal(`https://wa.me/${whatsappNumber(active.customer_phone)}`)}>
                  WhatsApp
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      <Section title="Today's calls" action={<Button variant="text" to="/t/calls">All calls</Button>}>
        {todaysCalls.length === 0 ? (
          <Card variant="tonal">
            <p className="card__text">Nothing booked for today.</p>
          </Card>
        ) : (
          <List>
            {todaysCalls.map((b) => (
              <ListItem key={b.id} icon={CALL_ICONS[b.support_type]} over={formatTime(b.booking_time)} title={b.customer_name} text={CALL_LABELS[b.support_type]} onClick={() => setOpenCall(b)} chevron />
            ))}
          </List>
        )}
      </Section>

      {waitingRepairs.length > 0 && (
        <Section title="Repairs waiting for you">
          <List>
            {waitingRepairs.map((r) => (
              <ListItem key={r.id} icon={<MdBuild />} leadTone="warn" over={r.reference} title={`${r.brand || ""} ${r.device || ""}`.trim()} text={r.diagnosis_summary || r.fault} onClick={() => setOpenRepair(r)} chevron />
            ))}
          </List>
        </Section>
      )}

      <Section title="Your numbers">
        <div className="stats">
          <StatTile icon={<MdWork />} value={s.assignedJobs ?? "–"} label="Assigned jobs" to="/t/jobs" />
          <StatTile icon={<MdCheckCircle />} value={s.completedToday ?? "–"} label="Completed today" to="/t/history" />
          <StatTile icon={<MdBuild />} value={s.pendingRepairs ?? "–"} label="Pending repairs" to="/t/repairs" tone={s.pendingRepairs > 0 ? "warn" : undefined} />
          <StatTile icon={<MdLaptop />} value={s.devicesRepaired ?? "–"} label="Devices repaired" to="/t/history" />
        </div>
        <Card variant="outlined">
          <div className="row">
            <MdStar style={{ color: "#f5a623", fontSize: 28 }} />
            <div>
              <p className="card__title" style={{ margin: 0 }}>
                {s.performancePercent == null ? "No ratings yet" : `${s.performancePercent}% customer satisfaction`}
              </p>
              <p className="card__text">From customers' ratings of completed jobs</p>
            </div>
          </div>
        </Card>
      </Section>

      {openCall && <AppointmentSheet key={openCall.id} booking={openCall} onClose={() => setOpenCall(null)} onChanged={refresh} />}
      {openRepair && <RepairSheet key={openRepair.id} repair={openRepair} onClose={() => setOpenRepair(null)} onChanged={refresh} />}
    </Screen>
  );
}
