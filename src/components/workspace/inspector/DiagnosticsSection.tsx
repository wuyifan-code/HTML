import { InspectorDiagnostics } from "../../InspectorDiagnostics";
import type { SelectedSnapshot } from "../../../types/editor";

export interface Annotation {
  field: string;
  suggestion: string;
  severity: "info" | "warning" | "error";
}

interface DiagnosticsSectionProps {
  selected: SelectedSnapshot | null;
  annotations: Annotation[];
  onLocateIssue: (field: string) => void;
}

export function DiagnosticsSection({ selected, annotations, onLocateIssue }: DiagnosticsSectionProps) {
  return (
    <div className="inspector-diagnostics-section">
      {annotations.length > 0 && (
        <div className="diagnostic-annotations">
          {annotations.map((annotation, index) => {
            const severityClass = `diagnostic-annotation diagnostic-annotation--${annotation.severity}`;
            return (
              <button
                key={`${annotation.field}-${index}`}
                className={severityClass}
                type="button"
                onClick={() => onLocateIssue(annotation.field)}
              >
                <span className="diagnostic-annotation__field">{annotation.field}</span>
                <span className="diagnostic-annotation__suggestion">{annotation.suggestion}</span>
              </button>
            );
          })}
        </div>
      )}
      <InspectorDiagnostics selected={selected} />
    </div>
  );
}
