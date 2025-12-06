import "./App.css";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGauge } from "@fortawesome/free-solid-svg-icons";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { Container, Tabs, Tab } from "react-bootstrap";
import ModelListTab from "./tabs/ModelListTab";
import ModelSelectedTab from "./tabs/ModelSelectedTab";

function useServerHealth(url, intervalMs = 1000) {
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    let timer = setInterval(async () => {
      try {
        const res = await fetch(url, { method: "GET", cache: "no-store" });

        // Must be valid JSON and contain expected fields
        if (!res.ok) {
          setServerOnline(false);
          return;
        }

        const json = await res.json();

        // Basic structure check
        if (json && typeof json === "object" && "IsDiskUse" in json) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch (err) {
        setServerOnline(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [url, intervalMs]);

  return serverOnline;
}

function getOS() {
  const ua = navigator.userAgent;

  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Mac")) return "macOS";

  return "Unknown OS";
}

export default function App() {
  const serverOnline = useServerHealth("http://localhost:4040/api/service/disk-use");
  const osName = getOS();
  const [activeTab, setActiveTab] = useState("models");
  const [selectedModel, setSelectedModel] = useState(null);

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
          style={{ }}
          className="me-2"
        /> The OpenM++ web service is down.
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
          />
        </Tab>

        <Tab
          eventKey="details"
          title={
            selectedModel
              ? `Model: ${selectedModel.Name}`
              : "Model"
          }
        >
          <ModelSelectedTab selectedModel={selectedModel} />
        </Tab>
      </Tabs>
    </Container>
  );
}
