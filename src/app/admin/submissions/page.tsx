"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useAdmin, type AdminSubmission } from "@/lib/hooks/useAdmin";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Beer,
  MapPin,
  Loader2,
  AlertTriangle,
  Pencil,
  Save,
  X,
} from "lucide-react";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

type StatusFilter = "all" | "pending" | "approved" | "rejected";

interface FilterTab {
  key: StatusFilter;
  label: string;
}

const TABS: FilterTab[] = [
  { key: "all", label: "Toutes" },
  { key: "pending", label: "En attente" },
  { key: "approved", label: "Approuvees" },
  { key: "rejected", label: "Rejetees" },
];

// ═══════════════════════════════════════════
// Editable field definitions per submission type
// ═══════════════════════════════════════════

interface EditableFieldDef {
  key: string;
  label: string;
  type?: "text" | "number";
}

const BEER_EDITABLE_FIELDS: EditableFieldDef[] = [
  { key: "name", label: "Nom" },
  { key: "brewery", label: "Brasserie" },
  { key: "style", label: "Style" },
  { key: "abv", label: "ABV", type: "number" },
  { key: "country", label: "Pays" },
];

const BAR_EDITABLE_FIELDS: EditableFieldDef[] = [
  { key: "name", label: "Nom" },
  { key: "address", label: "Adresse" },
  { key: "city", label: "Ville" },
];

// ═══════════════════════════════════════════
// Page
// ═══════════════════════════════════════════

