import { Navigate, useParams } from "react-router-dom";
import { AppBar, Card, Screen } from "../../ui";
import { PAGES } from "../../content/pages";

export default function InfoPage() {
  const { page } = useParams();
  const content = PAGES[page];
  if (!content) return <Navigate to="/help" replace />;

  return (
    <Screen appBar={<AppBar title={content.title} subtitle={content.updated ? `Last updated ${content.updated}` : undefined} back />}>
      {content.intro && <p className="t-body-lg" style={{ margin: 0 }}>{content.intro}</p>}
      {content.sections.map((s) => (
        <Card key={s.title} variant="tonal">
          <p className="card__title">{s.title.replace(/^\d+\.\s*/, "")}</p>
          {String(s.body)
            .split("\n\n")
            .map((para, i) => (
              <p key={i} className="card__text" style={{ whiteSpace: "pre-line", marginTop: i ? 10 : 0 }}>
                {para}
              </p>
            ))}
        </Card>
      ))}
    </Screen>
  );
}
