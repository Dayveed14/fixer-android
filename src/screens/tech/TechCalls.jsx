import { useState } from "react";
import { MdCall, MdVideocam, MdDesktopWindows, MdEventAvailable } from "react-icons/md";
import { AppBar, EmptyState, List, ListItem, Notice, Pill, Screen, Section, SkeletonList, Tabs } from "../../ui";
import { nowInBusinessTz } from "../../core/utils/schedule";
import { CALL_LABELS, bookingTone, capitalize, formatDate, formatTime, dayKey } from "../../lib/format";
import useJobs from "./useJobs";
import { AppointmentSheet } from "./JobSheets";

const ICONS = { voice: <MdCall />, video: <MdVideocam />, remote_desktop: <MdDesktopWindows /> };

function Group({ title, items, onOpen }) {
  if (!items.length) return null;
  return (
    <Section title={title}>
      <List>
        {items.map((b) => (
          <ListItem
            key={b.id}
            icon={ICONS[b.support_type]}
            leadTone={b.status === "confirmed" ? undefined : "muted"}
            over={`${formatDate(b.booking_date, { weekday: true, year: false })} · ${formatTime(b.booking_time)}`}
            title={b.customer_name}
            text={`${CALL_LABELS[b.support_type]}${b.issue_summary ? `: ${b.issue_summary}` : ""}`}
            trailing={<Pill tone={bookingTone(b.status)}>{capitalize(b.status)}</Pill>}
            onClick={() => onOpen(b)}
          />
        ))}
      </List>
    </Section>
  );
}

export default function TechCalls() {
  const { appointments, loading, errors, reload } = useJobs();
  const [tab, setTab] = useState("upcoming");
  const [open, setOpen] = useState(null);
  const today = nowInBusinessTz().date;
  const day = (b) => dayKey(b.booking_date);
  const sorted = appointments.slice().sort((a, b) => `${day(a)}${a.booking_time}`.localeCompare(`${day(b)}${b.booking_time}`));
  const live = sorted.filter((b) => ["confirmed", "pending"].includes(b.status));
  const past = sorted.filter((b) => !["confirmed", "pending"].includes(b.status)).reverse();

  return (
    <Screen appBar={<AppBar title="Calls" subtitle="Voice, video and remote sessions" />}>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "upcoming", label: "Upcoming", count: live.length },
          { value: "past", label: "Past" },
        ]}
      />
      {errors.map((e) => (
        <Notice key={e} tone="error">
          {e}
        </Notice>
      ))}
      {loading ? (
        <SkeletonList />
      ) : tab === "upcoming" ? (
        live.length === 0 ? (
          <EmptyState icon={<MdEventAvailable />} title="No calls coming up">
            Calls the admin assigns to you show up here.
          </EmptyState>
        ) : (
          <>
            <Group title="Today" items={live.filter((b) => day(b) === today)} onOpen={setOpen} />
            <Group title="Coming up" items={live.filter((b) => day(b) > today)} onOpen={setOpen} />
            <Group title="Overdue" items={live.filter((b) => day(b) < today)} onOpen={setOpen} />
          </>
        )
      ) : past.length === 0 ? (
        <EmptyState icon={<MdEventAvailable />} title="No past calls" />
      ) : (
        <Group title="" items={past} onOpen={setOpen} />
      )}
      {open && <AppointmentSheet key={open.id} booking={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </Screen>
  );
}
