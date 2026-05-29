import { Users, QrCode, Settings, LogOut, LayoutDashboard, ClipboardCheck, Scan } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import logoSchool from '../assets/logo.png';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate('/');
  };

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'padres', label: 'Datos de Padres', icon: Users },
    { id: 'asistencia', label: 'Asistencia', icon: ClipboardCheck },
    { id: 'qrs', label: 'QRs Generados', icon: QrCode },
    { id: 'config', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="theme-sidebar">
      <div className="theme-sidebar-header flex items-center gap-3">
        <img
          src={logoSchool}
          alt="APAFA I.E. Jimenez Pimentel"
          className="w-11 h-11 rounded-lg object-contain bg-white/10 p-1 shrink-0"
        />
        <h2 className="theme-sidebar-brand leading-tight">APAFA Control</h2>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`theme-sidebar-nav-item ${
              activeTab === item.id ? 'theme-sidebar-nav-item-active' : ''
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="theme-sidebar-footer">
        <button 
          onClick={() => navigate('/escanear')}
          className="w-full flex items-center gap-3 px-4 py-3 text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
        >
          <Scan size={20} />
          Escáner QR
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
