import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGauge, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { Container, Tabs, Tab } from "react-bootstrap";
import ModelListTab from "./tabs/ModelListTab";
import ModelSelectedTab from "./tabs/ModelSelectedTab";

/**
 * Server health hook
 * - NO polling
 * - returns current status + a function you call when you want to re-check
 */
function useServerHealth(url) {
  const [serverOnline, setServerOnline] = useState(true);

  const checkServer = useCallback(async () => {
    try {
      const res = await fetch(url, { method: "GET", cache: "no-store" });

      if (!res.ok) {
        setServerOnline(false);
        return;
      }

      const json = await res.json();

      // Basic structure check for the disk-use endpoint
      if (json && typeof json === "object" && "IsDiskUse" in json) {
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch (err) {
      setServerOnline(false);
    }
  }, [url]);

  return { serverOnline, checkServer };
}

function getOS() {
  const ua = navigator.userAgent;

  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Mac")) return "macOS";

  return "Unknown OS";
}

export default function App() {
  const { serverOnline, checkServer } = useServerHealth(
    "http://localhost:4040/api/service/disk-use"
  );
  const osName = getOS();
  const [activeTab, setActiveTab] = useState("models");
  const [selectedModel, setSelectedModel] = useState(null);

  // Run ONE health check on initial load
  useEffect(() => {
    checkServer();
  }, [checkServer]);

  // Page title based on selection
  useEffect(() => {
    if (selectedModel?.Name) {
      document.title = `stcopenmpp » ${selectedModel.Name}`;
    } else {
      document.title = "stcopenmpp";
    }
  }, [selectedModel]);

  return (
    <Container className="p-4">
      {!serverOnline && (
        <div className="alert alert-danger mt-4 mb-5" role="alert">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="me-2"
          />
          The OpenM++ web service is not running.
        </div>
      )}

      <h3 className="mt-3 mb-5">
        <FontAwesomeIcon
          icon={faGauge}
          style={{ marginRight: 8, color: "#000" }}
        />
        <span className="fw-light">stc</span>
        <span className="fw-bold">openmpp</span>
        <sub className="fw-light fs-6">{osName}</sub>
      </h3>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
        <Tab eventKey="models" title="Model list">
          <ModelListTab
            setActiveTab={setActiveTab}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            checkServer={checkServer}  // ✅ Model list refresh can ping server
          />
        </Tab>

        <Tab
          eventKey="details"
          title={selectedModel ? `Model: ${selectedModel.Name}` : "Model"}
        >
          <ModelSelectedTab 
            selectedModel={selectedModel}
            checkServer={checkServer}    // ✅ Details tab refresh can ping server too
          />
        </Tab>
      </Tabs>
    </Container>
  );
}
