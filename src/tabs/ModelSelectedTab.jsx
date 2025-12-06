import React from "react";

export default function OtherTab({ selectedModel }) {
  return (
    <div className="p-3">
      {selectedModel ? (
        <>
          <h4>Selected Model</h4>
          <pre>{JSON.stringify(selectedModel, null, 2)}</pre>
        </>
      ) : (
        <div>No model selected</div>
      )}
    </div>
  );
}
