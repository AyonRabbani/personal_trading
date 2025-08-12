import React from 'react';
import { Result } from './ResultsTable';

interface PositionDrawerProps {
  position?: Result | null;
  onClose?: () => void;
}

export default function PositionDrawer({ position, onClose }: PositionDrawerProps) {
  if (!position) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex justify-end" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-md h-full p-4 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="mb-4" onClick={onClose}>
          Close
        </button>
        <h2 className="text-xl mb-2">{position.strategy}</h2>
        <p>Expiry: {position.expiry}</p>
        <p>Strikes: {position.strikes}</p>
        <p>Credit: {position.credit.toFixed(2)}</p>
        <p>Max Loss: {position.maxLoss.toFixed(2)}</p>
        <p>ROR: {(position.ror * 100).toFixed(1)}%</p>
        <p>Annualized: {(position.annualized * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}
