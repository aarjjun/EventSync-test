
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { LogOut, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">EventSync TocH</h1>
          {profile && (
            <Badge variant={profile.role === 'hod' ? 'default' : 'secondary'}>
              {profile.role.toUpperCase()}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {profile && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span>{profile.name}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
