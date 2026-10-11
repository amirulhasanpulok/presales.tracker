import React from "react";
import { Search, Bell, RefreshCw, Menu } from "lucide-react";
import { Opportunity, ActiveTab } from "../../types";
interface Props {
  opportunities: Opportunity[];
  onOpenNewOpportunity?: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onRefreshData?: () => void;
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
}
export function Header({
  onNavigateTab,
  onRefreshData,
  onToggleSidebar,
  onOpenCommandPalette,
}: Props) {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex justify-between items-center gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Open navigation"
          className="md:hidden text-slate-500"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigateTab("dashboard")}
          className="font-semibold text-slate-900 text-sm"
        >
          Presales Tracker
        </button>
        <span className="hidden sm:block text-xs text-slate-400">
          Sales · Presales · SCM · Postsales
        </span>
      </div>
      <div className="flex gap-3 items-center text-slate-500">
        <button
          title="Search"
          aria-label="Search"
          onClick={onOpenCommandPalette}
        >
          <Search className="w-4 h-4" />
        </button>
        {onRefreshData && (
          <button
            title="Refresh latest team updates"
            aria-label="Refresh latest team updates"
            onClick={onRefreshData}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
        <button
          title="Notifications"
          aria-label="Notifications"
          onClick={() => onNavigateTab("notifications")}
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
