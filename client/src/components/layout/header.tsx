import { Link, useLocation } from "wouter";
import {
  Building,
  Target,
  FileText,
  ChartLine,
  Bell,
  LogOut,
  User,
  Settings,
  Package,
  FileSpreadsheet,
  GraduationCap,
  Lamp,
  PersonStanding,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Company } from "@shared/schema";

export default function Header() {
  const [location] = useLocation();
  const { user } = useAuth();

  // Fetch company data for current user (includes logo and alias)
  const { data: companyData } = useQuery<Company>({
    queryKey: ["/api/auth/my-company"],
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Fetch admin status for current user
  const { data: adminStatus } = useQuery<{ 
    isGlobalAdmin: boolean;
    isCompanyAdmin: boolean;
    hasAdminAccess: boolean;
  }>({
    queryKey: ["/api/auth/verify-admin-status"],
    enabled: !!user, // Only fetch if user is authenticated
  });

  const navItems = [
    { path: "/accounts", label: "Accounts", icon: Building },
    { path: "/assets", label: "Assets", icon: Package },
    { path: "/quotes", label: "Quotes", icon: FileSpreadsheet },
    { path: "/products", label: "Products", icon: Package },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {companyData?.logoUrl ? (
              <img
                src={companyData.logoUrl}
                alt="Company logo"
                className="max-h-[57.6px] h-auto w-auto object-contain"
                data-testid="img-header-logo"
              />
            ) : (
              <h1
                className="text-xl font-bold text-primary"
                data-testid="text-header-company-name"
              >
                {companyData?.companyAlias ||
                  companyData?.companyOfficialName ||
                  "Low Hanging Fruits"}
              </h1>
            )}
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
            {/* Setup/Settings Link - Only show for Company Admin or Global Admin */}
            {adminStatus?.hasAdminAccess && (
              <>
                {/* Graduation cap / training icon placed to the left of the settings (gear) icon */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Training"
                  aria-label="Training"
                  data-testid="button-training"
                >
                  <GraduationCap className="w-5 h-5" />
                </Button>

                <Link href="/setup">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="button-setup"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
              </>
            )}

            {/* AI Assistant Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full p-0 bg-gradient-to-br from-purple-500 to-pink-500"
                  data-testid="button-ai-assistant-menu"
                >
                  <div className="flex items-center justify-center h-full w-full rounded-full bg-background m-[2px]">
                    <Lamp className="h-4 w-4 text-purple-600" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem asChild>
                  <Link href="/digital-office">
                    <Button
                      variant="ghost"
                      className="w-full justify-start cursor-pointer"
                      data-testid="button-visit-digital-office"
                    >
                      <PersonStanding className="mr-2 h-4 w-4 text-yellow-500" />
                      Visit Digital Office
                    </Button>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    data-testid="button-data-steward"
                  >
                    <PersonStanding className="mr-2 h-4 w-4 text-green-500" />
                    Data Steward
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    data-testid="button-data-analyst"
                  >
                    <PersonStanding className="mr-2 h-4 w-4 text-amber-500" />
                    Data Analyst
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    data-testid="button-sales-assistant"
                  >
                    <PersonStanding className="mr-2 h-4 w-4 text-purple-800" />
                    Sales Assistant
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    data-testid="button-sales-coach"
                  >
                    <PersonStanding className="mr-2 h-4 w-4 text-blue-800" />
                    Sales Coach
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                    data-testid="button-proposal-ninja"
                  >
                    <PersonStanding className="mr-2 h-4 w-4 text-amber-800" />
                    The Proposal Ninja
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  data-testid="button-user-menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.profileImageUrl || ""}
                      alt={user?.firstName || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {user?.firstName?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase() ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p
                      className="text-sm font-medium leading-none"
                      data-testid="text-user-name"
                    >
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email?.split("@")[0] || "User"}
                    </p>
                    <p
                      className="text-xs leading-none text-muted-foreground"
                      data-testid="text-user-email"
                    >
                      {user?.email}
                    </p>
                    <p
                      className="text-xs leading-none text-muted-foreground"
                      data-testid="text-company-name"
                    >
                      {companyData?.companyAlias ||
                        companyData?.companyOfficialName ||
                        "No company"}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start cursor-pointer text-red-600 hover:text-red-700"
                    onClick={() => (window.location.href = "/api/logout")}
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}