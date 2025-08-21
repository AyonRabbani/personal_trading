'use client';

interface Props {
  labels: string[];
  matrix: number[][]; // matrix[i][j]
}

export default function CorrelationTable({ labels, matrix }: Props) {
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
          <th style={{ border: '1px solid var(--primary)', padding: '4px' }}></th>
          {labels.map((l) => (
            <th
              key={l}
              style={{
                border: '1px solid var(--primary)',
                padding: '4px',
                backgroundColor: 'var(--secondary)',
                color: 'var(--foreground)',
              }}
            >
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.map((row, i) => (
          <tr key={labels[i]}>
            <th
              style={{
                border: '1px solid var(--primary)',
                padding: '4px',
                backgroundColor: 'var(--secondary)',
                color: 'var(--foreground)',
              }}
            >
              {labels[i]}
            </th>
            {row.map((v, j) => (
              <td
                key={j}
                style={{
                  border: '1px solid var(--primary)',
                  padding: '4px',
                  textAlign: 'right',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              >
                {v.toFixed(2)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
