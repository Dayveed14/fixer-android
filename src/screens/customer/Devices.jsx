import { useState } from "react";
import { MdAdd, MdLaptop, MdDelete } from "react-icons/md";
import { AppBar, Button, EmptyState, ErrorState, Fab, IconButton, List, ListItem, Notice, Screen, Sheet, SkeletonList, TextField, useAsync, useConfirm, useSnack } from "../../ui";
import api from "../../core/api/client";
import { formatDate } from "../../lib/format";

const empty = { device_name: "", brand: "", os: "", serial_number: "" };

export default function Devices() {
  const snack = useSnack();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useAsync(() => api.get("/api/devices").then((r) => r.data));
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    if (!f.device_name.trim()) {
      setFormError("Give the device a name.");
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await api.post("/api/devices", {
        device_name: f.device_name.trim(),
        brand: f.brand.trim() || null,
        os: f.os.trim() || null,
        serial_number: f.serial_number.trim() || null,
      });
      setOpen(false);
      setF(empty);
      snack("Device added");
      reload();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d) => {
    if (!(await confirm({ title: `Remove ${d.device_name}?`, confirm: "Remove", danger: true }))) return;
    try {
      await api.delete(`/api/devices/${d.id}`);
      snack("Device removed");
      reload();
    } catch (err) {
      snack(err.message);
    }
  };

  const list = data || [];

  return (
    <Screen appBar={<AppBar title="My devices" back />} fab={<Fab icon={<MdAdd />} label="Add device" onClick={() => setOpen(true)} />}>
      {loading && !data ? (
        <SkeletonList rows={2} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={<MdLaptop />} title="No devices yet" action={<Button onClick={() => setOpen(true)}>Add a device</Button>}>
          Keep your devices here so technicians know what they're working with.
        </EmptyState>
      ) : (
        <List>
          {list.map((d) => (
            <ListItem
              key={d.id}
              icon={<MdLaptop />}
              title={d.device_name}
              text={[d.brand, d.os, d.serial_number && `S/N ${d.serial_number}`].filter(Boolean).join(" · ") + (d.last_serviced_at ? ` · Serviced ${formatDate(d.last_serviced_at)}` : "")}
              trailing={<IconButton icon={<MdDelete />} label={`Remove ${d.device_name}`} onClick={() => remove(d)} />}
            />
          ))}
        </List>
      )}

      <Sheet open={open} onClose={() => !busy && setOpen(false)} title="Add a device">
        <TextField label="Name" value={f.device_name} onChange={set("device_name")} supporting="e.g. Work laptop" maxLength={120} />
        <TextField label="Brand (optional)" value={f.brand} onChange={set("brand")} maxLength={80} />
        <TextField label="Operating system (optional)" value={f.os} onChange={set("os")} supporting="e.g. Windows 11, Android 14" maxLength={80} />
        <TextField label="Serial number (optional)" value={f.serial_number} onChange={set("serial_number")} maxLength={120} />
        {formError && <Notice tone="error">{formError}</Notice>}
        <Button size="lg" loading={busy} onClick={save}>
          Save device
        </Button>
      </Sheet>
    </Screen>
  );
}
