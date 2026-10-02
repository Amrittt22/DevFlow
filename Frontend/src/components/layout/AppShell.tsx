import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CommandPalette } from '../CommandPalette';
import { Toasts } from '../Toasts';
import { NewTaskModal } from '../NewTaskModal';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  // Global shortcuts: ⌘K/Ctrl+K opens the command palette, ⌘N/Ctrl+N a new task.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setNewTaskOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} onNewTask={() => setNewTaskOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNewTask={() => {
          setPaletteOpen(false);
          setNewTaskOpen(true);
        }}
      />
      <NewTaskModal open={newTaskOpen} onClose={() => setNewTaskOpen(false)} />
      <Toasts />
    </div>
  );
}
