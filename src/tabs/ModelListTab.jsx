import React, { useMemo, useState, useEffect } from "react";
import { Row, Col, InputGroup, Form, Button, Spinner } from "react-bootstrap";

import DataTable from "../components/DataTable";
import PaginationComponent from "../components/PaginationComponent";
import ModelDetailPanel from "../components/ModelDetailPanel";
import { useFetchData } from "../hooks/useFetchData";
import { buildColumns } from "../utils/columnBuilder";

const API_URL = "http://localhost:4040/api/model-list";
const DEFAULT_PAGE_SIZE = 10;

export default function ModelListTab({
  selectedModel,
  setSelectedModel,
  setActiveTab,
}) {
  const { data: rawData, loading, error, refetch } = useFetchData(API_URL);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortBy, setSortBy] = useState({ key: "Name", direction: "asc" });

  // Extract model data
  const data = useMemo(
    () => (Array.isArray(rawData) ? rawData.map((r) => r.Model) : []),
    [rawData]
  );

  const columns = useMemo(() => buildColumns(data), [data]);

  // Filtering + sorting
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

  // Pagination
  const totalCount = processedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  // Row click → just update detail panel (no tab change)
  const handleRowClick = (row) => {
    setSelectedModel(row);
  };

  const handleSort = (key) => {
    setSortBy((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  };

  return (
    <>
      {/* API endpoint + Refresh row */}
      <Row className="align-items-center mb-3">
        <Col>
          <div style={{ fontSize: 12, color: "#666" }} className="ps-1">
            API endpoint:{" "}
            <a href={API_URL} target="_blank" rel="noreferrer">
              {API_URL}
            </a>
          </div>
        </Col>
        <Col xs="auto">
          <Button
            onClick={() => {
              refetch();
              setSelectedModel(null); // reset panel
            }}
            disabled={loading}
            variant="secondary"
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* FILTER + PAGE SIZE + COUNT */}
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
                {n} rows per page
              </option>
            ))}
          </Form.Select>
        </Col>

        <Col md={4} className="text-md-end d-flex justify-content-end align-items-center">
          <div style={{ fontSize: 14 }}>
            {totalCount} rows • Page {page} of {totalPages}
          </div>
        </Col>
      </Row>

      {/* MAIN SPLIT PANE */}
      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <div className="p-4 text-danger">{error}</div>
      ) : (
        <Row>
          {/* LEFT — MODEL LIST */}
          <Col md={5} className="border-end pe-0">
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
          </Col>

          {/* RIGHT — DETAILS */}
          <Col md={7} className="ps-4">
            <ModelDetailPanel model={selectedModel} />
          </Col>
        </Row>
      )}
    </>
  );
}
