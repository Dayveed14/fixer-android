import { useState } from "react";
import { MdCall, MdBuild, MdConfirmationNumber, MdWorkOff } from "react-icons/md";
import { AppBar, Chip, EmptyState, List, ListItem, Notice, Pill, Screen, SkeletonList } from "../../ui";
import { capitalize } from "../../lib/format";
import useJobs from "./useJobs";
import { JobSheet } from "./JobSheets";

const KIND_ICON = { appointment: <MdCall />, repair: <MdBuild />, ticket: <MdConfirmationNumber /> };
const KIND_LABEL = { appointment: "Call", repair: "Repair", ticket: "Ticket" };
const STATE_TONE = { active: "primary", done: "ok", closed: "muted" };

export default function TechJobs() {
  const { jobs, loading, errors, reload } = useJobs();
  const [filter, setFilter] = useState("active");
  const [kind, setKind] = useState("all");
  const [open, setOpen] = useState(null);

  const visible = jobs.filter((j) => (filter === "all" || j.state === filter) && (kind === "all" || j.kind === kind));

  return (
    <Screen appBar={<AppBar title="Assigned jobs" subtitle="Calls, repairs and tickets" />}>
      <div className="chips chips--scroll">
        {[
          ["active", "To do"],
          ["done", "Done"],
          ["all", "All"],
        ].map(([v, l]) => (
          <Chip key={v} selected={filter === v} onClick={() => setFilter(v)}>
            {l}
          </Chip>
        ))}
        <span style={{ width: 8, flex: "none" }} />
        {[
          ["all", "Every kind"],
          ["appointment", "Calls"],
          ["repair", "Repairs"],
          ["ticket", "Tickets"],
        ].map(([v, l]) => (
          <Chip key={v} selected={kind === v} onClick={() => setKind(v)}>
            {l}
          </Chip>
        ))}
      </div>

      {errors.map((e) => (
        <Notice key={e} tone="error">
          {e}
        </Notice>
      ))}

      {loading ? (
        <SkeletonList />
      ) : visible.length === 0 ? (
        <EmptyState icon={<MdWorkOff />} title={filter === "active" ? "All caught up" : "No jobs"}>
          {filter === "active" ? "Nothing waiting for you right now." : "Jobs the admin assigns to you appear here."}
        </EmptyState>
      ) : (
        <List>
          {visible.map((j) => (
            <ListItem
              key={j.key}
              icon={KIND_ICON[j.kind]}
              leadTone={j.state === "active" ? undefined : "muted"}
              over={`${KIND_LABEL[j.kind]} · ${j.reference || ""} · ${j.when}`}
              title={j.customer || j.title}
              text={`${j.title}${j.subtitle ? `: ${j.subtitle}` : ""}`}
              trailing={<Pill tone={STATE_TONE[j.state]}>{capitalize(j.statusLabel)}</Pill>}
              onClick={() => setOpen(j)}
            />
          ))}
        </List>
      )}

      {open && <JobSheet key={open.key} job={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </Screen>
  );
}
