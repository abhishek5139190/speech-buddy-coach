
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { LogOut, User } from 'lucide-react';

interface NavBarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  userName?: string;
}

const NavBar: React.FC<NavBarProps> = ({ isAuthenticated, onLogout, userName }) => {
  return (
    <nav className="w-full py-4 px-6 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm">
      <Link to="/" className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold">
          AC
        </div>
        <span className="font-semibold text-lg text-brand-blue dark:text-white">AI Communication Coach</span>
      </Link>
      
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <div className="hidden md:flex items-center gap-2">
              <User size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{userName || 'User'}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut size={16} className="mr-2" />
              <span>Sign Out</span>
            </Button>
          </>
        ) : (
          <Link to="/">
            <Button size="sm" variant="outline">Sign In</Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
