
import React, { useState, useEffect } from 'react';
import Auth from '@/components/Auth';
import HomeOptions from '@/components/HomeOptions';
import NavBar from '@/components/NavBar';

const Index: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    const name = localStorage.getItem('userName') || '';
    
    setIsAuthenticated(authStatus);
    setUserName(name);
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    const name = localStorage.getItem('userName') || '';
    setUserName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUserName('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar 
        isAuthenticated={isAuthenticated} 
        onLogout={handleLogout}
        userName={userName}
      />
      
      <main className="flex-1 flex flex-col">
        {isAuthenticated ? (
          // Home screen with options
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-brand-blue mb-2">AI Communication Coach</h1>
              <p className="text-lg text-muted-foreground">Enhance your speaking skills with AI-powered analysis</p>
            </div>
            <HomeOptions />
          </div>
        ) : (
          // Landing page with authentication
          <div className="flex-1 hero-gradient">
            <div className="container mx-auto px-4 py-12 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2 space-y-6 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-brand-blue">
                  Improve Your Communication Skills
                </h1>
                <p className="text-xl text-muted-foreground">
                  Get instant AI-powered feedback on your speeches, interviews, and presentations.
                </p>
                <ul className="space-y-2 text-left mx-auto md:mx-0 max-w-md">
                  {[
                    "Grammar and vocabulary analysis",
                    "Filler word detection",
                    "Speech pace and pause optimization",
                    "Body language assessment",
                    "Emotional tone feedback"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="h-5 w-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="md:w-1/2 max-w-md mx-auto">
                <Auth onAuthenticated={handleAuthenticated} />
              </div>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-6 border-t bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2023 AI Communication Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
