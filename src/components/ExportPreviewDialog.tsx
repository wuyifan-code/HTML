import { ExportDialog } from "./ExportDialog";
import type { ExportWarning } from "../utils/exportValidation";

interface ExportPreviewDialogProps {
  html: string;
  onClose: () => void;
  onCopy: () => void;
  onDownload: () => void;
  warnings?: ExportWarning[];
}

export function ExportPreviewDialog({ html, onClose, onCopy, onDownload, warnings }: ExportPreviewDialogProps) {
  return (
    <ExportDialog
      html={html}
      onClose={onClose}
      onCopyHtml={onCopy}
      onDownloadHtml={onDownload}
      onExportPdf={() => {}}
      onExportPptx={() => {}}
      warnings={warnings}
      initialFormat="html"
    />
  );
}
