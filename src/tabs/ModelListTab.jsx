import React, { useMemo, useState, useEffect } from "react";
import { Row, Col, InputGroup, Form, Button, Spinner } from "react-bootstrap";

import DataTable from "../components/DataTable";
import PaginationComponent from "../components/PaginationComponent";
import { useFetchData } from "../hooks/useFetchData";
import { buildColumns } from "../utils/columnBuilder";

const API_URL = "http://localhost:4040/api/model-list/text";
const DEFAULT_PAGE_SIZE = 10;

export default function ModelListTab({
  setActiveTab,
  selectedModel,
  setSelectedModel,
  checkServer
}) {
  const { data: rawData, loading, error, refetch } = useFetchData(API_URL);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState({ key: "Name", direction: "asc" });

  const data = useMemo(() => {
    if (!Array.isArray(rawData)) return [];

    return rawData.map((r) => ({
      ...r.Model,
      DescrNote: r.DescrNote   // 👈 KEEP note + description
    }));
  }, [rawData]);


  const columns = useMemo(() => buildColumns(data), [data]);

  const processedRows = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let rows = data;

    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (sortBy.key) {
      const dir = sortBy.direction === "desc" ? -1 : 1;
      rows = [...rows].sort((a, b) => {
        const sa = String(a?.[sortBy.key] ?? "").toLowerCase();
        const sb = String(b?.[sortBy.key] ?? "").toLowerCase();
        return sa < sb ? -1 * dir : sa > sb ? 1 * dir : 0;
      });
    }

    return rows;
  }, [data, query, sortBy]);

  const totalCount = processedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  const handleRowClick = (row) => {
    setSelectedModel(row);
    setActiveTab("details");
  };

  const handleSort = (key) => {
    setSortBy((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <details style={{ fontSize: 12 }} className="ms-2">
            <summary style={{ cursor: "pointer" }}>API endpoints</summary>

            <div className="ms-3 mt-1">
              {API_URL && (
                <div>
                  •{" "}
                  <a href={API_URL} target="_blank" rel="noreferrer">
                    {API_URL}
                  </a>
                </div>
              )}
            </div>
          </details>
        </Col>
        <Col xs="auto">
          <Button
            onClick={() => {
              refetch();
              if (checkServer) checkServer();  // 👈 trigger health check ON DEMAND
              setSelectedModel(null);
            }}
            disabled={loading}
            variant="secondary"
          >
            Refresh
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <InputGroup>
            <Form.Control
              placeholder="Filter..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Button variant="outline-secondary" onClick={() => setQuery("")}>
              Clear
            </Button>
          </InputGroup>
        </Col>

        <Col md={4}>
          <Form.Select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} models per page
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col
          md={4}
          className="text-md-end d-flex align-items-center justify-content-md-end"
        >
          <div style={{ fontSize: 14 }}>
            {totalCount} models • Page {page} of {totalPages}
          </div>
        </Col>

      </Row>

      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <div className="p-4 text-danger">{error}</div>
      ) : (
        <>
          <DataTable
            rows={pageRows}
            columns={columns}
            sortBy={sortBy}
            setSortBy={handleSort}
            onRowClick={handleRowClick}
            selectedModel={selectedModel}
          />

          <PaginationComponent
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        </>
      )}
    </>
  );
}
