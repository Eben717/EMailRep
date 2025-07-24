import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Users, 
  FileText, 
  Bot, 
  ChartBar, 
  Mail,
  Settings,
  User
} from "lucide-react";

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Email Templates', href: '/templates', icon: FileText },
  { name: 'Automation', href: '/automation', icon: Bot },
  { name: 'Analytics', href: '/analytics', icon: ChartBar },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mail className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">EmailFlow</h1>
            <p className="text-sm text-slate-500">Client Automation</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}>
                <item.icon size={20} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="text-white" size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">Business Owner</p>
            <p className="text-xs text-slate-500">Your Business</p>
          </div>
          <Settings className="text-slate-400" size={16} />
        </div>
      </div>
    </div>
  );
}
