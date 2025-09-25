import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, FileText, Mail } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6">
            OpportunityTracker
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto">
            A comprehensive CRM system for managing accounts, sales opportunities, and customer cases with ease.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="text-lg px-8 py-4"
            data-testid="button-login"
          >
            Sign In to Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Building className="w-12 h-12 mx-auto mb-4 text-blue-600" />
              <CardTitle>Account Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Organize and manage your client accounts with detailed company information and industry tracking.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto mb-4 text-green-600" />
              <CardTitle>Sales Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track sales opportunities with revenue forecasting, close dates, and advanced lookup relationships.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="w-12 h-12 mx-auto mb-4 text-orange-600" />
              <CardTitle>Case Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Handle customer support cases with detailed tracking and communication history.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Mail className="w-12 h-12 mx-auto mb-4 text-purple-600" />
              <CardTitle>Email Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Send emails directly from case records with integrated communication tracking.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
            Why Choose OpportunityTracker?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-semibold mb-3">Enterprise-Grade Features</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Sophisticated lookup relationships, comprehensive CRUD operations, and advanced search capabilities.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">Seamless Integration</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Built-in email functionality and secure authentication with multiple login options.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3">User-Friendly Design</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Clean, modern interface with intuitive navigation and responsive design for all devices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}