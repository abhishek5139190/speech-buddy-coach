
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, User, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';

interface NavBarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  userName?: string;
}

const NavBar: React.FC<NavBarProps> = ({ isAuthenticated, onLogout, userName }) => {
  const isMobile = useIsMobile();
  
  const navContent = (
    <>
      {isAuthenticated ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User size={16} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{userName || 'User'}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLogout}
            className="text-muted-foreground hover:text-destructive whitespace-nowrap"
          >
            <LogOut size={16} className="mr-2" />
            <span>Sign Out</span>
          </Button>
        </div>
      ) : (
        <Link to="/">
          <Button size="sm" variant="outline">Sign In</Button>
        </Link>
      )}
    </>
  );

  return (
    <nav className="w-full py-4 px-4 md:px-6 flex items-center justify-between bg-brand-beige dark:bg-gray-900 shadow-sm">
      <Link to="/" className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-brand-darkTeal text-white flex items-center justify-center font-bold">
          AC
        </div>
        <span className="font-semibold text-lg text-brand-darkTeal dark:text-white">AI Coach</span>
      </Link>
      
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <div className="flex flex-col gap-4 pt-8">
              {navContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        navContent
      )}
    </nav>
  );
};

export default NavBar;
