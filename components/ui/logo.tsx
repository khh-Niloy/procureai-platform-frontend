import { Package } from "lucide-react";
import { cn } from "cn";

export function Logo({
  className,
  light = false,
  collapsed = false,
}: {
  className?: string;
  light?: boolean;
  collapsed?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-xl shadow-sm",
          light ? "bg-white/20 text-white" : "bg-[#168778] text-white",
          "h-9 w-9"
        )}
      >
        <Package className="h-5 w-5" />
      </div>
      {!collapsed && (
        <span
          className={cn(
            "text-[17px] font-bold tracking-tight",
            light ? "text-white" : "text-slate-900"
          )}
        >
          Procure<span className={light ? "text-[#8ee1d3]" : "text-[#168778]"}>AI</span>
        </span>
      )}
    </div>
  );
}
