import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from './Header';
import IssueForm from '../issues/IssueForm';
import IssueList from '../issues/IssueList';
import AuthPage from '../auth/AuthPage';
import MapView from '../map/MapView';
import { Plus, List, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User, Session } from '@supabase/supabase-js';
import { Issue } from '@/integrations/supabase/types';

const AppLayout = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSignOut = () => {
    setUser(null);
    setSession(null);
  };

  const handleIssueSelect = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-civic mx-auto">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Loading CivicFix</h2>
            <p className="text-white/80">Connecting to your community...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return <AuthPage />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header user={user} onSignOut={handleSignOut} />
      
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Menu Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 z-50 md:hidden bg-white shadow-lg"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>

        {/* Left Sidebar */}
        <div className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transition-transform duration-300 ease-in-out
          w-full md:w-96 lg:w-[28rem] xl:w-[32rem] flex-shrink-0
          bg-white border-r border-border 
          flex flex-col absolute md:relative z-40 h-full
          shadow-lg md:shadow-none
        `}>

          <Tabs defaultValue="issues" className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-gradient-card shrink-0">
              <TabsList className="grid w-full grid-cols-2 h-10 bg-muted/50">
                <TabsTrigger value="issues" className="flex items-center gap-2 text-sm">
                  <List className="w-4 h-4" />
                  Issues
                </TabsTrigger>
                <TabsTrigger value="report" className="flex items-center gap-2 text-sm">
                  <Plus className="w-4 h-4" />
                  Report
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 h-0 overflow-y-auto">
              <TabsContent value="issues" className="p-4">
                <IssueList 
                  refreshTrigger={refreshTrigger} 
                  onIssueSelect={handleIssueSelect}
                />
              </TabsContent>
              
              <TabsContent value="report" className="p-4">
                <IssueForm onSuccess={handleSuccess} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Map Area */}
        <div className="flex-1 w-full relative overflow-hidden">
          <MapView 
            selectedIssue={selectedIssue}
            onIssueSelect={handleIssueSelect}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AppLayout;