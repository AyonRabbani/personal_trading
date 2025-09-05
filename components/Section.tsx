import type { ReactNode } from "react";

interface SectionProps {
  title: string;
  children: ReactNode;
}

export default function Section({ title, children }: SectionProps) {
  return (
    <section className="prose mx-auto my-8">
      <h2>{title}</h2>
      <div>{children}</div>
    </section>
  );
}
