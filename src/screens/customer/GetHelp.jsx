import { MdHeadsetMic, MdLocalShipping, MdSmartToy, MdMenuBook } from "react-icons/md";
import { AppBar, Card, Screen } from "../../ui";
import { naira } from "../../lib/format";
import { usePrices } from "../public/Home";

function Route({ to, icon, title, text, price }) {
  return (
    <Card variant="tonal" to={to}>
      <div className="route-card">
        <span className="route-card__icon">{icon}</span>
        <div className="route-card__body">
          <strong>{title}</strong>
          <span>{text}</span>
        </div>
        {price && <span className="route-card__price">{price}</span>}
      </div>
    </Card>
  );
}

export default function GetHelp() {
  const { data: p } = usePrices();
  return (
    <Screen appBar={<AppBar title="Get help" subtitle="Choose how you'd like it fixed" />}>
      <Route to="/c/book" icon={<MdHeadsetMic />} title="Talk to a technician" text="Voice, video or remote session, 8am to 10pm" price={p?.call && <>from<b>{naira(p.call)}</b></>} />
      <Route to="/c/pickup" icon={<MdLocalShipping />} title="Send it in for repair" text={p?.zones ? `We collect from ${p.zones} areas in Abuja` : "We collect it anywhere in Abuja"} price={p?.pickup && <>pickup from<b>{naira(p.pickup)}</b></>} />
      <Route to="/c/fixbot" icon={<MdSmartToy />} title="Ask FixBot" text="Likely cause and cost in minutes" price={<b>Free</b>} />
      <Route to="/learn" icon={<MdMenuBook />} title="Fix it yourself" text="Step-by-step guides and videos" price={<b>Free</b>} />
    </Screen>
  );
}
