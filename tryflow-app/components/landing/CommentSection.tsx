"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { MessageSquare, Send, User, CornerDownRight, ChevronDown, ChevronUp, Coins, Sparkles, Heart, Flag, X, AlertTriangle } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  credit_awarded: number;
  reactions: string[];
  likes_count: number;
  liked: boolean;
}

interface CommentWithReplies extends Comment {
  replies: Comment[];
}

interface Props {
  experimentId: string;
  profileName?: string;
}

const REACTION_TAGS = [
  "⚡ Easy to understand", "💡 Innovative idea", "🎯 Solves a real problem",
  "💰 Would pay for this", "🚀 Would use this", "🤔 Needs more clarity",
  "🔧 Needs improvement", "📊 Strong market fit", "🏆 Better than alternatives",
  "👥 Built for my needs",
];

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function avatarColor(name: string) {
  const colors = [
    "bg-purple-100 text-purple-700", "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",   "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",     "bg-cyan-100 text-cyan-700",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function buildTree(flat: Comment[]): CommentWithReplies[] {
  const map: Record<string, CommentWithReplies> = {};
  flat.forEach(c => { map[c.id] = { ...c, replies: [] }; });
  const roots: CommentWithReplies[] = [];
  flat.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  // Top-liked first, ties broken by newest
  roots.sort((a, b) =>
    b.likes_count !== a.likes_count
      ? b.likes_count - a.likes_count
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return roots;
}

/* ── Reaction stats bar ── */
function ReactionStats({ flat }: { flat: Comment[] }) {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    flat.forEach(c => (c.reactions ?? []).forEach(r => { counts[r] = (counts[r] ?? 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [flat]);

  if (stats.length === 0) return null;

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-100 p-4 card-shadow">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Feedback Overview</p>
      <div className="flex flex-wrap gap-2">
        {stats.map(([tag, count]) => (
          <span key={tag} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
            {tag}
            <span className="bg-purple-100 text-purple-700 rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[20px] text-center">
              {count}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── CommentForm ── */
function CommentForm({
  experimentId, parentId, placeholder, onPosted, compact, profileName,
}: {
  experimentId: string;
  parentId?: string;
  placeholder?: string;
  onPosted: (comment: Comment, creditAwarded: number) => void;
  compact?: boolean;
  profileName?: string;
}) {
  const [name, setName] = useState(profileName ?? "");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoggedIn = !!profileName;
  const charCount = content.length;
  const meetsMinLength = charCount >= 200;

  useEffect(() => { if (compact) inputRef.current?.focus(); }, [compact]);

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) :
      prev.length < 3    ? [...prev, tag] : prev
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !content.trim()) { setError("Please fill in both fields."); return; }
    setLoading(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId, authorName: name, content, parentId: parentId ?? null,
        reactions: compact ? [] : selectedTags,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    const awarded = data.creditAwarded ?? 0;
    onPosted(data.comment, awarded);
    if (awarded > 0) window.dispatchEvent(new CustomEvent("credits-updated"));
    setContent("");
    setSelectedTags([]);
    if (!compact) setName("");
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-2 space-y-2" : "bg-white rounded-2xl border border-gray-200 p-5 mb-8 card-shadow space-y-3"}>
      {/* Name area */}
      {profileName ? (
        <div className="flex items-center gap-2">
          <div className={`${compact ? "w-6 h-6 text-[10px]" : "w-9 h-9 text-xs"} rounded-full bg-purple-100 flex items-center justify-center shrink-0 font-bold text-purple-700`}>
            {profileName.charAt(0).toUpperCase()}
          </div>
          <span className={`${compact ? "text-xs" : "text-sm"} font-semibold text-gray-800`}>{profileName}</span>
        </div>
      ) : (
        !compact ? (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <input type="text" placeholder="Your name (or nickname)"
              value={name} onChange={e => setName(e.target.value)} maxLength={30}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-300 placeholder:text-gray-400"
            />
          </div>
        ) : (
          <input ref={inputRef} type="text" placeholder="Your name"
            value={name} onChange={e => setName(e.target.value)} maxLength={30}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-300 placeholder:text-gray-400"
          />
        )
      )}

      <div className="flex gap-2">
        <textarea
          placeholder={placeholder ?? "What did you think? Be honest — the maker reads every comment."}
          value={content} onChange={e => setContent(e.target.value)}
          maxLength={500} rows={compact ? 2 : 3}
          className={`flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-300 placeholder:text-gray-400 resize-none ${compact ? "text-xs" : ""}`}
        />
      </div>

      {/* Reaction tag picker (top-level only) */}
      {!compact && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Tag your feedback <span className="text-gray-300">(optional · up to 3)</span></p>
          <div className="flex flex-wrap gap-1.5">
            {REACTION_TAGS.map(tag => {
              const selected = selectedTags.includes(tag);
              const disabled = !selected && selectedTags.length >= 3;
              return (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} disabled={disabled}
                  className={`text-xs rounded-full px-2.5 py-1 border transition-colors ${
                    selected  ? "bg-purple-600 text-white border-purple-600" :
                    disabled  ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed" :
                                "bg-white text-gray-600 border-gray-200 hover:border-purple-400"
                  }`}>
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit hint + char count */}
      {!compact && (
        <div className="flex items-center justify-between">
          {isLoggedIn ? (
            <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${meetsMinLength ? "text-amber-600" : "text-gray-400"}`}>
              <Coins className="w-3.5 h-3.5" />
              {meetsMinLength
                ? <span className="text-amber-600">200 chars reached! +10 credits on submit</span>
                : <span>{200 - charCount} more chars for +10 credits</span>
              }
            </div>
          ) : <div />}

          <div className="flex items-center gap-1.5">
            {charCount > 0 && charCount < 200 && (
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${(charCount / 200) * 100}%` }} />
              </div>
            )}
            <span className={`text-xs ${meetsMinLength ? "text-amber-600 font-semibold" : "text-gray-400"}`}>
              {charCount}/500
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs ${compact ? "text-gray-400" : "hidden"}`}>{charCount}/500</span>
        <div className={`flex items-center gap-2 ${compact ? "" : "ml-auto"}`}>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className={`inline-flex items-center gap-1.5 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 disabled:opacity-50 transition-colors ${compact ? "text-xs px-3 py-1.5" : "text-xs px-4 py-2"}`}>
            <Send className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
            {loading ? "Posting..." : compact ? "Reply" : "Post Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Reply row ── */
function ReplyItem({ reply }: { reply: Comment }) {
  return (
    <div className="flex items-start gap-2.5 pt-3">
      <CornerDownRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1" />
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor(reply.author_name)}`}>
        {reply.author_name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-gray-900">{reply.author_name}</span>
          <span className="text-[10px] text-gray-400">{timeAgo(reply.created_at)}</span>
        </div>
        <p className="text-xs text-gray-700 leading-relaxed">{reply.content}</p>
      </div>
    </div>
  );
}

/* ── Comment card ── */
function CommentItem({
  comment, experimentId, onReplyPosted, onLike, onReport, profileName,
}: {
  comment: CommentWithReplies;
  experimentId: string;
  onReplyPosted: (parentId: string, reply: Comment) => void;
  onLike: (commentId: string) => void;
  onReport: (commentId: string) => void;
  profileName?: string;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reported, setReported] = useState(() =>
    typeof window !== "undefined" && !!localStorage.getItem(`trywepp_reported_${comment.id}`)
  );
  const visibleReplies = showAllReplies ? comment.replies : comment.replies.slice(0, 2);
  const hiddenCount = comment.replies.length - 2;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 card-shadow relative">
      {/* Credit badge */}
      {comment.credit_awarded > 0 && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold rounded-full px-2 py-0.5">
          +{comment.credit_awarded} ✨
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(comment.author_name)}`}>
          {comment.author_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 pr-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{comment.author_name}</span>
            <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>

          {/* Reaction tags on the comment */}
          {(comment.reactions ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {comment.reactions.map(tag => (
                <span key={tag} className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-2 py-0.5 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-2 ml-11 flex items-center gap-3">
        {/* Like */}
        <button
          onClick={() => onLike(comment.id)}
          className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
            comment.liked ? "text-red-500" : "text-gray-400 hover:text-red-400"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${comment.liked ? "fill-current" : ""}`} />
          {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
        </button>

        {/* Reply */}
        <button
          onClick={() => setShowReplyForm(v => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-purple-600 transition-colors"
        >
          <CornerDownRight className="w-3 h-3" />
          {showReplyForm ? "Cancel" : `Reply${comment.replies.length > 0 ? ` (${comment.replies.length})` : ""}`}
        </button>

        {/* Report */}
        <button
          onClick={() => { if (!reported) setShowReportModal(true); }}
          disabled={reported}
          className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ml-auto ${
            reported ? "text-red-400 cursor-default" : "text-gray-300 hover:text-red-400"
          }`}
          title={reported ? "Reported" : "Report"}
        >
          <Flag className={`w-3 h-3 ${reported ? "fill-current" : ""}`} />
          {reported && <span>Reported</span>}
        </button>

        {showReportModal && (
          <ReportModal
            onConfirm={() => { setReported(true); setShowReportModal(false); onReport(comment.id); }}
            onCancel={() => setShowReportModal(false)}
          />
        )}
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-8 mt-1 border-l-2 border-gray-100 pl-3 space-y-0">
          {visibleReplies.map(r => <ReplyItem key={r.id} reply={r} />)}
          {hiddenCount > 0 && !showAllReplies && (
            <button onClick={() => setShowAllReplies(true)}
              className="flex items-center gap-1 text-xs text-purple-600 font-medium mt-2 hover:text-purple-700">
              <ChevronDown className="w-3 h-3" /> Show {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
            </button>
          )}
          {showAllReplies && comment.replies.length > 2 && (
            <button onClick={() => setShowAllReplies(false)}
              className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-2 hover:text-gray-600">
              <ChevronUp className="w-3 h-3" /> Show less
            </button>
          )}
        </div>
      )}

      {showReplyForm && (
        <div className="ml-8 mt-2 border-l-2 border-purple-100 pl-3">
          <CommentForm
            experimentId={experimentId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.author_name}...`}
            compact profileName={profileName}
            onPosted={(reply) => { onReplyPosted(comment.id, reply); setShowReplyForm(false); }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Report modal ── */
function ReportModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Report this comment?</h3>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              You can report comments that seem inappropriate or spam.<br />
              You can only report once.
            </p>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Credit toast ── */
function CreditToast({ amount, onDismiss }: { amount: number; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-amber-500 text-white text-sm font-semibold px-4 py-3 rounded-2xl shadow-lg animate-in slide-in-from-bottom-4">
      <Sparkles className="w-4 h-4" />
      +{amount} credits earned!
    </div>
  );
}

/* ── Main ── */
export function CommentSection({ experimentId, profileName }: Props) {
  const [flat, setFlat] = useState<Comment[]>([]);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [total, setTotal] = useState(0);
  const [creditToast, setCreditToast] = useState(0);
  const [voterId, setVoterId] = useState("");

  // Init voter ID from localStorage
  useEffect(() => {
    let id = localStorage.getItem("trywepp_voter_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("trywepp_voter_id", id); }
    setVoterId(id);
  }, []);

  // Fetch comments (depends on voterId being set)
  useEffect(() => {
    if (!voterId) return;
    fetch(`/api/comments?experimentId=${experimentId}&voterId=${encodeURIComponent(voterId)}`)
      .then(r => r.json())
      .then(d => {
        const data: Comment[] = d.comments ?? [];
        setFlat(data.filter(c => !c.parent_id));
        setTotal(data.length);
        setComments(buildTree(data));
      });
  }, [experimentId, voterId]);

  function handleNewComment(comment: Comment, creditAwarded: number) {
    const full: Comment = { ...comment, liked: false, likes_count: 0 };
    setComments(prev => {
      const updated = [{ ...full, replies: [] }, ...prev];
      return updated.sort((a, b) =>
        b.likes_count !== a.likes_count
          ? b.likes_count - a.likes_count
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    setFlat(prev => [...prev, full]);
    setTotal(t => t + 1);
    if (creditAwarded > 0) setCreditToast(creditAwarded);
  }

  function handleReply(parentId: string, reply: Comment) {
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
    ));
    setTotal(t => t + 1);
  }

  const handleReport = useCallback((commentId: string) => {
    const key = `trywepp_reported_${commentId}`;
    if (localStorage.getItem(key)) return; // already reported
    localStorage.setItem(key, "1");

    fetch(`/api/comments/${commentId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reporterId: voterId }),
    });
  }, [voterId]);

  const handleLike = useCallback((commentId: string) => {
    // Optimistic update
    setComments(prev => {
      const updated = prev.map(c =>
        c.id === commentId
          ? { ...c, liked: !c.liked, likes_count: c.liked ? Math.max(c.likes_count - 1, 0) : c.likes_count + 1 }
          : c
      );
      return updated.sort((a, b) =>
        b.likes_count !== a.likes_count
          ? b.likes_count - a.likes_count
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    fetch(`/api/comments/${commentId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId }),
    })
      .then(r => r.json())
      .then(data => {
        setComments(prev => {
          const updated = prev.map(c =>
            c.id === commentId ? { ...c, liked: data.liked, likes_count: data.likes_count } : c
          );
          return updated.sort((a, b) =>
            b.likes_count !== a.likes_count
              ? b.likes_count - a.likes_count
              : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      })
      .catch(() => {
        // Revert on error
        setComments(prev => prev.map(c =>
          c.id === commentId
            ? { ...c, liked: !c.liked, likes_count: c.liked ? Math.max(c.likes_count - 1, 0) : c.likes_count + 1 }
            : c
        ));
      });
  }, [voterId]);

  return (
    <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Leave Feedback
            {total > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>}
          </h2>
        </div>

        {/* Credit banner */}
        {profileName && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-6 text-xs text-amber-700">
            <Coins className="w-3.5 h-3.5 shrink-0 text-amber-500" />
            <span>Write <strong>200+ characters</strong> to earn <strong>+10 credits</strong>.</span>
          </div>
        )}

        {/* Reaction stats */}
        <ReactionStats flat={flat} />

        {/* New comment form */}
        <CommentForm experimentId={experimentId} onPosted={handleNewComment} profileName={profileName} />

        {/* Comment list */}
        {comments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No comments yet. Be the first to leave feedback!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                experimentId={experimentId}
                onReplyPosted={handleReply}
                onLike={handleLike}
                onReport={handleReport}
                profileName={profileName}
              />
            ))}
          </div>
        )}
      </div>

      {creditToast > 0 && (
        <CreditToast amount={creditToast} onDismiss={() => setCreditToast(0)} />
      )}
    </section>
  );
}
