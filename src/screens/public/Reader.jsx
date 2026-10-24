import { useParams, useLocation } from "react-router-dom";
import { MdArticle, MdShare } from "react-icons/md";
import { AppBar, ErrorState, IconButton, Loading, Pill, Screen, useAsync } from "../../ui";
import api from "../../core/api/client";
import { toRichHtml } from "../../core/utils/richText";
import { formatDate } from "../../lib/format";
import { getStoredUser } from "../../core/session";

const SITE = "https://fixerng.app";

export default function Reader() {
  const { kind, slug } = useParams();
  const { pathname } = useLocation();
  const isVideo = kind === "video";
  const base = isVideo ? "/api/diy-videos" : "/api/articles";

  const { data: item, error, loading, reload } = useAsync(async () => {
    try {
      return (await api.get(`${base}/${encodeURIComponent(slug)}`)).data;
    } catch (err) {
      // Admins can preview drafts.
      if (err.status === 404 && getStoredUser()?.role === "admin") return (await api.get(`${base}/manage/${encodeURIComponent(slug)}`)).data;
      throw err;
    }
  }, [kind, slug]);

  const share = async () => {
    const url = `${SITE}/${isVideo ? "uservideo" : "userarticle"}/${encodeURIComponent(slug)}`;
    try {
      if (navigator.share) await navigator.share({ title: item?.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* cancelled */
    }
  };

  return (
    <Screen appBar={<AppBar title={item?.title || (isVideo ? "Video" : "Article")} back actions={item && <IconButton icon={<MdShare />} label="Share" onClick={share} />} />}>
      {loading && !item ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error.status === 404 ? "This guide isn't available any more." : error.message} onRetry={reload} />
      ) : (
        <>
          <div className="reader-hero">
            {isVideo ? (
              <video src={item.video_url} poster={item.thumbnail_url || undefined} controls playsInline preload="metadata" />
            ) : (
              <span className="cover">{item.hero_image ? <img src={item.hero_image} alt={item.image_alt || ""} /> : <MdArticle />}</span>
            )}
          </div>
          <div className="stack">
            <div className="row" style={{ flexWrap: "wrap" }}>
              {item.category && <Pill tone="primary">{item.category}</Pill>}
              {item.status && item.status !== "published" && <Pill tone="warn">Draft preview</Pill>}
              <span className="t-body-sm muted">{formatDate(item.created_at)}</span>
            </div>
            <h1 className="t-headline-sm" style={{ margin: 0 }}>
              {item.title}
            </h1>
          </div>
          <div className="rich" dangerouslySetInnerHTML={{ __html: toRichHtml(item.content) }} />
          {pathname.startsWith("/a/") && <p className="t-body-sm muted">Preview as customers see it.</p>}
        </>
      )}
    </Screen>
  );
}
