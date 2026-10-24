import { useGoBack } from "../../core/nav";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdUpload, MdSave, MdImage, MdMovie } from "react-icons/md";
import { AppBar, Button, ErrorState, Loading, Notice, Screen, Section, Segmented, TextField, useAsync, useSnack } from "../../ui";
import api, { TIMEOUTS } from "../../core/api/client";

const empty = { title: "", slug: "", category: "", excerpt: "", content: "", tags: "", image_alt: "", status: "draft" };

/**
 * New / edit article or video. Same fields and endpoints as the web
 * admin; the server checks everything again.
 */
export default function AdminContentEdit() {
  const { kind, key } = useParams();
  const isVideo = kind === "videos";
  const isNew = !key;
  const base = isVideo ? "/api/diy-videos" : "/api/articles";
  const navigate = useNavigate();
  const goBack = useGoBack();
  const snack = useSnack();
  const fileInput = useRef(null);
  const [f, setF] = useState(empty);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const { data: existing, error: loadError, loading, reload } = useAsync(
    () => (isNew ? Promise.resolve(null) : api.get(`${base}/manage/${encodeURIComponent(key)}`).then((r) => r.data)),
    [kind, key],
  );

  useEffect(() => {
    if (existing) {
      setF({
        title: existing.title || "",
        slug: existing.slug || "",
        category: existing.category || "",
        excerpt: existing.excerpt || "",
        content: existing.content || "",
        tags: existing.tags || "",
        image_alt: existing.image_alt || "",
        status: existing.status === "published" ? "published" : "draft",
      });
    }
  }, [existing]);

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    if (!f.title.trim()) {
      setError("Give it a title.");
      return;
    }
    if (isNew && isVideo && !file) {
      setError("Choose a video file to upload.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = new FormData();
      const fields = isVideo ? ["title", "category", "excerpt", "content", "tags", "status"] : ["title", "category", "excerpt", "content", "tags", "status", "image_alt"];
      fields.forEach((k) => data.append(k, f[k]));
      if (isNew && f.slug.trim()) data.append("slug", f.slug.trim());
      if (file) data.append(isVideo ? "video" : "hero_image", file);

      if (isNew) await api.post(base, data, { timeout: TIMEOUTS.upload });
      else await api.put(`${base}/${encodeURIComponent(isVideo ? existing.id : existing.slug)}`, data, { timeout: TIMEOUTS.upload });

      snack(isNew ? "Created" : "Saved");
      goBack();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (loading && !isNew && !existing) return <Screen appBar={<AppBar title="Edit" back />}><Loading /></Screen>;
  if (loadError) return <Screen appBar={<AppBar title="Edit" back />}><ErrorState message={loadError.message} onRetry={reload} /></Screen>;

  const noun = isVideo ? "video" : "article";
  const currentMedia = isVideo ? existing?.thumbnail_url : existing?.hero_image;

  return (
    <Screen appBar={<AppBar title={isNew ? `New ${noun}` : `Edit ${noun}`} back />}>
      <Segmented
        label="Visibility"
        value={f.status}
        onChange={(status) => setF((x) => ({ ...x, status }))}
        options={[
          { value: "draft", label: "Draft" },
          { value: "published", label: "Published" },
        ]}
      />

      <Section title={isVideo ? "Video file" : "Cover image"}>
        {currentMedia && !file && <img src={currentMedia} alt="" style={{ borderRadius: 12, aspectRatio: "16/9", objectFit: "cover", width: "100%" }} />}
        <input ref={fileInput} type="file" hidden accept={isVideo ? "video/mp4,video/quicktime,video/webm" : "image/jpeg,image/png,image/webp,image/gif"} onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <Button variant="tonal" icon={isVideo ? <MdMovie /> : <MdImage />} onClick={() => fileInput.current?.click()}>
          {file ? file.name : currentMedia ? "Replace" : isVideo ? "Choose video" : "Choose image"}
        </Button>
        <span className="t-body-sm muted">{isVideo ? "MP4, MOV or WebM, up to 150 MB" : "JPG, PNG, WebP or GIF, up to 10 MB"}</span>
      </Section>

      <div className="form">
        <TextField label="Title" value={f.title} onChange={set("title")} maxLength={200} />
        {isNew && <TextField label="Web address (optional)" value={f.slug} onChange={set("slug")} supporting="Made from the title if left empty. Can't be changed later." maxLength={200} />}
        <TextField label="Category" value={f.category} onChange={set("category")} supporting="e.g. Laptops, Phones" maxLength={80} />
        <TextField label="Short summary" multiline rows={3} value={f.excerpt} onChange={set("excerpt")} maxLength={600} />
        <TextField label={isVideo ? "Description" : "Article text"} multiline rows={12} value={f.content} onChange={set("content")} supporting="Leave a blank line between paragraphs" />
        <TextField label="Tags (optional)" value={f.tags} onChange={set("tags")} supporting="Comma separated" maxLength={500} />
        {!isVideo && <TextField label="Image description (optional)" value={f.image_alt} onChange={set("image_alt")} supporting="Read aloud by screen readers" maxLength={200} />}
      </div>

      {error && <Notice tone="error">{error}</Notice>}
      <Button size="lg" icon={file ? <MdUpload /> : <MdSave />} loading={busy} onClick={save}>
        {busy && file ? "Uploading…" : isNew ? (f.status === "published" ? "Publish" : "Save draft") : "Save changes"}
      </Button>
    </Screen>
  );
}
