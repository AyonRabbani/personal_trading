'use client';

interface PairRank {
  pair: string;
  corr30: number;
  corr5: number;
  change: number;
}

interface Props {
  pairs: PairRank[];
}

export default function RisingCorrelationTable({ pairs }: Props) {
  return (
    <table
      style={{
        borderCollapse: 'collapse',
        width: '100%',
        fontFamily: 'Helvetica',
      }}
    >
      <thead>
        <tr>
          <th style={thStyle}>Pair</th>
          <th style={thStyle}>30d Corr</th>
          <th style={thStyle}>5d Corr</th>
          <th style={thStyle}>Change</th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((p) => (
          <tr key={p.pair}>
            <td style={tdStyle}>{p.pair}</td>
            <td style={tdStyle}>{p.corr30.toFixed(2)}</td>
            <td style={tdStyle}>{p.corr5.toFixed(2)}</td>
            <td style={tdStyle}>{p.change.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle = {
  border: '1px solid var(--primary)',
  padding: '4px',
  backgroundColor: 'var(--secondary)',
  color: 'var(--foreground)',
};

const tdStyle = {
  border: '1px solid var(--primary)',
  padding: '4px',
  textAlign: 'right' as const,
  backgroundColor: 'var(--background)',
  color: 'var(--foreground)',
};

