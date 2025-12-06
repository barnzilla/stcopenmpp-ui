import React from "react";
import { Pagination } from "react-bootstrap";

export default function PaginationComponent({ page, setPage, totalPages }) {
  return (
    <Pagination>
      <Pagination.Prev disabled={page === 1} onClick={() => setPage(page - 1)} />

      {[...Array(totalPages)].map((_, i) => {
        const p = i + 1;
        return (
          <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
            {p}
          </Pagination.Item>
        );
      })}

      <Pagination.Next
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
      />
    </Pagination>
  );
}
