import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Chrome } from 'lucide-react';

const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-civic border-0 bg-gradient-card">
          <CardHeader className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-civic">
              <MapPin className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                CivicFix
              </CardTitle>
              <CardDescription className="text-lg">
                Report community issues and make your neighborhood better
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              onClick={handleGoogleSignIn}
              className="w-full h-12 shadow-civic bg-white text-gray-700 hover:bg-gray-50 border border-gray-200" 
              disabled={loading}
            >
              <Chrome className="w-5 h-5 mr-3" />
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
            
            <div className="text-center space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-sm text-muted-foreground">Secure & Fast</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Report Issues</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground">Track Progress</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground">Help Community</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                By signing in, you're joining a community dedicated to improving local neighborhoods. 
                Your reports help local government prioritize and address community issues effectively.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;