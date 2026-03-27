import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';
import { useSpools } from './hooks/useSpools';
import { useProjects } from './hooks/useProjects';
import { useFileManager } from './hooks/useFileManager';
import { useSession } from './lib/auth-client';

// Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import AddProject from './pages/AddProject';
import Batching from './pages/Batching';
import Settings from './pages/Settings';
import FileManager from './pages/FileManager';
import { useEffect, useState } from 'react';

export default function App() {
  const { data: session, isPending } = useSession();
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [fileImportData, setFileImportData] = useState(null);
  
  const fileManager = useFileManager();

  const { 
    spools, settings, activity, stats: spoolStats, 
    addSpool, deleteSpool,
    updateSettings, resetAll, exportData, importData,
    addActivity 
  } = useSpools();

  const {
    projects, batches, suggestedGroups, stats: projectStats,
    addProject, updateProject, deleteProject,
    addPart, updatePart, deletePart,
    createBatch, completeBatch,
    isLoading: isLoadingProjects
  } = useProjects();

  const isLoading = isPending || isLoadingProjects || isLoadingSpools;
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % 4);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isLoading]);

  const getLoadingMessage = () => {
    const messages = [
      "Awakening our servers...",
      "Connecting to Supabase...",
      "Retrieving your 3D Projects...",
      "Almost there, finalizing GOO-Studio..."
    ];
    return messages[loadingStep];
  };

  const navProps = {
    currentPage,
    onNavigate: (page) => {
      setCurrentPage(page);
      if (page !== 'add-project') setFileImportData(null);
    }
  };

  const handleImportProject = (data) => {
    setFileImportData(data);
    setCurrentPage('add-project');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            spoolStats={spoolStats} 
            projectStats={projectStats}
            activity={activity} 
            onNavigate={navProps.onNavigate}
          />
        );
      case 'projects':
        return (
          <Projects 
            projects={projects}
            onAddProject={() => setCurrentPage('add-project')}
            onViewDetail={(id) => {
              setSelectedProjectId(id);
              setCurrentPage('project-detail');
            }}
          />
        );
      case 'add-project':
        return (
          <AddProject 
            initialData={fileImportData}
            onAdd={async (newProj) => {
              const proj = await addProject(newProj);
              if (proj) {
                setSelectedProjectId(proj.id);
                setCurrentPage('project-detail');
              }
            }}
            onBack={() => setCurrentPage('projects')}
          />
        );
      case 'project-detail':
        const project = projects.find(p => p.id === selectedProjectId);
        return project ? (
          <ProjectDetail 
            project={project}
            onUpdate={updateProject}
            onDelete={deleteProject}
            onAddPart={addPart}
            onUpdatePart={updatePart}
            onDeletePart={deletePart}
            onBack={() => setCurrentPage('projects')}
            getFileData={fileManager.getFileData}
          />
        ) : <Projects projects={projects} onAddProject={() => setCurrentPage('add-project')} onViewDetail={(id) => { setSelectedProjectId(id); setCurrentPage('project-detail'); }} />;
      case 'batching':
        return (
          <Batching 
            suggestedGroups={suggestedGroups}
            batches={batches}
            spools={spools}
            createBatch={createBatch}
            completeBatch={completeBatch}
            onNavigate={navProps.onNavigate}
          />
        );
      case 'files':
        return (
          <FileManager 
            fileManager={fileManager}
            onImportProject={handleImportProject} 
          />
        );
      case 'settings':
        return (
          <Settings 
            settings={settings} 
            spools={spools}
            onAddSpool={addSpool}
            onDeleteSpool={deleteSpool}
            onUpdateSettings={updateSettings}
            onResetAll={resetAll}
            onExportData={exportData}
            onImportData={importData}
          />
        );
      default:
        return <Dashboard spoolStats={spoolStats} projectStats={projectStats} activity={activity} onNavigate={navProps.onNavigate} />;
    }
  };

  const activePage = (currentPage === 'project-detail') ? 'projects' : 
                    currentPage;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-void relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <div className="relative mb-12">
            {/* Outer Rotating Ring */}
            <div className="absolute -inset-4 border-2 border-dashed border-primary/20 rounded-full animate-spin-slow" />
            
            {/* Logo Container */}
            <div className="w-24 h-24 bg-surface border border-white/10 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.15)] relative z-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-cyan/10" />
              <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain relative z-20" />
              
              {/* Internal Pulse */}
              <div className="absolute inset-0 bg-primary/20 animate-pulse" />
            </div>

            {/* Orbiting particles */}
            <div className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_var(--accent-primary)] animate-ping" />
          </div>

          <div className="flex flex-col items-center gap-4">
            <h2 className="heading-md gradient-text text-center tracking-tight">GOO-STUDIO</h2>
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div 
                    key={i} 
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" 
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-xs text-dim font-medium uppercase tracking-[0.2em] mt-2 opacity-70">
                {getLoadingMessage()}
              </p>
              <p className="text-[10px] text-muted max-w-[200px] text-center mt-4">
                Tip: Render servers take a moment to wake up from hibernation.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar activePage={activePage} onNavigate={navProps.onNavigate} />
      <main className="main-content">
        {renderPage()}
      </main>
      <BottomNav activePage={activePage} onNavigate={navProps.onNavigate} />
    </div>
  );
}
