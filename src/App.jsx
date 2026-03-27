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
import SpoolInventory from './pages/SpoolInventory';
import Settings from './pages/Settings';
import SpoolDetail from './pages/SpoolDetail';
import FileManager from './pages/FileManager';
import Login from './pages/Login';

export default function App() {
  const { data: session, isPending } = useSession();
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedSpoolId, setSelectedSpoolId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [fileImportData, setFileImportData] = useState(null);
  
  const fileManager = useFileManager();

  const { 
    spools, settings, activity, stats: spoolStats, 
    addSpool, updateSpool, deleteSpool, adjustWeight, 
    updateSettings, resetAll, exportData, importData,
    addActivity 
  } = useSpools();

  const {
    projects, batches, suggestedGroups, stats: projectStats,
    addProject, updateProject, deleteProject,
    addPart, updatePart, deletePart,
    createBatch, completeBatch
  } = useProjects();

  // Common props for sidebar/bottomnav
  const navProps = {
    currentPage,
    onNavigate: (page) => {
      setCurrentPage(page);
      setSelectedSpoolId(null);
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
      case 'filament':
        return (
          <SpoolInventory 
            spools={spools} 
            onAdd={async (spool) => {
              const newSpool = await addSpool(spool);
              if (newSpool) {
                setSelectedSpoolId(newSpool.id);
                setCurrentPage('spool-detail');
              }
            }}
            onViewDetail={(id) => {
              setSelectedSpoolId(id);
              setCurrentPage('spool-detail');
            }}
          />
        );
      case 'spool-detail':
        const spool = spools.find(s => s.id === selectedSpoolId);
        return spool ? (
          <SpoolDetail 
            spool={spool} 
            onUpdate={updateSpool} 
            onDelete={(id) => {
              deleteSpool(id);
              setCurrentPage('filament');
            }}
            onAdjustWeight={adjustWeight}
            onBack={() => setCurrentPage('filament')} 
          />
        ) : <SpoolInventory spools={spools} onAdd={addSpool} />;
      case 'settings':
        return (
          <Settings 
            settings={settings} 
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

  // Determine activePage for nav highlight
  const activePage = (currentPage === 'spool-detail') ? 'filament' : 
                    (currentPage === 'project-detail') ? 'projects' : 
                    currentPage;

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--color-primary),0.3)] animate-pulse">
            <span className="text-3xl font-bold text-primary">G</span>
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
