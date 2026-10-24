import { useState } from "react";
import { MdBuild, MdDoneAll } from "react-icons/md";
import { AppBar, Chip, EmptyState, List, ListItem, Notice, Pill, Screen, SkeletonList } from "../../ui";
import { repairToJob } from "../../core/utils/jobs";
import { capitalize } from "../../lib/format";
import useJobs from "./useJobs";
import { RepairSheet } from "./JobSheets";

export default function TechRepairs() {
  const { repairs, loading, errors, reload } = useJobs();
  const [showDone, setShowDone] = useState(false);
  const [open, setOpen] = useState(null);
  const visible = repairs.filter((r) => showDone || (r.status === "repair" && !r.repair_outcome));

  return (
    <Screen appBar={<AppBar title="Repairs" subtitle="Mail-in devices assigned to you" />}>
      <div className="chips">
        <Chip selected={!showDone} onClick={() => setShowDone(false)}>
          Waiting for me
        </Chip>
        <Chip selected={showDone} onClick={() => setShowDone(true)}>
          All repairs
        </Chip>
      </div>
      {errors.map((e) => (
        <Notice key={e} tone="error">
          {e}
        </Notice>
      ))}
      {loading ? (
        <SkeletonList />
      ) : visible.length === 0 ? (
        <EmptyState icon={<MdDoneAll />} title="No repairs waiting">
          When the admin starts a repair and assigns it to you, it appears here.
        </EmptyState>
      ) : (
        <List>
          {visible.map((r) => {
            const job = repairToJob(r);
            return (
              <ListItem
                key={r.id}
                icon={<MdBuild />}
                leadTone={job.state === "active" ? "warn" : "ok"}
                over={`${r.reference} · ${r.name}`}
                title={job.title}
                text={job.subtitle}
                trailing={<Pill tone={job.state === "active" ? "warn" : "ok"}>{capitalize(job.statusLabel)}</Pill>}
                onClick={() => setOpen(r)}
              />
            );
          })}
        </List>
      )}
      {open && <RepairSheet key={open.id} repair={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </Screen>
  );
}
