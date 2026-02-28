"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Inbox } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any> = Record<string, any>>({
  columns,
  data,
  onRowClick,
  searchable = false,
  searchPlaceholder = "Rechercher...",
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Filter data by search term across all string values
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (val) =>
          typeof val === "string" && val.toLowerCase().includes(term)
      )
    );
  }, [data, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedData = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Reset page on search change
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const startItem = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl overflow-hidden">
      {/* Search bar */}
      {searchable && (
        <div className="px-4 py-3 border-b border-[#3A3530]">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6050] pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#3A3530]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-[#A89888] uppercase tracking-wider whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3530]/50">
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`
                  transition-colors
                  ${onRowClick ? "cursor-pointer hover:bg-[#E08840]/5" : ""}
                  ${idx % 2 === 1 ? "bg-[#141210]/30" : ""}
                `}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-[#F5E6D3] whitespace-nowrap"
                  >
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as React.ReactNode) ?? "\u2014"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-[#6B6050]">
          <Inbox size={40} strokeWidth={1.2} className="mb-3 text-[#3A3530]" />
          <p className="text-sm font-medium">Aucun r&eacute;sultat trouv&eacute;</p>
          {search.trim() && (
            <p className="mt-1 text-xs text-[#6B6050]">
              Essayez de modifier votre recherche
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#3A3530]">
          <p className="text-xs text-[#6B6050]">
            {startItem}&ndash;{endItem} sur {filtered.length}
          </p>

          <div className="flex items-center gap-1">
            {/* First page */}
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Premi\u00e8re page"
            >
              <ChevronsLeft size={16} />
            </button>

            {/* Previous page */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Page pr\u00e9c\u00e9dente"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {generatePageNumbers(safePage, totalPages).map((p, i) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-xs text-[#6B6050]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`
                    flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-colors
                    ${
                      p === safePage
                        ? "bg-[#E08840] text-[#141210]"
                        : "text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530]"
                    }
                  `}
                >
                  {p}
                </button>
              )
            )}

            {/* Next page */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Page suivante"
            >
              <ChevronRight size={16} />
            </button>

            {/* Last page */}
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-[#A89888] hover:text-[#F5E6D3] hover:bg-[#3A3530] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Derni\u00e8re page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a compact array of page numbers with ellipses */
function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];

  // Always show first page
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  // Pages around current
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  // Always show last page
  pages.push(total);

  return pages;
}
