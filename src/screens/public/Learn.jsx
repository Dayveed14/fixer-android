import { useMemo, useState } from "react";
import { MdMenuBook, MdSearch } from "react-icons/md";
import { AppBar, Chip, EmptyState, ErrorState, Screen, SkeletonList, TextField, useAsync } from "../../ui";
import api from "../../core/api/client";
import { ContentRow } from "./Home";

export default function Learn() {
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState("");

  const { data, error, loading, reload } = useAsync(async () => {
    const [a, v] = await Promise.all([api.get("/api/articles/published"), api.get("/api/diy-videos/published")]);
    return [
      ...(a.data || []).map((x) => ({ ...x, kind: "article" })),
      ...(v.data || []).map((x) => ({ ...x, kind: "video" })),
    ].sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
  });

  const categories = useMemo(() => [...new Set((data || []).map((x) => x.category).filter(Boolean))], [data]);
  const visible = (data || []).filter(
    (x) =>
      (kind === "all" || x.kind === kind) &&
      (!category || x.category === category) &&
      (!query || `${x.title} ${x.excerpt || ""}`.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <Screen appBar={<AppBar title="Learn" subtitle="Repair guides and videos" />}>
      <TextField label="Search guides" value={query} onChange={(e) => setQuery(e.target.value)} type="search" trailing={<MdSearch style={{ margin: 12, fontSize: 24 }} className="muted" />} />
      <div className="chips chips--scroll">
        {[
          ["all", "All"],
          ["article", "Articles"],
          ["video", "Videos"],
        ].map(([v, l]) => (
          <Chip key={v} selected={kind === v} onClick={() => setKind(v)}>
            {l}
          </Chip>
        ))}
        {categories.map((c) => (
          <Chip key={c} selected={category === c} onClick={() => setCategory(category === c ? null : c)}>
            {c}
          </Chip>
        ))}
      </div>

      {loading && !data ? (
        <SkeletonList rows={3} />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : visible.length === 0 ? (
        <EmptyState icon={<MdMenuBook />} title="Nothing here yet">
          {query ? "No guides match your search." : "New guides are on the way."}
        </EmptyState>
      ) : (
        <div className="stack">
          {visible.map((item) => (
            <ContentRow key={`${item.kind}-${item.slug}`} item={item} />
          ))}
        </div>
      )}
    </Screen>
  );
}
