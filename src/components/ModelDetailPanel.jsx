import React from "react";
import { Card, Button } from "react-bootstrap";

export default function ModelDetailPanel({ model }) {
  if (!model)
    return (
      <div className="text-muted" style={{ paddingTop: "40px" }}>
        Select a model to view details.
      </div>
    );

  const {
    Name,
    Version,
    Digest,
    CreateDateTime,
    DescrNote,
    ModelId,
    Extra,
  } = model;

  const description =
    DescrNote?.Descr || "No model description available";

  const note = DescrNote?.Note || "";
  const docs = Extra?.ModelDoc || [];

  return (
    <Card>
      <Card.Body>
        <Card.Title className="mb-1">
          <strong>{Name}</strong>{" "}
          <sub style={{ fontSize: "0.8em" }}>v{Version}</sub>
        </Card.Title>

        <div className="text-muted mb-3" style={{ fontSize: "0.9em" }}>
          {description}
        </div>

        {note && (
          <div className="mb-3" style={{ whiteSpace: "pre-wrap" }}>
            {note}
          </div>
        )}

        <div className="mb-3">
          <strong>Build date:</strong> {CreateDateTime}
          <br />
          <strong>Hash:</strong> {Digest}
          <br />
          <strong>Model ID:</strong> {ModelId}
        </div>

        {docs.length > 0 && (
          <div className="d-flex gap-2 mt-3">
            {docs.map((d, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline-primary"
                href={d.Link}
                target="_blank"
              >
                📄 Docs ({d.LangCode})
              </Button>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
