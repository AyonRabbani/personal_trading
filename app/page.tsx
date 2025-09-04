import Widget from "@/components/Widget";

export default function Dashboard() {
  return (
    <main className="p-4 grid grid-cols-3 grid-rows-3 gap-4 h-screen bg-black text-green-400 font-mono">
      <Widget defaultModule="inputs" />
      <Widget defaultModule="price" />
      <Widget defaultModule="metrics" />
      <Widget defaultModule="portfolio" className="col-span-3" />
      <Widget defaultModule="dividends" />
      <Widget defaultModule="tax" />
    </main>
  );
}
