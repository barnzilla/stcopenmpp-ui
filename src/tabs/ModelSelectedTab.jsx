// ModelSelectedTab.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Row, Col, Form, InputGroup, Table, Button, Spinner } from "react-bootstrap";

export default function ModelSelectedTab({ selectedModel, checkServer, showAlert }) {
  const [worksets, setWorksets] = useState([]);
  const [selectedWorkset, setSelectedWorkset] = useState("");
  const [tableTxt, setTableTxt] = useState([]);
  const [filter, setFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelMeta, setModelMeta] = useState(null);   // ⭐ for /api/run payload

  const headerCheckboxRef = useRef(null);

  // Build dynamic API URLs
  const API_URL_WORKSET_LIST = selectedModel?.Name
    ? `http://localhost:4040/api/model/${selectedModel.Name}/workset-list`
    : null;

  const API_URL_TABLE_LIST = selectedModel?.Name
    ? `http://localhost:4040/api/model/${selectedModel.Name}/text`
    : null;

  //
  // Unified refresh: worksets + table metadata
  //
  async function refreshAll() {
    if (!selectedModel?.Name) return;

    setLoading(true);
    setError("");

    try {
      //
      // 1️⃣ Fetch worksets (scenarios)
      //
      const wsRes = await fetch(API_URL_WORKSET_LIST);
      if (!wsRes.ok) throw new Error(`workset-list HTTP ${wsRes.status}`);
      const wsJson = await wsRes.json();

      setWorksets(wsJson);

      if (wsJson.length > 0) {
        // pick first as default scenario
        setSelectedWorkset(wsJson[0].Name);

        // ⭐ store model metadata for /api/run
        setModelMeta({
          ModelName: wsJson[0].ModelName,
          ModelDigest: wsJson[0].ModelDigest,
        });
      } else {
        setModelMeta(null);
      }

      //
      // 2️⃣ Fetch TableTxt metadata (output tables)
      //
      const txtRes = await fetch(API_URL_TABLE_LIST);
      if (!txtRes.ok) throw new Error(`text HTTP ${txtRes.status}`);
      const txtJson = await txtRes.json();

      const tables = (txtJson.TableTxt || []).map((t) => ({
        Name: t.Table?.Name || "",
        Descr: t.TableDescr || "",
      }));

      setTableTxt(tables);
      setSelectedRows([]);

      if (typeof checkServer === "function") {
        checkServer();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
      setError("Failed to refresh model metadata.");
      if (typeof showAlert === "function") {
        showAlert("Failed to refresh model data: " + err.message, "danger");
      }
    }

    setLoading(false);
  }

  //
  // Auto-refresh when a model is selected
  //
  useEffect(() => {
    if (selectedModel?.Name) {
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModel?.Name]);

  //
  // Filtered tables (search by name or description)
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
  // Row selection toggle
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
  // ⭐ Run model — POST /api/run (using ModelName & ModelDigest)
  //
  async function runModel() {
    if (!modelMeta) {
      if (typeof showAlert === "function") {
        showAlert("Model metadata not loaded. Try Refresh first.", "danger");
      }
      return;
    }

    const payload = {
      ModelName: modelMeta.ModelName,
      ModelDigest: modelMeta.ModelDigest,
      Run: {
        Name: `UI-${modelMeta.ModelName}-${new Date().toISOString()}`,
        SubCount: 1,
        SubStart: 0,
        IsHidden: false,
      },
    };

    try {
      const res = await fetch("http://localhost:4040/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      console.log("Model run started:", json);

      if (typeof checkServer === "function") {
        checkServer();
      }

      if (typeof showAlert === "function") {
        showAlert("Model run started successfully.", "success");
      }
    } catch (err) {
      console.error("Failed to run model:", err);
      if (typeof showAlert === "function") {
        showAlert("Failed to run model: " + err.message, "danger");
      }
    }
  }

  //
  // If no model selected
  //
  if (!selectedModel) {
    return <div className="text-muted">No model selected...</div>;
  }

  return (
    <div>
      {/* API ENDPOINTS + REFRESH */}
      {/* API ENDPOINTS + ACTION BUTTONS */}
      <Row className="align-items-center mb-3">

        {/* Left side: API endpoints dropdown */}
        <Col>
          <details style={{ fontSize: 12 }} className="ms-2">
            <summary style={{ cursor: "pointer" }}>API endpoints</summary>

            <div className="ms-3 mt-1">
              <div>• <a href={API_URL_WORKSET_LIST} target="_blank">{API_URL_WORKSET_LIST}</a></div>
              <div>• <a href={API_URL_TABLE_LIST} target="_blank">{API_URL_TABLE_LIST}</a></div>
            </div>
          </details>
        </Col>

        {/* Right side: Run + Refresh buttons */}
        <Col xs="auto" className="d-flex justify-content-end gap-2">
          <Button variant="primary" onClick={runModel}>
            Run model
          </Button>

          <Button variant="secondary" disabled={loading} onClick={refreshAll}>
            {loading ? <Spinner size="sm" animation="border" /> : "Refresh"}
          </Button>
        </Col>

      </Row>


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

      {/* TABLE LIST + LOADER / ERROR */}
      {loading ? (
        <div className="d-flex justify-content-center p-5">
          <Spinner animation="border" />
        </div>
      ) : error ? (
        <div className="p-4 text-danger">{error}</div>
      ) : (
        <>
          <Table bordered hover responsive striped>
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
                    className={isSelected ? "table-active" : ""}
                    style={{
                      cursor: "pointer",
                      background: isSelected
                        ? "rgba(0, 120, 215, 0.20)"
                        : undefined,
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
