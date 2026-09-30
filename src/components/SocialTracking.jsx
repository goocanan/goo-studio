import { useState, useEffect, useMemo } from "react";
import { Video, Eye, Heart, MessageCircle, Share2, Bookmark, MousePointerClick, ExternalLink, Plus, Trash2, Pencil, X, Trophy, TrendingUp, BarChart3 } from "lucide-react";

const PLATFORMS = [
  { id: "youtube_shorts", label: "YouTube Shorts", short: "YT Shorts", color: "#ff0033", bg: "rgba(255,0,51,0.12)", border: "rgba(255,0,51,0.35)" },
  { id: "instagram_reels", label: "Instagram Reels", short: "IG Reels", color: "#e4405f", bg: "rgba(228,64,95,0.12)", border: "rgba(228,64,95,0.35)" },
  { id: "facebook_reels", label: "Facebook Reels", short: "FB Reels", color: "#1877f2", bg: "rgba(24,119,242,0.12)", border: "rgba(24,119,242,0.35)" },
  { id: "tiktok", label: "TikTok", short: "TikTok", color: "#ffffff", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.18)" },
];

const STATUSES = ["draft", "scheduled", "published"];

const platformMap = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

function scoreColor(score) {
  if (score >= 50000) return "var(--success)";
  if (score >= 10000) return "#22c55e";
  if (score >= 3000) return "var(--accent)";
  if (score >= 500) return "var(--warning)";
  return "var(--text-dim)";
}

function engagementColor(rateBps) {
  // rate is bps*100 (e.g. 875 = 8.75%)
  const pct = rateBps / 100;
  if (pct >= 7) return "var(--success)";
  if (pct >= 3) return "#22c55e";
  if (pct >= 1) return "var(--warning)";
  return "var(--text-dim)";
}

