import { useState } from "react";
import { MdExpandMore, MdMail, MdPolicy, MdInfoOutline, MdLocalShipping, MdCookie, MdChatBubbleOutline } from "react-icons/md";
import { AppBar, List, ListItem, Screen, Section } from "../../ui";

// Answers describe how the app and backend actually work today.
const FAQ = [
  {
    q: "How does FixBot work?",
    a: "Tell FixBot your device and what it's doing. It checks Fixer's repair knowledge base first and, when nothing matches confidently, an AI assistant. It's free, and nothing is booked until you choose to.",
  },
  {
    q: "How do I book a technician?",
    a: "Go to Get help → Talk to a technician. Choose a voice call, video call or remote support session, pick a time between 8am and 10pm (Abuja time) and pay with Paystack. Video calls get their meeting link straight away; for voice calls the technician phones you; for remote support you get an invite by email.",
  },
  {
    q: "Can I cancel a booking?",
    a: "Yes. Open it under Activity and tap Cancel while it's still pending or confirmed. For anything about refunds, contact support with your booking reference.",
  },
  {
    q: "How does a mail-in repair work?",
    a: "Book a pickup and pay the pickup fee for your area. A rider collects the device and brings it to our Wuse workshop. After diagnosis you get a quote in the app: approve and pay (repair plus return delivery), or decline and we send it back. Nothing is repaired until you approve.",
  },
  {
    q: "Why do I need to confirm delivery?",
    a: "When your device is on its way back, tap “I've received my device” once it's in your hands. If you don't, it's confirmed automatically after the confirmation window shown on the repair.",
  },
  {
    q: "How do I pay?",
    a: "All payments go through Paystack inside the app. The amount always comes from Fixer's server, so you're charged exactly the price shown, and each payment can only be used once.",
  },
  {
    q: "I forgot my password",
    a: "Password reset isn't available in the app yet. Email support@fixerng.app from your account's email address and we'll help you back in. To change a password you know, go to Account → Change password.",
  },
];

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="li" style={{ flexDirection: "column", alignItems: "stretch", gap: 4, cursor: "pointer" }} onClick={() => setOpen(!open)}>
      <button type="button" className="row row--between link-btn" style={{ color: "inherit", textAlign: "left", width: "100%" }} aria-expanded={open}>
        <span className="t-body-lg">{q}</span>
        <MdExpandMore style={{ fontSize: 24, flex: "none", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
      </button>
      {open && <p className="muted" style={{ margin: "4px 0 6px" }}>{a}</p>}
    </div>
  );
}

export default function Help() {
  return (
    <Screen appBar={<AppBar title="Help" />}>
      <Section title="Common questions">
        <List>
          {FAQ.map((f) => (
            <Faq key={f.q} {...f} />
          ))}
        </List>
      </Section>

      <Section title="Still stuck?">
        <List>
          <ListItem icon={<MdChatBubbleOutline />} title="Send us a message" text="We reply by email" to="/help/contact" />
          <ListItem icon={<MdMail />} title="support@fixerng.app" text="Email support directly" href="mailto:support@fixerng.app" />
        </List>
      </Section>

      <Section title="About and policies">
        <List>
          <ListItem icon={<MdInfoOutline />} leadTone="muted" title="About Fixer" to="/info/about" />
          <ListItem icon={<MdLocalShipping />} leadTone="muted" title="Shipment & repair policy" to="/info/shipment" />
          <ListItem icon={<MdPolicy />} leadTone="muted" title="Privacy policy" to="/info/privacy" />
          <ListItem icon={<MdCookie />} leadTone="muted" title="Cookies policy" to="/info/cookies" />
        </List>
      </Section>
    </Screen>
  );
}
