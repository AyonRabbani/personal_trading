import React, { useState } from 'react';
import { mutate } from 'swr';

export default function PortfolioForm() {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        quantity: parseFloat(quantity),
        costBasis: parseFloat(cost),
        purchaseDate: date,
      }),
    });
    setSymbol('');
    setQuantity('');
    setCost('');
    setDate('');
    mutate('/api/portfolio');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 text-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input
          required
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="p-1 bg-gray-100 rounded-md"
        />
        <input
          required
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="p-1 bg-gray-100 rounded-md"
        />
        <input
          required
          type="number"
          placeholder="Cost Basis"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="p-1 bg-gray-100 rounded-md"
        />
        <input
          required
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-1 bg-gray-100 rounded-md"
        />
      </div>
      <button
        type="submit"
        className="px-2 py-1 bg-blue-600 text-white rounded-md"
      >
        Add Holding
      </button>
    </form>
  );
}
