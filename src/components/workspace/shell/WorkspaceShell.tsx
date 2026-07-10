import { type ReactNode } from "react";
import { TooltipProvider } from "../../Tooltip";

export interface WorkspaceShellProps {
  children: ReactNode;
}

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
