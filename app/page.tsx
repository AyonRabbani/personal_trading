'use client';
import { useState } from 'react';
import ScreenerTable from '../components/ScreenerTable';
import OptionsViewer from '../components/OptionsViewer';

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <ScreenerTable onSelect={(t) => setSelected(t)} />
      </div>
      <div>
        <OptionsViewer ticker={selected} />
      </div>
    </div>
  );
}
