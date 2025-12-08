// DataTable.jsx
import React from "react";
import { Table } from "react-bootstrap";

export default function DataTable({
  rows,
  columns,
  sortBy,
  setSortBy,
  onRowClick,
  selectedModel,
}) {
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              style={{ cursor: "pointer" }}
              onClick={() => setSortBy(c.key)}
            >
              {c.label}
              {sortBy?.key === c.key
                ? sortBy.direction === "asc"
                  ? " ▲"
                  : " ▼"
                : ""}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, i) => {
          const isSelected = row === selectedModel;

          return (
            <tr
              key={i}
              onClick={() => onRowClick(row)}
              style={{ cursor: "pointer" }}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={isSelected ? "table-cell-selected" : ""}
                  style={{ verticalAlign: "middle" }}
                >
                  {c.key === "Name" ? (
                    <div style={{ lineHeight: 1.2 }}>
                      {row.Name}
                      {row.Version && (
                        <sub style={{ marginLeft: 4, opacity: 0.8 }}>
                          v{row.Version}
                        </sub>
                      )}
                    </div>
                  ) : (
                    String(row[c.key] ?? "")
                  )}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
