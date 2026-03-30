"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, User, CornerDownRight, ChevronDown, ChevronUp } from "lucide-react";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

interface CommentWithReplies extends Comment {
  replies: Comment[];
}

interface Props {
  experimentId: string;
  profileName?: string;
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function avatarColor(name: string) {
  const colors = [
    "bg-purple-100 text-purple-700",
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
    "bg-cyan-100 text-cyan-700",
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
  // newest top-level first
  return roots.reverse();
}

/* ── Inline reply / comment form ── */
function CommentForm({
  experimentId,
  parentId,
  placeholder,
  onPosted,
  compact,
  profileName,
}: {
  experimentId: string;
  parentId?: string;
  placeholder?: string;
  onPosted: (comment: Comment) => void;
  compact?: boolean;
  profileName?: string;
}) {
  const [name, setName] = useState(profileName ?? "");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (compact) inputRef.current?.focus(); }, [compact]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !content.trim()) { setError("Please fill in both fields."); return; }
    setLoading(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experimentId, authorName: name, content, parentId: parentId ?? null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    onPosted(data.comment);
    setContent("");
    if (!compact) setName("");
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-2 space-y-2" : "bg-white rounded-2xl border border-gray-200 p-5 mb-8 card-shadow space-y-3"}>
      {/* Name area */}
      {profileName ? (
        /* Logged in: show profile name */
        <div className="flex items-center gap-2">
          <div className={`${compact ? "w-6 h-6 text-[10px]" : "w-9 h-9 text-xs"} rounded-full bg-purple-100 flex items-center justify-center shrink-0 font-bold text-purple-700`}>
            {profileName.charAt(0).toUpperCase()}
          </div>
          <span className={`${compact ? "text-xs" : "text-sm"} font-semibold text-gray-800`}>{profileName}</span>
        </div>
      ) : (
        /* Guest: show name input */
        !compact ? (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-purple-600" />
            </div>
            <input
              type="text"
              placeholder="Your name (or nickname)"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={30}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-400"
            />
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-400"
          />
        )
      )}
      <div className="flex gap-2">
        <textarea
          placeholder={placeholder ?? "What did you think? Be honest — the maker reads every comment."}
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={500}
          rows={compact ? 2 : 3}
          className={`flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-400 resize-none ${compact ? "text-xs" : ""}`}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{content.length}/500</span>
        <div className="flex items-center gap-2">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center gap-1.5 bg-gradient-primary text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity ${compact ? "text-xs px-3 py-1.5" : "text-xs px-4 py-2"}`}
          >
            <Send className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
            {loading ? "Posting..." : compact ? "Reply" : "Post Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}

/* ── Single reply row ── */
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

/* ── Top-level comment card ── */
function CommentItem({
  comment,
  experimentId,
  onReplyPosted,
  profileName,
}: {
  comment: CommentWithReplies;
  experimentId: string;
  onReplyPosted: (parentId: string, reply: Comment) => void;
  profileName?: string;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const visibleReplies = showAllReplies ? comment.replies : comment.replies.slice(0, 2);
  const hiddenCount = comment.replies.length - 2;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 card-shadow">
      {/* Author row */}
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(comment.author_name)}`}>
          {comment.author_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">{comment.author_name}</span>
            <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
        </div>
      </div>

      {/* Reply button */}
      <div className="mt-2 ml-11">
        <button
          onClick={() => setShowReplyForm(v => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-purple-600 transition-colors"
        >
          <CornerDownRight className="w-3 h-3" />
          {showReplyForm ? "Cancel" : `Reply${comment.replies.length > 0 ? ` (${comment.replies.length})` : ""}`}
        </button>
      </div>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ml-8 mt-1 border-l-2 border-gray-100 pl-3 space-y-0">
          {visibleReplies.map(r => <ReplyItem key={r.id} reply={r} />)}
          {hiddenCount > 0 && !showAllReplies && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="flex items-center gap-1 text-xs text-purple-600 font-medium mt-2 hover:text-purple-700"
            >
              <ChevronDown className="w-3 h-3" /> Show {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
            </button>
          )}
          {showAllReplies && comment.replies.length > 2 && (
            <button
              onClick={() => setShowAllReplies(false)}
              className="flex items-center gap-1 text-xs text-gray-400 font-medium mt-2 hover:text-gray-600"
            >
              <ChevronUp className="w-3 h-3" /> Show less
            </button>
          )}
        </div>
      )}

      {/* Inline reply form */}
      {showReplyForm && (
        <div className="ml-8 mt-2 border-l-2 border-purple-100 pl-3">
          <CommentForm
            experimentId={experimentId}
            parentId={comment.id}
            placeholder={`Reply to ${comment.author_name}...`}
            compact
            profileName={profileName}
            onPosted={(reply) => {
              onReplyPosted(comment.id, reply);
              setShowReplyForm(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main Section ── */
export function CommentSection({ experimentId, profileName }: Props) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`/api/comments?experimentId=${experimentId}`)
      .then(r => r.json())
      .then(d => {
        const flat: Comment[] = d.comments ?? [];
        setTotal(flat.length);
        setComments(buildTree(flat));
      });
  }, [experimentId]);

  function handleNewComment(comment: Comment) {
    setComments(prev => [{ ...comment, replies: [] }, ...prev]);
    setTotal(t => t + 1);
  }

  function handleReply(parentId: string, reply: Comment) {
    setComments(prev =>
      prev.map(c =>
        c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
      )
    );
    setTotal(t => t + 1);
  }

  return (
    <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">
            Leave Feedback
            {total > 0 && <span className="ml-2 text-sm font-normal text-gray-400">({total})</span>}
          </h2>
        </div>

        {/* New comment form */}
        <CommentForm experimentId={experimentId} onPosted={handleNewComment} profileName={profileName} />

        {/* List */}
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
                profileName={profileName}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
