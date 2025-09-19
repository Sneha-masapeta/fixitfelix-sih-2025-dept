import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPin, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
  onSignOut: () => void;
}

const Header = ({ user, onSignOut }: HeaderProps) => {
  const [userProfile, setUserProfile] = useState<{ name: string | null } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Error fetching user profile:', error.message);
          // Use user metadata as fallback
          setUserProfile({ 
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
          });
        } else {
          setUserProfile(data);
        }
      } catch (error: any) {
        console.error('Error fetching user profile:', error.message);
        setUserProfile({ 
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
        });
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
      toast({
        title: "Signed out successfully",
        description: "Thank you for using CivicFix!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  const displayName = userProfile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'User';

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50 shadow-sm">
  <div className="px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-civic">
        <MapPin className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          CivicFix
        </h1>
        <p className="text-xs text-muted-foreground">Improving Communities Together</p>
      </div>
    </div>

    {user && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:shadow-civic transition-shadow">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarImage 
                src={getUserAvatar()} 
                alt={displayName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-primary text-white text-sm font-medium">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={getUserAvatar()} 
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-primary text-white text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <span className="ml-auto text-xs text-muted-foreground">Soon</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )}
  </div>
</header>

  );
};

export default Header;