export default function SubmissionsPage() {
  const admin = useAdmin();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  // ─── Edit state ─────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, unknown>>({});

  const {
    data: submissions = [],
    isLoading,
    isError,
    error,
  } = admin.useAdminSubmissions(
    statusFilter === "all" ? undefined : statusFilter
  );

  // ─── Handlers ────────────────────────────

  async function handleApprove(id: string) {
    setActionError(null);
    try {
      await admin.approveSubmission(id);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erreur lors de l'approbation"
      );
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setActionError(null);
    try {
      await admin.rejectSubmission(id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erreur lors du rejet"
      );
    }
  }

  function handleStartEdit(submission: AdminSubmission) {
    setEditingId(submission.id);
    setEditData({ ...(submission.data as Record<string, unknown>) });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditData({});
  }

  async function handleSaveEdit(id: string) {
    setActionError(null);
    try {
      await admin.updateSubmissionData(id, editData);
      setEditingId(null);
      setEditData({});
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde"
      );
    }
  }

  function handleEditFieldChange(key: string, value: unknown) {
    setEditData((prev) => ({ ...prev, [key]: value }));
  }

  // ─── Render ──────────────────────────────

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Soumissions"
        subtitle={`${submissions.length} soumission${submissions.length !== 1 ? "s" : ""}`}
      />

      <div className="px-4 py-6 lg:px-8 space-y-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${
                  statusFilter === tab.key
                    ? "bg-[#E08840] text-[#141210]"
                    : "bg-[#1E1B16] text-[#A89888] border border-[#3A3530] hover:text-[#F5E6D3] hover:border-[#E08840]/30"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Error */}
        {actionError && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="ml-auto text-red-400/70 hover:text-red-400 transition-colors"
            >
              &times;
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-5 animate-pulse"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-6 bg-[#3A3530] rounded-md" />
                  <div className="w-20 h-6 bg-[#3A3530] rounded-md" />
                </div>
                <div className="space-y-2">
                  <div className="w-2/3 h-4 bg-[#3A3530] rounded" />
                  <div className="w-1/2 h-4 bg-[#3A3530] rounded" />
                  <div className="w-1/3 h-4 bg-[#3A3530] rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertTriangle
              size={40}
              strokeWidth={1.2}
              className="mb-3 text-red-500/60"
            />
            <p className="text-sm font-medium text-red-400">
              Erreur de chargement
            </p>
            <p className="mt-1 text-xs text-[#6B6050]">
              {error instanceof Error ? error.message : "Une erreur est survenue"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox
              size={48}
              strokeWidth={1.2}
              className="mb-3 text-[#3A3530]"
            />
            <p className="text-sm font-medium text-[#6B6050]">
              Aucune soumission
            </p>
            <p className="mt-1 text-xs text-[#6B6050]">
              {statusFilter !== "all"
                ? "Aucune soumission avec ce statut"
                : "Les soumissions des utilisateurs apparaitront ici"}
            </p>
          </div>
        )}

        {/* Submissions List */}
        {!isLoading && !isError && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                isApproving={admin.approvingSubmission}
                isRejecting={admin.rejectingSubmission}
                isSavingEdit={admin.updatingSubmissionData}
                rejectingId={rejectingId}
                rejectReason={rejectReason}
                editingId={editingId}
                editData={editData}
                onApprove={() => handleApprove(sub.id)}
                onStartReject={() => {
                  setRejectingId(sub.id);
                  setRejectReason("");
                }}
                onCancelReject={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                onConfirmReject={() => handleReject(sub.id)}
                onReasonChange={setRejectReason}
                onStartEdit={() => handleStartEdit(sub)}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={() => handleSaveEdit(sub.id)}
                onEditFieldChange={handleEditFieldChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Submission Card
// ═══════════════════════════════════════════

interface SubmissionCardProps {
  submission: AdminSubmission;
  isApproving: boolean;
  isRejecting: boolean;
  isSavingEdit: boolean;
  rejectingId: string | null;
  rejectReason: string;
  editingId: string | null;
  editData: Record<string, unknown>;
  onApprove: () => void;
  onStartReject: () => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
  onReasonChange: (reason: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditFieldChange: (key: string, value: unknown) => void;
}

function SubmissionCard({
  submission,
  isApproving,
  isRejecting,
  isSavingEdit,
  rejectingId,
  rejectReason,
  editingId,
  editData,
  onApprove,
  onStartReject,
  onCancelReject,
  onConfirmReject,
  onReasonChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditFieldChange,
}: SubmissionCardProps) {
  const data = submission.data as Record<string, unknown>;
  const isPending = submission.status === "pending";
  const isRejectOpen = rejectingId === submission.id;
  const isEditing = editingId === submission.id;

  // Determine which fields are editable for this submission type
  const editableFields: EditableFieldDef[] =
    submission.type === "beer"
      ? BEER_EDITABLE_FIELDS
      : submission.type === "bar"
        ? BAR_EDITABLE_FIELDS
        : [];

  return (
    <div className="bg-[#1E1B16] border border-[#3A3530] rounded-xl p-5 transition-colors hover:border-[#3A3530]/80">
      {/* Header: badges + user + date */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <TypeBadge type={submission.type} />
        <StatusBadge status={submission.status} />

        <div className="ml-auto flex items-center gap-2 text-xs text-[#A89888]">
          {submission.user && (
            <span className="font-medium text-[#F5E6D3]">
              {submission.user.username || submission.user.display_name || "Anonyme"}
            </span>
          )}
          <span>&middot;</span>
          <time dateTime={submission.created_at}>
            {formatDate(submission.created_at)}
          </time>
        </div>
      </div>

      {/* Data Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
        {submission.type === "beer" && (
          <>
            {isEditing ? (
              <>
                {BEER_EDITABLE_FIELDS.map((field) => (
                  <EditableDataField
                    key={field.key}
                    label={field.label}
                    value={editData[field.key] ?? ""}
                    type={field.type}
                    onChange={(val) => onEditFieldChange(field.key, val)}
                  />
                ))}
                {data.barcode && (
                  <DataField label="Code-barres" value={data.barcode as string} />
                )}
              </>
            ) : (
              <>
                <DataField label="Nom" value={data.name as string} />
                <DataField label="Brasserie" value={data.brewery as string} />
                <DataField label="Style" value={data.style as string} />
                <DataField
                  label="ABV"
                  value={data.abv != null ? `${data.abv}%` : undefined}
                />
                {data.country && (
                  <DataField label="Pays" value={data.country as string} />
                )}
                {data.barcode && (
                  <DataField label="Code-barres" value={data.barcode as string} />
                )}
              </>
            )}
          </>
        )}
        {submission.type === "bar" && (
          <>
            {isEditing ? (
              <>
                {BAR_EDITABLE_FIELDS.map((field) => (
                  <EditableDataField
                    key={field.key}
                    label={field.label}
                    value={editData[field.key] ?? ""}
                    onChange={(val) => onEditFieldChange(field.key, val)}
                  />
                ))}
                {data.geo_lat != null && data.geo_lng != null && (
                  <DataField
                    label="Coordonnees"
                    value={`${data.geo_lat}, ${data.geo_lng}`}
                  />
                )}
              </>
            ) : (
              <>
                <DataField label="Nom" value={data.name as string} />
                <DataField label="Adresse" value={data.address as string} />
                <DataField label="Ville" value={data.city as string} />
                {data.geo_lat != null && data.geo_lng != null && (
                  <DataField
                    label="Coordonnees"
                    value={`${data.geo_lat}, ${data.geo_lng}`}
                  />
                )}
              </>
            )}
          </>
        )}
        {submission.type === "correction" && (
          <>
            {Object.entries(data).map(([key, val]) => (
              <DataField
                key={key}
                label={key}
                value={val != null ? String(val) : undefined}
              />
            ))}
          </>
        )}
      </div>

      {/* Edit mode: Save / Cancel buttons */}
      {isEditing && (
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onSaveEdit}
            disabled={isSavingEdit}
            className="flex items-center gap-2 px-4 py-2 bg-[#E08840] hover:bg-[#E08840]/80 disabled:opacity-50 disabled:cursor-not-allowed text-[#141210] text-sm font-medium rounded-lg transition-colors"
          >
            {isSavingEdit ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Sauvegarder
          </button>
          <button
            onClick={onCancelEdit}
            disabled={isSavingEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#A89888] hover:text-[#F5E6D3] transition-colors"
          >
            <X size={14} />
            Annuler
          </button>
        </div>
      )}

      {/* Rejected note */}
      {submission.status === "rejected" && submission.admin_note && (
        <div className="mb-4 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
          <p className="text-xs font-medium text-red-400 mb-0.5">
            Raison du rejet
          </p>
          <p className="text-sm text-[#F5E6D3]">{submission.admin_note}</p>
        </div>
      )}

      {/* Pending Actions */}
      {isPending && !isEditing && (
        <div className="border-t border-[#3A3530] pt-4 mt-2">
          {!isRejectOpen ? (
            <div className="flex items-center gap-3">
              {/* Edit button */}
              {editableFields.length > 0 && (
                <button
                  onClick={onStartEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1E1B16] border border-[#3A3530] hover:border-[#E08840]/50 text-[#E08840] text-sm font-medium rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                  Editer
                </button>
              )}
              <button
                onClick={onApprove}
                disabled={isApproving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isApproving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Approuver
              </button>
              <button
                onClick={onStartReject}
                disabled={isRejecting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                <XCircle size={14} />
                Rejeter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Raison du rejet..."
                rows={2}
                className="w-full px-3 py-2 bg-[#141210] border border-[#3A3530] rounded-lg text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 resize-none transition-colors"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={onConfirmReject}
                  disabled={isRejecting || !rejectReason.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {isRejecting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  Confirmer le rejet
                </button>
                <button
                  onClick={onCancelReject}
                  className="px-4 py-2 text-sm text-[#A89888] hover:text-[#F5E6D3] transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════

function TypeBadge({ type }: { type: AdminSubmission["type"] }) {
  const config: Record<
    AdminSubmission["type"],
    { label: string; icon: typeof Beer; bg: string; text: string }
  > = {
    beer: {
      label: "Biere",
      icon: Beer,
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
    bar: {
      label: "Bar",
      icon: MapPin,
      bg: "bg-teal-500/10",
      text: "text-teal-400",
    },
    correction: {
      label: "Correction",
      icon: AlertTriangle,
      bg: "bg-purple-500/10",
      text: "text-purple-400",
    },
  };

  const c = config[type] ?? config.beer;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <Icon size={12} />
      {c.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AdminSubmission["status"] }) {
  const config: Record<
    AdminSubmission["status"],
    { label: string; icon: typeof Clock; bg: string; text: string }
  > = {
    pending: {
      label: "En attente",
      icon: Clock,
      bg: "bg-yellow-500/10",
      text: "text-yellow-400",
    },
    approved: {
      label: "Approuvee",
      icon: CheckCircle2,
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
    },
    rejected: {
      label: "Rejetee",
      icon: XCircle,
      bg: "bg-red-500/10",
      text: "text-red-400",
    },
  };

  const c = config[status] ?? config.pending;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${c.bg} ${c.text}`}
    >
      <Icon size={12} />
      {c.label}
    </span>
  );
}

function DataField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="py-1">
      <dt className="text-[10px] uppercase tracking-wider text-[#6B6050] font-semibold">
        {label}
      </dt>
      <dd className="text-sm text-[#F5E6D3] mt-0.5">{value}</dd>
    </div>
  );
}

function EditableDataField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: unknown;
  type?: "text" | "number";
  onChange: (value: unknown) => void;
}) {
  const stringValue = value != null ? String(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (type === "number") {
      const num = parseFloat(e.target.value);
      onChange(isNaN(num) ? null : num);
    } else {
      onChange(e.target.value);
    }
  }

  return (
    <div className="py-1">
      <label className="text-[10px] uppercase tracking-wider text-[#6B6050] font-semibold block">
        {label}
      </label>
      <input
        type={type}
        step={type === "number" ? "0.1" : undefined}
        value={stringValue}
        onChange={handleChange}
        className="mt-0.5 w-full px-2.5 py-1.5 bg-[#141210] border border-[#3A3530] rounded-md text-sm text-[#F5E6D3] placeholder:text-[#6B6050] focus:outline-none focus:border-[#E08840]/50 focus:ring-1 focus:ring-[#E08840]/25 transition-colors"
      />
    </div>
  );
}

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
