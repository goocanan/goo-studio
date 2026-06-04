import React, { useState } from 'react';
import { useContent } from '../hooks/useContent';
import { useProjects } from '../hooks/useProjects';
import { KanbanSquare, Calendar, Link as LinkIcon, Plus, Video, PlaySquare, Instagram, Facebook, MessageCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PIPELINE_STAGES = [
  { id: 'idea', label: 'Idea', emoji: '💡' },
  { id: 'script', label: 'Script', emoji: '📝' },
  { id: 'recording', label: 'Recording', emoji: '🎬' },
  { id: 'editing', label: 'Editing', emoji: '✂️' },
  { id: 'review', label: 'Review', emoji: '👀' },
  { id: 'scheduled', label: 'Scheduled', emoji: '📅' },
  { id: 'published', label: 'Published', emoji: '🚀' }
];

const STAGE_COLORS = {
  idea: 'var(--accent-amber)',
  script: 'var(--accent-primary)',
  recording: 'var(--accent-error)',
  editing: 'var(--accent-cyan)',
  review: 'var(--accent-amber)',
  scheduled: 'var(--accent-emerald)',
  published: 'var(--accent-emerald)',
};

const PRIORITY_CONFIG = {
  high: { label: 'High', dot: '🔴' },
  medium: { label: 'Med', dot: '🟡' },
  low: { label: 'Low', dot: '🟢' },
};

const PLATFORM_ICON = {
  YouTube: Video,
  TikTok: PlaySquare,
  Instagram: Instagram,
  Facebook: Facebook,
  Threads: MessageCircle,
};

export default function ContentPipeline() {
  const { contents, updateContent, createContent, isLoading } = useContent();
  const { projects } = useProjects();
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPlatform, setQuickPlatform] = useState('YouTube');

  const pipelineContents = contents.filter(c => PIPELINE_STAGES.some(stage => stage.id === c.status));

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    // Only clear if we're leaving the column entirely
    const relatedTarget = e.relatedTarget;
    if (!e.currentTarget.contains(relatedTarget)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    setDragOverStage(null);
    if (!draggedItem || draggedItem.status === targetStageId) return;
    await updateContent(draggedItem.id, { status: targetStageId });
    setDraggedItem(null);
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await createContent({ 
      title: quickTitle, 
      platform: quickPlatform, 
      status: 'idea',
      priority: 'medium'
    });
    setQuickTitle('');
    setShowQuickAdd(false);
  };

  // Summary stats
  const totalInPipeline = pipelineContents.length;
  const overdueCount = pipelineContents.filter(c => c.scheduledAt && new Date(c.scheduledAt).getTime() < Date.now() && c.status !== 'published').length;

  if (isLoading) return <div className="p-8 text-center text-dim">Loading pipeline...</div>;

  return (
    <div className="animate-in h-full flex flex-col pb-10">
      <div className="page-header shrink-0 flex-between">
        <div>
          <h1 className="heading-xl gradient-text flex items-center gap-2"><KanbanSquare size={28} /> Content Pipeline</h1>
          <p className="page-subtitle">
            Track your content production workflow via Drag & Drop 
            <span className="ml-2 text-xxs badge badge-ghost">{totalInPipeline} items</span>
            {overdueCount > 0 && (
              <span className="ml-2 text-xxs badge badge-error">
                <AlertTriangle size={10} /> {overdueCount} overdue
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-primary shadow-glow" onClick={() => setShowQuickAdd(!showQuickAdd)}>
          <Plus size={18} /> New Content
        </button>
      </div>

      {/* Quick Add Form */}
      <AnimatePresence>
        {showQuickAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleQuickAdd} className="glass-card p-4 mb-4 flex flex-wrap gap-3 items-end">
              <div className="form-group flex-1 min-w-[200px]" style={{ marginBottom: 0 }}>
                <label className="form-label text-xs">Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Content title..." 
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label text-xs">Platform</label>
                <select className="form-input" value={quickPlatform} onChange={e => setQuickPlatform(e.target.value)}>
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Threads">Threads</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary btn-sm">Add to Idea</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowQuickAdd(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-max px-1">
          {PIPELINE_STAGES.map(stage => {
            const items = pipelineContents.filter(c => c.status === stage.id);
            const isDropTarget = dragOverStage === stage.id && draggedItem?.status !== stage.id;
            const stageColor = STAGE_COLORS[stage.id];
            
            return (
              <div 
                key={stage.id} 
                className="w-72 flex flex-col h-full rounded-2xl border transition-all duration-200"
                style={{
                  background: isDropTarget 
                    ? `color-mix(in srgb, ${stageColor} 8%, var(--color-surface) 92%)` 
                    : 'var(--color-surface-glass)',
                  borderColor: isDropTarget ? stageColor : 'var(--color-border-subtle)',
                  boxShadow: isDropTarget ? `0 0 20px ${stageColor}33, inset 0 0 20px ${stageColor}0a` : 'none',
                }}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-4 border-b border-subtle flex-between shrink-0">
                  <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <span>{stage.emoji}</span> {stage.label}
                  </h3>
                  <span className="badge badge-ghost text-xs">{items.length}</span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
                  {items.map(item => {
                    const linkedProject = projects.find(p => p.id === item.projectId);
                    const isOverdue = item.scheduledAt && new Date(item.scheduledAt).getTime() < Date.now() && item.status !== 'published';
                    const isDueSoon = item.scheduledAt && !isOverdue && (new Date(item.scheduledAt).getTime() - Date.now()) < 86400000 * 2;
                    const priorityCfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.medium;
                    const PlatIcon = PLATFORM_ICON[item.platform];

                    return (
                      <motion.div 
                        key={item.id}
                        layoutId={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                        className="glass-card p-3 shadow-sm cursor-grab active:cursor-grabbing border-l-3 transition-all hover:shadow-md"
                        style={{ borderLeftColor: stageColor, borderLeftWidth: '3px' }}
                      >
                        <div className="flex-between items-start mb-1">
                          <h4 className="font-semibold text-sm leading-snug flex-1 pr-2">{item.title}</h4>
                          <span className="text-xxs shrink-0">{priorityCfg.dot}</span>
                        </div>
                        
                        {linkedProject && (
                          <div className="flex items-center gap-1 text-xxs text-primary mb-2 line-clamp-1 bg-primary/5 rounded px-1.5 py-0.5 w-fit">
                            <LinkIcon size={9} /> {linkedProject.name}
                          </div>
                        )}

                        {/* Due date / Overdue */}
                        {item.scheduledAt && (
                          <div className={`flex items-center gap-1 text-xxs mb-2 rounded px-1.5 py-0.5 w-fit ${
                            isOverdue 
                              ? 'text-error font-bold bg-error/10' 
                              : isDueSoon 
                                ? 'text-warning font-semibold bg-warning/10' 
                                : 'text-dim bg-surface/50'
                          }`}>
                            {isOverdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
                            {isOverdue ? 'Overdue: ' : isDueSoon ? 'Soon: ' : 'Due: '}
                            {new Date(item.scheduledAt).toLocaleDateString()}
                          </div>
                        )}

                        <div className="flex-between items-center mt-2 pt-2 border-t border-subtle">
                          <div className="flex items-center gap-1.5">
                            {PlatIcon && (
                              <span className="text-xxs px-2 py-0.5 bg-surface rounded text-dim flex items-center gap-1">
                                <PlatIcon size={10} /> {item.platform}
                              </span>
                            )}
                            {!PlatIcon && item.platform && (
                              <span className="text-xxs px-2 py-0.5 bg-surface rounded text-dim">{item.platform}</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {items.length === 0 && (
                    <div 
                      className="h-24 flex flex-col items-center justify-center text-dim text-xs italic border-2 border-dashed rounded-xl m-2 transition-all duration-200"
                      style={{ 
                        borderColor: isDropTarget ? stageColor : 'var(--color-border-subtle)',
                        opacity: isDropTarget ? 1 : 0.5
                      }}
                    >
                      <span className="text-lg mb-1">{stage.emoji}</span>
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
