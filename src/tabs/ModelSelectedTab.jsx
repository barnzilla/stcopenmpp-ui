// ModelSelectedTab.jsx
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Row,
  Col,
  Form,
  InputGroup,
  Table,
  Button,
  Spinner,
} from "react-bootstrap";

export default function ModelSelectedTab({ selectedModel, checkServer }) {
  const [worksets, setWorksets] = useState([]);
  const [selectedWorkset, setSelectedWorkset] = useState("");
  const [tableTxt, setTableTxt] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headerCheckboxRef = useRef(null);

  //
  // Build dynamic API URLs
  //
  const API_URL_WORKSET_LIST = selectedModel?.Name
    ? `http://localhost:4040/api/model/${selectedModel.Name}/workset-list`
    : null;

  const API_URL_TABLE_LIST = selectedModel?.Name
    ? `http://localhost:4040/api/model/${selectedModel.Name}/text`
    : null;

  //
  // Unified fetch function for Refresh button
  //
  const refreshAll = useCallback(async () => {
    if (!selectedModel?.Name) return;

    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Fetch worksets (scenarios)
      if (!API_URL_WORKSET_LIST) throw new Error("Workset URL is missing");
      const wsRes = await fetch(API_URL_WORKSET_LIST);

      if (!wsRes.ok) {
        throw new Error(`Failed to load scenarios (${wsRes.status})`);
      }

      const wsJson = await wsRes.json();
      setWorksets(wsJson);
      if (wsJson.length > 0) {
        setSelectedWorkset(wsJson[0].Name);
      } else {
        setSelectedWorkset("");
      }

      // 2️⃣ Fetch TableTxt metadata
      if (!API_URL_TABLE_LIST) throw new Error("Table metadata URL is missing");
      const txtRes = await fetch(API_URL_TABLE_LIST);

      if (!txtRes.ok) {
        throw new Error(`Failed to load output tables (${txtRes.status})`);
      }

      const txtJson = await txtRes.json();

      const tables = (txtJson.TableTxt || []).map((t) => ({
        Name: t.Table?.Name || "",
        Descr: t.TableDescr || "",
      }));

      setTableTxt(tables);
      setSelectedRows([]);
    } catch (err) {
      console.error("Refresh failed:", err);
      setError(err.message || "Failed to load model details.");
      setTableTxt([]);
      setWorksets([]);
      setSelectedWorkset("");
      setSelectedRows([]);
    } finally {
      setLoading(false);
      // Re-check server health after we hit the endpoints
      if (typeof checkServer === "function") {
        checkServer();
      }
    }
  }, [selectedModel, API_URL_WORKSET_LIST, API_URL_TABLE_LIST, checkServer]);

  //
  // Auto-fetch when a model is selected
  //
  useEffect(() => {
    if (selectedModel?.Name) {
      refreshAll();
    }
  }, [selectedModel, refreshAll]);

  //
  // Filter tables
  //
  const filteredTables = useMemo(() => {
    if (!filter.trim()) return tableTxt;
    const q = filter.toLowerCase();
    return tableTxt.filter(
      (t) =>
        t.Name.toLowerCase().includes(q) ||
        t.Descr.toLowerCase().includes(q)
    );
  }, [tableTxt, filter]);

  //
  // Toggle a row
  //
  const toggleRow = (name) => {
    setSelectedRows((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : [...prev, name]
    );
  };

  //
  // Update header checkbox indeterminate state
  //
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        selectedRows.length > 0 &&
        selectedRows.length < filteredTables.length;
    }
  }, [selectedRows, filteredTables]);

  //
  // If no model selected
  //
  if (!selectedModel)
    return <div className="text-muted">No model selected...</div>;

  return (
    <div>
      {/* API Endpoint + Refresh Row */}
      <Row className="align-items-center mb-3">
        <Col>
          <details style={{ fontSize: 12 }} className="ms-2">
            <summary style={{ cursor: "pointer" }}>API endpoints</summary>

            <div className="ms-3 mt-1">
              {API_URL_WORKSET_LIST && (
                <div>
                  •{" "}
                  <a href={API_URL_WORKSET_LIST} target="_blank" rel="noreferrer">
                    {API_URL_WORKSET_LIST}
                  </a>
                </div>
              )}
              {API_URL_TABLE_LIST && (
                <div>
                  •{" "}
                  <a href={API_URL_TABLE_LIST} target="_blank" rel="noreferrer">
                    {API_URL_TABLE_LIST}
                  </a>
                </div>
              )}
            </div>
          </details>
        </Col>

        <Col xs="auto">
          <Button
            variant="secondary"
            disabled={loading}
            onClick={refreshAll}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* LOADING / ERROR / CONTENT */}
      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <div className="p-4 text-danger">{error}</div>
      ) : (
        <>
          {/* TOP CONTROLS */}
          <Row className="mb-4">
            <Col md={6}>
              <label className="fw-bold">Select scenario</label>
              <Form.Select
                value={selectedWorkset}
                onChange={(e) => setSelectedWorkset(e.target.value)}
              >
                {worksets.map((ws) => (
                  <option key={ws.Name} value={ws.Name}>
                    {ws.Name}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col md={6}>
              <label className="fw-bold">Select output table(s)</label>
              <InputGroup>
                <Form.Control
                  placeholder="Search by name or description..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          {/* TABLE LIST */}
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th style={{ width: "60px" }} className="text-center">
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={
                      filteredTables.length > 0 &&
                      selectedRows.length === filteredTables.length
                    }
                    onChange={() => {
                      if (selectedRows.length !== filteredTables.length) {
                        setSelectedRows(filteredTables.map((t) => t.Name));
                      } else {
                        setSelectedRows([]);
                      }
                    }}
                  />
                </th>
                <th>Name</th>
                <th>Description</th>
              </tr>
            </thead>

            <tbody>
              {filteredTables.map((t) => {
                const isSelected = selectedRows.includes(t.Name);

                return (
                  <tr
                    key={t.Name}
                    onClick={(e) => {
                      if (e.target.type === "checkbox") return;
                      toggleRow(t.Name);
                    }}
                    className={isSelected ? "table-row-selected" : ""}
                    style={{
                      cursor: "pointer",
                      fontWeight: isSelected ? 700 : 400,
                    }}
                  >
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(t.Name)}
                      />
                    </td>

                    <td>{t.Name}</td>
                    <td>{t.Descr}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <div className="text-muted">
            {selectedRows.length} output table(s) selected
          </div>
        </>
      )}
    </div>
  );
}
