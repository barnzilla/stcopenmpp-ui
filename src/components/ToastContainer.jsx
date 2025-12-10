// ToastContainer.jsx
import React, { useEffect } from "react";
import "./toast.css";

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-wrapper">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-item toast-${t.type}`}
          style={{ opacity: t.closing ? 0 : 1 }}
          onClick={() => removeToast(t.id)}
        >
          <span className="toast-icon">
            {t.type === "success" && "✔"}
            {t.type === "error" && "⚠"}
            {t.type === "warning" && "!"}
            {t.type === "info" && "ℹ"}
          </span>

          <span>{t.message}</span>

          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(t.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
