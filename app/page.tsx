import Section from "@/components/Section";

export default function ResearchPage() {
  return (
    <main className="max-w-4xl mx-auto p-4">
      <Section title="Introduction">
        <p>
          This website presents a research-oriented analysis of personal
          trading strategies. It consolidates observations and simplifies
          data into accessible narratives.
        </p>
      </Section>

      <Section title="Methodology">
        <p>
          Data is gathered from publicly available market information and
          processed with lightweight scripts. Complex visualizations have
          been removed in favor of direct explanations.
        </p>
      </Section>

      <Section title="Findings">
        <p>
          Preliminary results indicate trends worth further investigation.
          Future iterations may expand upon these insights with deeper
          statistical reviews.
        </p>
      </Section>

      <Section title="Conclusion">
        <p>
          This simplified presentation focuses on clarity over
          interactivity, enabling a concise overview suitable for
          investigative review.
        </p>
      </Section>
    </main>
  );
}
