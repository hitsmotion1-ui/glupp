"use client";

import { useState, useEffect } from "react";
import { useBarReviews } from "@/lib/hooks/useBarReviews";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Star,
  Beer,
  Music,
  DollarSign,
  HeartHandshake,
  Send,
  ChevronDown,
  ChevronUp,
  Edit3,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bar } from "@/types";

interface BarReviewPanelProps {
  bar: Bar & { distance?: number; google_rating?: number };
  onClose: () => void;
}

const CRITERIA = [
  { key: "ambiance" as const, label: "Ambiance", emoji: "🎵", icon: Music, color: "#A78BFA" },
  { key: "beer_selection" as const, label: "Bieres", emoji: "🍺", icon: Beer, color: "#E08840" },
  { key: "price" as const, label: "Prix", emoji: "💰", icon: DollarSign, color: "#4ECDC4" },
  { key: "service" as const, label: "Service", emoji: "🤝", icon: HeartHandshake, color: "#F0C460" },
];

function StarRating({
  value,
  onChange,
  size = 16,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`transition-transform ${
            !readonly ? "hover:scale-110 active:scale-95 cursor-pointer" : "cursor-default"
          }`}
        >
          <Star
            size={size}
            className={
              star <= value
                ? "text-glupp-gold fill-glupp-gold"
                : "text-glupp-border"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function BarReviewPanel({ bar, onClose }: BarReviewPanelProps) {
  const { reviews, userReview, stats, loadingReviews, submitReview, submitting } =
    useBarReviews(bar.id);

  const [showForm, setShowForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ambiance: userReview?.ambiance || 3,
    beer_selection: userReview?.beer_selection || 3,
    price: userReview?.price || 3,
    service: userReview?.service || 3,
    comment: userReview?.comment || "",
  });

  // Update form when userReview loads
  useEffect(() => {
    if (userReview) {
      setForm({
        ambiance: userReview.ambiance,
        beer_selection: userReview.beer_selection,
        price: userReview.price,
        service: userReview.service,
        comment: userReview.comment || "",
      });
    }
  }, [userReview]);

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await submitReview({
        bar_id: bar.id,
        ...form,
      });
      setShowForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      console.error("Review submit failed:", msg);
      setSubmitError(msg);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin}min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `${diffD}j`;
    return `${Math.floor(diffD / 30)}mo`;
  };

  return (
    <div className="space-y-4">
      {/* Ratings summary */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google Rating */}
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="text-lg">G</span>
            <span className="font-display font-bold text-glupp-cream text-lg">
              {bar.google_rating ? bar.google_rating.toFixed(1) : bar.rating > 0 ? bar.rating.toFixed(1) : "--"}
            </span>
          </div>
          <p className="text-[10px] text-glupp-text-muted">Avis Google</p>
          <StarRating value={Math.round(bar.google_rating || bar.rating || 0)} readonly size={12} />
        </Card>

        {/* Glupp Rating */}
        <Card className="p-3 text-center border-glupp-accent/30">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="text-lg">🍺</span>
            <span className="font-display font-bold text-glupp-accent text-lg">
              {stats.total_reviews > 0 ? stats.avg_overall.toFixed(1) : "--"}
            </span>
          </div>
          <p className="text-[10px] text-glupp-text-muted">
            Avis Glupp ({stats.total_reviews})
          </p>
          <StarRating value={Math.round(stats.avg_overall)} readonly size={12} />
        </Card>
      </div>

      {/* Criteria breakdown */}
      {stats.total_reviews > 0 && (
        <Card className="p-4">
          <h4 className="font-display font-semibold text-sm text-glupp-cream mb-3">
            Notes Glupp
          </h4>
          <div className="space-y-2.5">
            {CRITERIA.map((c) => {
              const avg =
                c.key === "ambiance"
                  ? stats.avg_ambiance
                  : c.key === "beer_selection"
                  ? stats.avg_beer_selection
                  : c.key === "price"
                  ? stats.avg_price
                  : stats.avg_service;

              return (
                <div key={c.key} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center">{c.emoji}</span>
                  <span className="text-xs text-glupp-text-soft w-16">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-glupp-border rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(avg / 5) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-glupp-cream w-8 text-right">
                    {avg.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Write review button */}
      <Button
        variant={userReview ? "ghost" : "primary"}
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setShowForm(!showForm);
        }}
      >
        {userReview ? (
          <>
            <Edit3 size={14} className="mr-1.5" />
            Modifier mon avis
          </>
        ) : (
          <>
            <Star size={14} className="mr-1.5" />
            Donner mon avis
          </>
        )}
      </Button>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 border-glupp-accent/30 space-y-4">
              <h4 className="font-display font-semibold text-sm text-glupp-cream">
                {userReview ? "Modifier mon avis" : "Mon avis"}
              </h4>

              {/* Rating criteria */}
              <div className="space-y-3">
                {CRITERIA.map((c) => (
                  <div key={c.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{c.emoji}</span>
                      <span className="text-xs text-glupp-text-soft">{c.label}</span>
                    </div>
                    <StarRating
                      value={form[c.key]}
                      onChange={(v) => setForm((f) => ({ ...f, [c.key]: v }))}
                      size={20}
                    />
                  </div>
                ))}
              </div>

              {/* Comment */}
              <div>
                <textarea
                  value={form.comment}
                  onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Un commentaire ? (optionnel)"
                  rows={2}
                  className="w-full px-3 py-2 bg-glupp-bg border border-glupp-border rounded-glupp text-sm text-glupp-cream placeholder:text-glupp-text-muted focus:outline-none focus:border-glupp-accent transition-colors resize-none"
                />
              </div>

              {/* Error message */}
              {submitError && (
                <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-glupp">
                  {submitError}
                </p>
              )}

              {/* Submit */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="animate-spin w-4 h-4 border-2 border-glupp-bg border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Send size={14} className="mr-1.5" />
                      {userReview ? "Modifier" : "Envoyer"}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div>
          <button
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="flex items-center gap-1.5 text-xs text-glupp-text-muted hover:text-glupp-cream transition-colors mb-2"
          >
            <MessageSquare size={12} />
            {reviews.length} avis Glupp
            {showAllReviews ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <AnimatePresence>
            {showAllReviews && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {reviews.slice(0, 10).map((review) => (
                  <Card key={review.id} className="p-3">
                    <div className="flex items-start gap-2.5">
                      <Avatar
                        url={review.user?.avatar_url}
                        name={review.user?.display_name || review.user?.username || "?"}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-xs text-glupp-cream truncate">
                            {review.user?.display_name || review.user?.username || "Anonyme"}
                          </span>
                          <span className="text-[10px] text-glupp-text-muted">
                            {formatTimeAgo(review.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-1">
                          <StarRating
                            value={Math.round(
                              (review.ambiance +
                                review.beer_selection +
                                review.price +
                                review.service) /
                                4
                            )}
                            readonly
                            size={10}
                          />
                          <span className="text-[10px] text-glupp-text-muted">
                            {(
                              (review.ambiance +
                                review.beer_selection +
                                review.price +
                                review.service) /
                              4
                            ).toFixed(1)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-xs text-glupp-text-soft leading-relaxed">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {loadingReviews && (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}
    </div>
  );
}
