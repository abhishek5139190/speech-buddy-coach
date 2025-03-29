
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Mic, Upload } from 'lucide-react';

const HomeOptions: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl animate-slide-up">
      <Card className="card-hover border-2 border-muted hover:border-primary/40">
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
            <Mic className="h-5 w-5 text-primary" />
            <span>Record Now</span>
          </CardTitle>
          <CardDescription>
            Start a new recording session
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 md:pb-4">
          <div className="rounded-md bg-brand-pale p-4 md:p-6 flex justify-center items-center">
            <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-brand-blue flex items-center justify-center">
              <Mic className="h-6 w-6 md:h-8 md:w-8 text-white" />
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
        <CardHeader className="pb-2 md:pb-4">
          <CardTitle className="flex items-center space-x-2 text-lg md:text-xl">
            <Upload className="h-5 w-5 text-primary" />
            <span>Upload Media</span>
          </CardTitle>
          <CardDescription>
            Upload audio or video for analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 md:pb-4">
          <div className="rounded-md bg-brand-pale p-4 md:p-6 flex justify-center items-center">
            <div className="h-12 w-12 md:h-16 md:w-16 rounded-full bg-brand-blue flex items-center justify-center">
              <Upload className="h-6 w-6 md:h-8 md:w-8 text-white" />
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
