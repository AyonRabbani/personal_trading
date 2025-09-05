import Widget from "@/components/Widget";

export default function Dashboard() {
  return (
    <main className="grid min-h-screen grid-cols-1 auto-rows-fr gap-4 p-4 md:grid-cols-3">
      <Widget defaultModule="inputs" />
      <Widget defaultModule="price" />
      <Widget defaultModule="metrics" />
      <Widget defaultModule="portfolio" className="md:col-span-3" />
      <Widget defaultModule="dividends" />
      <Widget defaultModule="tax" />
    </main>
  );
}
