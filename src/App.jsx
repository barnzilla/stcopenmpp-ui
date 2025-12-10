import "./App.css";
import React, { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGauge, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { Container, Tabs, Tab } from "react-bootstrap";
import ModelListTab from "./tabs/ModelListTab";
import ModelSelectedTab from "./tabs/ModelSelectedTab";

// 🔔 toast notifications
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
        return false;
      }

      const json = await res.json();

      // Basic structure check for the disk-use endpoint
      const ok = !!(json && typeof json === "object" && "IsDiskUse" in json);
      setServerOnline(ok);
      return ok;
    } catch (err) {
      setServerOnline(false);
      return false;
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

  // 🔔 helper to show alerts from children
  const showAlert = (message, variant = "info") => {
    const options = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (variant) {
      case "success":
        toast.success(message, options);
        break;
      case "danger":
      case "error":
        toast.error(message, options);
        break;
      case "warning":
        toast.warn(message, options);
        break;
      default:
        toast.info(message, options);
    }
  };

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
    <>
      {/* Toasts visible for all tabs */}
      <ToastContainer />

      <Container className="p-4">

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
              checkServer={checkServer}   // list refresh can ping server
              showAlert={showAlert}       // (optional) if you want alerts there later
            />
          </Tab>

          <Tab
            eventKey="details"
            title={selectedModel ? `Model: ${selectedModel.Name}` : "Model"}
          >
            <ModelSelectedTab
              selectedModel={selectedModel}
              checkServer={checkServer}   // model run can also ping server
              showAlert={showAlert}       // 🔔 used for run + refresh alerts
            />
          </Tab>
        </Tabs>
      </Container>
    </>
  );
}