function fmtNum(n) {
  if (n == null || n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function SocialTrackingCard({ posts, onCreate, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [form, setForm] = useState(blankForm());

  function blankForm() {
    return { platform: "youtube_shorts", title: "", postUrl: "", status: "draft", views: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, notes: "" };
  }

  const filtered = useMemo(() => {
    if (filterPlatform === "all") return posts;
    return posts.filter((p) => p.platform === filterPlatform);
  }, [posts, filterPlatform]);

  const stats = useMemo(() => {
    const s = { totalViews: 0, totalLikes: 0, avgEngagement: 0, topScore: 0, perPlatform: {} };
    for (const p of PLATFORMS) s.perPlatform[p.id] = { count: 0, views: 0, score: 0 };
    let erSum = 0, erCount = 0;
    for (const post of posts) {
      s.totalViews += Number(post.views) || 0;
      s.totalLikes += Number(post.likes) || 0;
      const sc = Number(post.contentScore) || 0;
      if (sc > s.topScore) s.topScore = sc;
      const er = Number(post.engagementRate) || 0;
      if (post.views > 0) { erSum += er; erCount++; }
      const pm = s.perPlatform[post.platform];
      if (pm) { pm.count++; pm.views += Number(post.views) || 0; pm.score += sc; }
    }
    s.avgEngagement = erCount > 0 ? Math.round(erSum / erCount) : 0; // still bps*100
    return s;
  }, [posts]);

  function openCreate() { setEditing(null); setForm(blankForm()); setShowForm(true); }
  function openEdit(post) {
    setEditing(post);
    setForm({ platform: post.platform, title: post.title, postUrl: post.postUrl || "", status: post.status, views: post.views, likes: post.likes, comments: post.comments, shares: post.shares, saves: post.saves, clicks: post.clicks, notes: post.notes || "" });
    setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditing(null); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const payload = {
      platform: form.platform, title: form.title.trim(), postUrl: form.postUrl.trim() || null,
      status: form.status,
      views: Number(form.views) || 0, likes: Number(form.likes) || 0, comments: Number(form.comments) || 0,
      shares: Number(form.shares) || 0, saves: Number(form.saves) || 0, clicks: Number(form.clicks) || 0,
      notes: form.notes.trim() || null,
    };
    if (editing) await onUpdate(editing.id, payload);
    else await onCreate(payload);
    closeForm();
  }

  return (
    <div className="card" style={{ marginTop: "1rem" }}>
      <div className="flex items-center justify-between flex-wrap gap-3" style={{ marginBottom: "1rem" }}>
        <div className="flex items-center gap-2">
          <Video size={18} className="text-accent" />
          <h3 className="font-bold text-sm tracking-wide uppercase" style={{ letterSpacing: "0.04em" }}>Social Media Tracking</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-dim)" }}>{posts.length} posts</span>
        </div>
        <button className="btn btn-primary btn-xs" onClick={openCreate}><Plus size={14} /> Tambah Post</button>
      </div>

      {/* Summary chips */}
      {posts.length > 0 && (
        <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))" }}>
          <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="text-xs text-dim flex items-center gap-1"><Eye size={12} /> Total Views</div>
            <div className="font-extrabold text-lg">{fmtNum(stats.totalViews)}</div>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="text-xs text-dim flex items-center gap-1"><Heart size={12} /> Total Likes</div>
            <div className="font-extrabold text-lg">{fmtNum(stats.totalLikes)}</div>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="text-xs text-dim flex items-center gap-1"><TrendingUp size={12} /> Avg. Eng. Rate</div>
            <div className="font-extrabold text-lg" style={{ color: engagementColor(stats.avgEngagement) }}>{(stats.avgEngagement / 100).toFixed(2)}%</div>
          </div>
          <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <div className="text-xs text-dim flex items-center gap-1"><Trophy size={12} /> Top Score</div>
            <div className="font-extrabold text-lg" style={{ color: scoreColor(stats.topScore) }}>{fmtNum(stats.topScore)}</div>
          </div>
        </div>
      )}

      {/* Platform filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <button className={`btn btn-xs ${filterPlatform === "all" ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterPlatform("all")}>Semua</button>
        {PLATFORMS.map((p) => (
          <button key={p.id} className={`btn btn-xs ${filterPlatform === p.id ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterPlatform(p.id)}>{p.short}</button>
        ))}
      </div>

      {/* Posts list */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 rounded-lg" style={{ background: "var(--surface-2)", border: "1px dashed var(--border)", color: "var(--text-dim)" }}>
          <Video size={28} className="mx-auto mb-2 opacity-40" />
          <div className="text-sm font-medium">Belum ada post {filterPlatform !== "all" ? `untuk ${platformMap[filterPlatform]?.short}` : ""}</div>
          <div className="text-xs mt-1">Tambahkan tracking upload sosial untuk project ini.</div>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {filtered.map((post) => {
            const pf = platformMap[post.platform] || PLATFORMS[0];
            const erPct = (Number(post.engagementRate) / 100).toFixed(2);
            return (
              <div key={post.id} className="rounded-xl px-3.5 py-3 flex flex-col gap-2.5" style={{ background: "var(--surface-2)", border: `1px solid ${pf.border}`, borderLeft: `3px solid ${pf.color}` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: pf.bg, color: pf.color, border: `1px solid ${pf.border}` }}>{pf.short}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${post.status === "published" ? "bg-success/15 text-success" : post.status === "scheduled" ? "bg-accent/15 text-accent" : "bg-dim/10 text-dim"}`}>{post.status}</span>
                      <span className="text-xs text-dim">{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("id-ID") : ""}</span>
                    </div>
                    <div className="font-semibold text-sm mt-1 truncate" title={post.title}>{post.title}</div>
                    {post.postUrl && (
                      <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 mt-0.5 hover:underline" style={{ color: "var(--accent)" }}><ExternalLink size={11} /> Buka link</a>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(post)} title="Edit"><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => { if (confirm(`Hapus "${post.title}"?`)) onDelete(post.id); }} title="Hapus"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Analytics row */}
                <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
                  <Metric icon={<Eye size={11} />} label="Views" value={fmtNum(post.views)} />
                  <Metric icon={<Heart size={11} />} label="Likes" value={fmtNum(post.likes)} />
                  <Metric icon={<MessageCircle size={11} />} label="Comments" value={fmtNum(post.comments)} />
                  <Metric icon={<Share2 size={11} />} label="Shares" value={fmtNum(post.shares)} />
                  <Metric icon={<Bookmark size={11} />} label="Saves" value={fmtNum(post.saves)} />
                  <Metric icon={<MousePointerClick size={11} />} label="Clicks" value={fmtNum(post.clicks)} />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: scoreColor(Number(post.contentScore)) }}><BarChart3 size={12} /> Score {fmtNum(post.contentScore)}</span>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: engagementColor(Number(post.engagementRate)) }}><TrendingUp size={12} /> ER {erPct}%</span>
                  {post.notes && <span className="text-xs text-dim truncate max-w-[200px]" title={post.notes}>— {post.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={closeForm}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-lg rounded-2xl p-5 flex flex-col gap-3 max-h-[90vh] overflow-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{editing ? "Edit Post" : "Tambah Post Sosial"}</h3>
              <button type="button" className="btn btn-ghost btn-xs" onClick={closeForm}><X size={16} /></button>
            </div>

            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <label className="flex flex-col gap-1 text-xs font-medium">Platform
                <select className="input input-sm" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>
                  {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">Status
                <select className="input input-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium">Judul / Caption
              <input className="input input-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Judul konten" required />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium">Link Post (opsional)
              <input className="input input-sm" value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })} placeholder="https://..." />
            </label>

            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <NumField label="Views" value={form.views} onChange={(v) => setForm({ ...form, views: v })} />
              <NumField label="Likes" value={form.likes} onChange={(v) => setForm({ ...form, likes: v })} />
              <NumField label="Comments" value={form.comments} onChange={(v) => setForm({ ...form, comments: v })} />
              <NumField label="Shares" value={form.shares} onChange={(v) => setForm({ ...form, shares: v })} />
              <NumField label="Saves" value={form.saves} onChange={(v) => setForm({ ...form, saves: v })} />
              <NumField label="Clicks" value={form.clicks} onChange={(v) => setForm({ ...form, clicks: v })} />
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium">Catatan
              <textarea className="input input-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan internal..." />
            </label>

            <div className="flex justify-end gap-2 mt-1">
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm}>Batal</button>
              <button type="submit" className="btn btn-primary btn-sm">{editing ? "Simpan Perubahan" : "Tambah Post"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="text-xs text-dim flex items-center justify-center gap-1">{icon} {label}</div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium">{label}
      <input type="number" min={0} className="input input-sm" value={value} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />
    </label>
  );
}

// -------- Dashboard Analytics --------
export function SocialAnalyticsSection({ posts }) {
  const data = useMemo(() => {
    const per = {};
    for (const p of PLATFORMS) per[p.id] = { ...p, count: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, score: 0, erSum: 0, erN: 0 };
    let totalViews = 0, totalScore = 0, totalPosts = posts.length;
    for (const post of posts) {
      const row = per[post.platform];
      if (!row) continue;
      row.count++;
      row.views += Number(post.views) || 0;
      row.likes += Number(post.likes) || 0;
      row.comments += Number(post.comments) || 0;
      row.shares += Number(post.shares) || 0;
      row.saves += Number(post.saves) || 0;
      row.clicks += Number(post.clicks) || 0;
      row.score += Number(post.contentScore) || 0;
      if (Number(post.views) > 0) { row.erSum += Number(post.engagementRate) || 0; row.erN++; }
      totalViews += Number(post.views) || 0;
      totalScore += Number(post.contentScore) || 0;
    }
    const active = PLATFORMS.map((p) => per[p.id]).filter((r) => r.count > 0);
    const best = [...posts].sort((a, b) => (Number(b.contentScore) || 0) - (Number(a.contentScore) || 0))[0] || null;
    const maxViews = Math.max(1, ...Object.values(per).map((r) => r.views));
    return { per, totalViews, totalScore, totalPosts, active, best, maxViews };
  }, [posts]);

  if (posts.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-3"><BarChart3 size={18} className="text-accent" /><h3 className="font-bold text-sm uppercase tracking-wide">Social Analytics</h3></div>
        <div className="text-center py-6 rounded-lg text-sm" style={{ background: "var(--surface-2)", border: "1px dashed var(--border)", color: "var(--text-dim)" }}>
          Belum ada data sosial. Tambahkan post di halaman Project untuk melihat analytics di sini.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2"><BarChart3 size={18} className="text-accent" /><h3 className="font-bold text-sm uppercase tracking-wide">Social Analytics</h3><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-dim)", border: "1px solid var(--border)" }}>{data.totalPosts} posts · {fmtNum(data.totalViews)} views</span></div>
        {data.best && <div className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}><Trophy size={12} /> Top: {(platformMap[data.best.platform]?.short) || data.best.platform} · Score {fmtNum(data.best.contentScore)}</div>}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {PLATFORMS.map((pf) => {
          const row = data.per[pf.id];
          const hasData = row.count > 0;
          const er = row.erN > 0 ? Math.round(row.erSum / row.erN) : 0;
          const barPct = (row.views / data.maxViews) * 100;
          return (
            <div key={pf.id} className="rounded-xl p-3.5 flex flex-col gap-2.5" style={{ background: hasData ? pf.bg : "var(--surface-2)", border: `1px solid ${hasData ? pf.border : "var(--border)"}`, opacity: hasData ? 1 : 0.55 }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-wide" style={{ color: hasData ? pf.color : "var(--text-dim)" }}>{pf.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: hasData ? "rgba(255,255,255,0.08)" : "transparent", border: "1px solid var(--border)" }}>{row.count} posts</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: pf.color }} />
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <SmallStat label="Views" value={fmtNum(row.views)} />
                <SmallStat label="Score" value={fmtNum(row.score)} color={scoreColor(row.score)} />
                <SmallStat label="ER" value={row.erN ? `${(er / 100).toFixed(2)}%` : "—"} color={engagementColor(er)} />
              </div>
              <div className="flex gap-1.5 flex-wrap text-xs text-dim">
                <span><Eye size={11} className="inline" /> {fmtNum(row.likes)} likes</span>
                <span>· {fmtNum(row.comments)} cmt</span>
                <span>· {fmtNum(row.shares)} share</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SmallStat({ label, value, color }) {
  return (
    <div className="rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="text-xs text-dim">{label}</div>
      <div className="font-bold text-sm" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
