import { Link, useLocation } from "wouter";
import { Building, Target, ChartLine, Bell } from "lucide-react";

export default function Header() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: ChartLine },
    { path: "/accounts", label: "Accounts", icon: Building },
    { path: "/opportunities", label: "Opportunities", icon: Target },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-primary">OpportunityTracker</h1>
            <nav className="hidden md:flex space-x-6">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  href={path}
                  className={`px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-2 ${
                    location === path
                      ? "text-primary bg-primary/10 rounded-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${label.toLowerCase()}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              JD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
