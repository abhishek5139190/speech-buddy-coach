
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Mic, Upload } from 'lucide-react';

const HomeOptions: React.FC = () => {
  return (
    <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl animate-slide-up">
      <Card className="card-hover border-2 border-muted hover:border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mic className="h-5 w-5 text-primary" />
            <span>Record Now</span>
          </CardTitle>
          <CardDescription>
            Start a new recording session to analyze your communication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-secondary/30 p-6 flex justify-center items-center">
            <div className="h-16 w-16 rounded-full bg-brand-blue flex items-center justify-center">
              <Mic className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Link to="/record" className="w-full">
            <Button className="w-full button-gradient">
              Start Recording
            </Button>
          </Link>
        </CardFooter>
      </Card>

      <Card className="card-hover border-2 border-muted hover:border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-primary" />
            <span>Upload Media</span>
          </CardTitle>
          <CardDescription>
            Upload existing audio or video for communication analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-secondary/30 p-6 flex justify-center items-center">
            <div className="h-16 w-16 rounded-full bg-brand-blue flex items-center justify-center">
              <Upload className="h-8 w-8 text-white" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Link to="/upload" className="w-full">
            <Button className="w-full button-gradient">
              Upload File
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default HomeOptions;
