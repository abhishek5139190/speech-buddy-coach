
import React, { useState, useEffect } from 'react';
import Auth from '@/components/Auth';
import HomeOptions from '@/components/HomeOptions';
import NavBar from '@/components/NavBar';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

const Index: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Check for existing session from localStorage first for immediate UI update
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
    const storedName = localStorage.getItem('userName') || '';
    
    if (storedAuth) {
      setIsAuthenticated(true);
      setUserName(storedName);
    }

    // Set up authentication state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (session) {
        setIsAuthenticated(true);
        setSession(session);
        // Extract user name from session or use email as fallback
        const name = session.user?.email?.split('@')[0] || 'User';
        setUserName(name);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userName', name);
      } else {
        setIsAuthenticated(false);
        setSession(null);
        setUserName('');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userName');
      }
    });

    // Check for existing session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setSession(session);
        const name = session.user?.email?.split('@')[0] || 'User';
        setUserName(name);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userName', name);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthenticated = () => {
    // This is called after auth component redirects back
    // No need to handle here as onAuthStateChange will catch the session
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // State cleanup will be handled by onAuthStateChange
  };

  return <div className="min-h-screen flex flex-col bg-background">
      <NavBar isAuthenticated={isAuthenticated} onLogout={handleLogout} userName={userName} />
      
      <main className="flex-1 flex flex-col">
        {isAuthenticated ?
      // Home screen with options
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-brand-mediumTeal mb-2">AI Communication Coach</h1>
              <p className="text-base md:text-lg text-muted-foreground">Enhance your speaking skills with AI-powered analysis</p>
            </div>
            <HomeOptions />
          </div> :
      // Landing page with authentication
      <div className="flex-1 hero-gradient">
            <div className="container mx-auto px-4 py-8 md:py-12 flex flex-col items-center md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
              <div className="w-full md:w-1/2 space-y-4 md:space-y-6 text-center md:text-left">
                <h1 className="text-3xl md:text-5xl font-bold text-brand-mediumTeal">
                  Improve Your Communication Skills
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground">
                  Get instant AI-powered feedback on your speeches, interviews, and presentations.
                </p>
                <ul className="space-y-2 text-left mx-auto md:mx-0 max-w-md">
                  {["Grammar and vocabulary analysis", "Filler word detection", "Speech pace and pause optimization", "Body language assessment", "Emotional tone feedback"].map((feature, index) => <li key={index} className="flex items-start space-x-2">
                      <span className="h-5 w-5 rounded-full bg-brand-teal text-brand-darkTeal flex items-center justify-center text-xs mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>)}
                </ul>
              </div>
              
              <div className="w-full md:w-1/2 max-w-md mx-auto">
                <Auth onAuthenticated={handleAuthenticated} />
              </div>
            </div>
          </div>}
      </main>
      
      <footer className="py-4 md:py-6 border-t bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 AI Communication Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>;
};

export default Index;
