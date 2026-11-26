import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { DemoControlsDrawer } from '../demo/DemoControlsDrawer';

export const AppShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#263445] flex flex-col antialiased">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Layout (Offset for lg fixed sidebar) */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Navigation Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Dev-only cross-portal simulation drawer */}
      <DemoControlsDrawer />
    </div>
  );
};
