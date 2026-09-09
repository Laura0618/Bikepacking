interface ChartDataTableProps {
  caption: string;
  columns: string[];
  rows: (string | number)[][];
}

/** Alternativa textual accesible para cada grafica. */
export function ChartDataTable({ caption, columns, rows }: ChartDataTableProps): JSX.Element {
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-xs font-semibold text-bosque">
        Ver datos en tabla
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-bosque-suave text-texto-suave">
              {columns.map((c) => (
                <th key={c} scope="col" className="py-1 pr-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-bosque-suave/50">
                {row.map((cell, j) => (
                  <td key={j} className="py-1 pr-3">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
