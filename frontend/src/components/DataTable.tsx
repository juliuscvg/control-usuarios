import { ReactNode } from "react";

type Column<T> = {
  header: string;
  accessor: (row: T) => ReactNode;
  width?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
};

const DataTable = <T,>({ columns, rows, emptyLabel }: DataTableProps<T>) => {
  return (
    <div className="table">
      <div className="table__row table__row--head">
        {columns.map((column) => (
          <div key={column.header} style={{ width: column.width }}>
            {column.header}
          </div>
        ))}
      </div>
      {rows.length === 0 && (
        <div className="table__empty">{emptyLabel ?? "Sin datos"}</div>
      )}
      {rows.map((row, idx) => (
        <div key={idx} className="table__row">
          {columns.map((column) => (
            <div key={column.header} style={{ width: column.width }}>
              {column.accessor(row)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default DataTable;

