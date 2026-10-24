import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdAdd, MdArticle, MdPlayArrow, MdEdit, MdVisibility, MdDelete } from "react-icons/md";
import { AppBar, Button, Chip, EmptyState, ErrorState, Fab, List, ListItem, Pill, Screen, Sheet, SkeletonList, useAsync, useConfirm, useSnack } from "../../ui";
import api from "../../core/api/client";
import { formatDate } from "../../lib/format";

export default function AdminContent() {
  const { kind } = useParams();
  const isVideo = kind === "videos";
  const base = isVideo ? "/api/diy-videos" : "/api/articles";
  const navigate = useNavigate();
  const snack = useSnack();
  const confirm = useConfirm();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(null);
  const { data, error, loading, reload } = useAsync(() => api.get(base).then((r) => r.data), [kind]);

  const list = (data || []).filter((x) => filter === "all" || (x.status || "draft") === filter);
  const keyOf = (x) => (isVideo ? x.id : x.slug);

  const remove = async (x) => {
    setOpen(null);
    if (!(await confirm({ title: `Delete “${x.title}”?`, body: "It disappears from the app and website.", confirm: "Delete", danger: true }))) return;
    try {
      await api.delete(`${base}/${x.id}`);
      snack("Deleted");
      reload();
    } catch (err) {
      snack(err.message);
    }
  };

  return (
    <Screen appBar={<AppBar title={isVideo ? "DIY videos" : "Articles"} back />} fab={<Fab icon={<MdAdd />} label={isVideo ? "New video" : "New article"} to={`/a/content/${kind}/new`} />}>
      <div className="chips">
        {[
          ["all", "All"],
          ["published", "Published"],
          ["draft", "Drafts"],
        ].map(([v, l]) => (
          <Chip key={v} selected={filter === v} onClick={() => setFilter(v)}>
            {l}
          </Chip>
        ))}
      </div>
      {loading && !data ? (
        <SkeletonList />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon={isVideo ? <MdPlayArrow /> : <MdArticle />} title="Nothing here yet" action={<Button to={`/a/content/${kind}/new`}>Create one</Button>} />
      ) : (
        <List>
          {list.map((x) => (
            <ListItem
              key={x.id}
              icon={isVideo ? <MdPlayArrow /> : <MdArticle />}
              leadTone={x.status === "published" ? undefined : "muted"}
              over={`${x.category || "Uncategorised"} · ${formatDate(x.created_at, { year: false })}`}
              title={x.title}
              trailing={<Pill tone={x.status === "published" ? "ok" : "muted"}>{x.status === "published" ? "Published" : "Draft"}</Pill>}
              onClick={() => setOpen(x)}
            />
          ))}
        </List>
      )}

      <Sheet open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title}>
        {open && (
          <>
            <Button size="lg" icon={<MdEdit />} onClick={() => navigate(`/a/content/${kind}/${encodeURIComponent(keyOf(open))}/edit`)}>
              Edit
            </Button>
            <Button variant="tonal" icon={<MdVisibility />} onClick={() => navigate(`/a/learn/${isVideo ? "video" : "article"}/${encodeURIComponent(open.slug)}`)}>
              Preview
            </Button>
            <Button variant="text" icon={<MdDelete />} onClick={() => remove(open)} style={{ color: "var(--error)" }}>
              Delete
            </Button>
          </>
        )}
      </Sheet>
    </Screen>
  );
}
