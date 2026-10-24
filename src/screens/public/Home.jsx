import { useNavigate, Link } from "react-router-dom";
import { MdSmartToy, MdHeadsetMic, MdLocalShipping, MdPlayArrow, MdArticle, MdArrowForward } from "react-icons/md";
import { AppBar, Button, Card, Chip, Screen, Section, useAsync } from "../../ui";
import FixBotMascot from "../../ui/fixbot/FixBotMascot";
import { getSupportTypes } from "../../core/api/bookings.api";
import { getDispatchZones } from "../../core/api/shipments.api";
import api from "../../core/api/client";
import { naira } from "../../lib/format";

export const SYMPTOMS = [
  { label: "Won't charge", device: "Laptop" },
  { label: "Overheating", device: "Laptop" },
  { label: "Battery drains fast", device: "Laptop" },
  { label: "Lagging", device: "Laptop" },
  { label: "Random restart", device: "Desktop PC" },
  { label: "Keyboard not working", device: "Laptop" },
  { label: "Touchscreen unresponsive", device: "Other" },
];

export function usePrices() {
  return useAsync(async () => {
    const [types, zones] = await Promise.allSettled([getSupportTypes(), getDispatchZones()]);
    const amounts = types.status === "fulfilled" ? types.value.map((t) => Number(t.amount)).filter((n) => n > 0) : [];
    const zoneList = zones.status === "fulfilled" ? zones.value?.zones || [] : [];
    const fees = zoneList.map((z) => Number(z.fee)).filter((n) => n > 0);
    return {
      call: amounts.length ? Math.min(...amounts) : null,
      pickup: fees.length ? Math.min(...fees) : null,
      zones: zoneList.length || null,
    };
  });
}

export function useLatestContent(limit = 6) {
  return useAsync(async () => {
    const [a, v] = await Promise.allSettled([api.get("/api/articles/published"), api.get("/api/diy-videos/published")]);
    const articles = a.status === "fulfilled" && Array.isArray(a.value.data) ? a.value.data.map((x) => ({ ...x, kind: "article" })) : [];
    const videos = v.status === "fulfilled" && Array.isArray(v.value.data) ? v.value.data.map((x) => ({ ...x, kind: "video" })) : [];
    return [...articles, ...videos].sort((x, y) => new Date(y.created_at) - new Date(x.created_at)).slice(0, limit);
  });
}

export function ContentCard({ item, base = "/learn" }) {
  const image = item.kind === "video" ? item.thumbnail_url : item.hero_image;
  return (
    <Link to={`${base}/${item.kind}/${encodeURIComponent(item.slug)}`} className="content-card">
      <span className="cover">
        {image ? <img src={image} alt="" loading="lazy" /> : item.kind === "video" ? <MdPlayArrow /> : <MdArticle />}
        {item.kind === "video" && image && (
          <span className="cover__play">
            <MdPlayArrow />
          </span>
        )}
      </span>
      <strong>{item.title}</strong>
      <span className="t-body-sm muted">{item.kind === "video" ? "Video" : item.category || "Guide"}</span>
    </Link>
  );
}

/** Compact list row for the Learn tab: thumbnail left, title right. */
export function ContentRow({ item, base = "/learn" }) {
  const image = item.kind === "video" ? item.thumbnail_url : item.hero_image;
  return (
    <Link to={`${base}/${item.kind}/${encodeURIComponent(item.slug)}`} className="content-row">
      <span className="cover">
        {image ? <img src={image} alt="" loading="lazy" /> : item.kind === "video" ? <MdPlayArrow /> : <MdArticle />}
      </span>
      <span className="content-row__body">
        <span className="t-label-sm muted">{item.kind === "video" ? "Video" : item.category || "Guide"}</span>
        <strong>{item.title}</strong>
      </span>
    </Link>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { data: prices } = usePrices();
  const { data: content } = useLatestContent();

  return (
    <Screen appBar={<AppBar variant="brand" logo actions={<Button variant="light" to="/login" className="btn--sm">Sign in</Button>} />}>
      <div className="brand-head">
        <div className="home-hero">
          <div>
            <h2>Broken device? Bring it to the bench.</h2>
            <p>Abuja's repair shop in your pocket.</p>
          </div>
          <FixBotMascot size={104} />
        </div>

        <div className="home-ask">
          <p>What's your device doing?</p>
          <div className="chips chips--scroll">
            {SYMPTOMS.map((s) => (
              <Chip key={s.label} onClick={() => navigate(`/fixbot?symptom=${encodeURIComponent(s.label)}&device=${encodeURIComponent(s.device)}`)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <Section title="Get it fixed">
        <Card variant="tonal" to="/fixbot">
          <div className="route-card">
            <span className="route-card__icon">
              <MdSmartToy />
            </span>
            <div className="route-card__body">
              <strong>Ask FixBot</strong>
              <span>Likely cause and cost in minutes</span>
            </div>
            <span className="route-card__price">
              <b>Free</b>
            </span>
          </div>
        </Card>
        <Card variant="tonal" to="/login" state={{ from: "/c/book" }}>
          <div className="route-card">
            <span className="route-card__icon">
              <MdHeadsetMic />
            </span>
            <div className="route-card__body">
              <strong>Talk to a technician</strong>
              <span>Voice, video or remote, 8am to 10pm</span>
            </div>
            {prices?.call && (
              <span className="route-card__price">
                from<b>{naira(prices.call)}</b>
              </span>
            )}
          </div>
        </Card>
        <Card variant="tonal" to="/login" state={{ from: "/c/pickup" }}>
          <div className="route-card">
            <span className="route-card__icon">
              <MdLocalShipping />
            </span>
            <div className="route-card__body">
              <strong>Send it in for repair</strong>
              <span>{prices?.zones ? `Pickup from ${prices.zones} areas in Abuja` : "Pickup anywhere in Abuja"}</span>
            </div>
            {prices?.pickup && (
              <span className="route-card__price">
                from<b>{naira(prices.pickup)}</b>
              </span>
            )}
          </div>
        </Card>
      </Section>

      <Section title="How a repair works">
        <Card variant="outlined">
          <ol className="steps">
            <li>
              <div>
                <strong>We collect it</strong>
                <span>Pick a time; a rider comes to you.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>You approve the quote</strong>
                <span>We diagnose it and send the price. Nothing is fixed until you say so.</span>
              </div>
            </li>
            <li>
              <div>
                <strong>We fix it and bring it back</strong>
                <span>Track every step in the app.</span>
              </div>
            </li>
          </ol>
        </Card>
      </Section>

      {content?.length > 0 && (
        <Section
          title="Fix it yourself"
          action={
            <Button variant="text" to="/learn" icon={<MdArrowForward />}>
              All guides
            </Button>
          }>
          <div className="carousel">
            {content.map((item) => (
              <ContentCard key={`${item.kind}-${item.slug}`} item={item} />
            ))}
          </div>
        </Section>
      )}

      <Card variant="primary">
        <p className="card__title">New to Fixer?</p>
        <p className="card__text">Create an account to book technicians, track repairs and keep your devices in one place.</p>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <Button to="/register">Create account</Button>
          <Button variant="text" to="/login">
            Sign in
          </Button>
        </div>
      </Card>
    </Screen>
  );
}
