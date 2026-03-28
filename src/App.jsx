import React, { useState, useEffect } from 'react';
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
    addActivity,
    isLoading: isLoadingSpools
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
            onUpdateSpool={updateSpool}
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
      <div className="loading-screen">
        <div className="loading-glow-1" />
        <div className="loading-glow-2" />

        <div className="loading-center">
          <div className="loading-logo-wrapper">
            <div className="loading-ring" />
            <div className="loading-logo-box">
              <div className="loading-logo-gradient" />
              <img src="/logo.png" alt="GOO-Studio" className="loading-logo-img" />
              <div className="loading-logo-pulse" />
            </div>
            <div className="loading-particle" />
          </div>

          <div className="loading-info">
            <h2 className="loading-title gradient-text">GOO-STUDIO</h2>
            <div className="loading-dots">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
            <p className="loading-message">{getLoadingMessage()}</p>
            <p className="loading-tip">
              Tip: Render servers take a moment to wake up from hibernation.
            </p>
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
