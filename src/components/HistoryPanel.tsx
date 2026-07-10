import type { HistoryDisplayItem } from "../utils/historySummary";
import { HistoryDrawer } from "./HistoryDrawer";

interface HistoryPanelProps {
  items: HistoryDisplayItem[];
  onJumpTo: (index: number) => void;
  onClose: () => void;
  onClearAll: () => void;
}

export function HistoryPanel(props: HistoryPanelProps) {
  return <HistoryDrawer {...props} />;
}
