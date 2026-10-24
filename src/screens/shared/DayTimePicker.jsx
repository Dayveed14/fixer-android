import { useEffect, useMemo, useState } from "react";
import { Chip, EmptyState } from "../../ui";
import { MdEventBusy } from "react-icons/md";
import { addDays, availableSlots, formatSlot, isDateBookable, MAX_DAYS_AHEAD, nowInBusinessTz } from "../../core/utils/schedule";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Horizontal day strip + time chips. Only offers what the server will
 * accept (8am–10pm Abuja time, enough notice for today). `kind` is
 * "booking" (30-min calls) or "pickup" (1-hour windows).
 */
export default function DayTimePicker({ kind, date, time, onChange, formatTimeLabel = formatSlot }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const today = nowInBusinessTz(now).date;
  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i <= Math.min(MAX_DAYS_AHEAD, 21); i += 1) {
      const d = addDays(today, i);
      if (isDateBookable(d, kind, now)) list.push(d);
    }
    return list;
  }, [today, kind, now]);

  const slots = useMemo(() => (date ? availableSlots(date, kind, now) : []), [date, kind, now]);

  // First open: pick the first available day.
  useEffect(() => {
    if (!date && days[0]) onChange({ date: days[0], time: null });
    if (date && time && !slots.includes(time)) onChange({ date, time: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, slots]);

  return (
    <>
      <div className="days" role="listbox" aria-label="Day">
        {days.map((d) => {
          const [y, m, day] = d.split("-").map(Number);
          const dt = new Date(Date.UTC(y, m - 1, day));
          return (
            <button key={d} type="button" role="option" aria-selected={d === date} className={`day ${d === date ? "is-selected" : ""}`} onClick={() => onChange({ date: d, time: null })}>
              <small>{d === today ? "Today" : DOW[dt.getUTCDay()]}</small>
              <b>{day}</b>
              <small>{MONTHS[m - 1]}</small>
            </button>
          );
        })}
      </div>
      {slots.length === 0 ? (
        <EmptyState icon={<MdEventBusy />} title="No times left">
          Pick another day.
        </EmptyState>
      ) : (
        <div className="slots" role="listbox" aria-label="Time">
          {slots.map((s) => (
            <Chip key={s} selected={s === time} onClick={() => onChange({ date, time: s })}>
              {formatTimeLabel(s)}
            </Chip>
          ))}
        </div>
      )}
    </>
  );
}
