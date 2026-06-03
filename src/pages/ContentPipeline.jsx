import React from 'react';
import { useContent } from '../hooks/useContent';
import { KanbanSquare, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PIPELINE_STAGES = [
  { id: 'script', label: 'Scripting' },
  { id: 'recording', label: 'Recording' },
  { id: 'editing', label: 'Editing' },
  { id: 'review', label: 'Review' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' }
];

export default function ContentPipeline() {
  const { contents, updateContent, isLoading } = useContent();

  const pipelineContents = contents.filter(c => PIPELINE_STAGES.some(stage => stage.id === c.status));

  const handleMove = async (contentId, newStatus) => {
    await updateContent(contentId, { status: newStatus });
  };

  if (isLoading) return <div className="p-8 text-center text-dim">Loading pipeline...</div>;

  return (
    <div className="animate-in h-full flex flex-col pb-10">
      <div className="page-header shrink-0">
        <h1 className="heading-xl gradient-text flex items-center gap-2"><KanbanSquare size={28} /> Content Pipeline</h1>
        <p className="page-subtitle">Track your content production workflow</p>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full min-w-max px-1">
          {PIPELINE_STAGES.map(stage => {
            const items = pipelineContents.filter(c => c.status === stage.id);
            return (
              <div key={stage.id} className="w-72 flex flex-col h-full bg-surface/30 rounded-2xl border border-subtle">
                <div className="p-4 border-b border-subtle flex-between shrink-0">
                  <h3 className="font-bold text-sm uppercase tracking-wider">{stage.label}</h3>
                  <span className="badge badge-ghost">{items.length}</span>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
                  {items.map(item => {
                    const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === item.status);
                    const nextStage = PIPELINE_STAGES[currentIndex + 1];
                    const prevStage = PIPELINE_STAGES[currentIndex - 1];

                    return (
                      <motion.div 
                        key={item.id}
                        layoutId={item.id}
                        className="glass-card p-3 shadow-sm"
                      >
                        <h4 className="font-semibold text-sm mb-2">{item.title}</h4>
                        <div className="flex-between items-center mt-4">
                          <span className="text-xxs px-2 py-1 bg-surface rounded text-dim">{item.platform || 'Any'}</span>
                          <div className="flex gap-1">
                            {prevStage && (
                              <button 
                                className="btn-icon xs text-dim hover:text-primary" 
                                onClick={() => handleMove(item.id, prevStage.id)}
                                title={`Move to ${prevStage.label}`}
                              >
                                <ChevronRight size={14} className="rotate-180" />
                              </button>
                            )}
                            {nextStage ? (
                              <button 
                                className="btn-icon xs text-dim hover:text-primary" 
                                onClick={() => handleMove(item.id, nextStage.id)}
                                title={`Move to ${nextStage.label}`}
                              >
                                <ChevronRight size={14} />
                              </button>
                            ) : (
                              <span className="text-success"><ChevronRight size={14} /></span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-dim text-xs italic opacity-50">
                      No items
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
