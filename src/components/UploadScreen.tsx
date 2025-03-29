
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, File, X, ArrowRight } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

const UploadScreen: React.FC = () => {
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file: File) => {
    // Check if file is audio or video
    if (!file.type.match('audio.*') && !file.type.match('video.*')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an audio or video file",
      });
      return;
    }
    
    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 50MB",
      });
      return;
    }
    
    setFile(file);
  };
  
  const onButtonClick = () => {
    inputRef.current?.click();
  };
  
  const removeFile = () => {
    setFile(null);
  };
  
  const processFile = () => {
    if (!file) return;
    
    setUploading(true);
    
    // Simulate upload process
    setTimeout(() => {
      // Create URL for uploaded file
      const fileUrl = URL.createObjectURL(file);
      
      // Store URL in localStorage (in a real app, this would be handled differently)
      localStorage.setItem('recordingUrl', fileUrl);
      
      setUploading(false);
      
      toast({
        title: "Upload Complete",
        description: "Your file has been uploaded successfully",
      });
      
      navigate('/analysis');
    }, 2000);
  };
  
  return (
    <div className="w-full max-w-3xl mx-auto p-4 animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
          <CardDescription>
            Upload audio or video files for communication analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] ${
                dragActive ? "border-primary bg-primary/5" : "border-muted"
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                onChange={handleChange}
                accept="audio/*,video/*"
              />
              
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              
              <p className="text-center text-muted-foreground mb-4">
                Drag and drop your audio or video files here, or click to browse
              </p>
              
              <Button onClick={onButtonClick} variant="outline" className="mt-2">
                Select File
              </Button>
              
              <p className="text-xs text-muted-foreground mt-4">
                Supported formats: MP4, WebM, MP3, WAV, M4A (Max 50MB)
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={processFile}
                  disabled={uploading}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white"
                >
                  {uploading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <span>Continue to Analysis</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>Your files are only processed for analysis and not stored permanently</p>
        <p className="mt-1">For best results, use high-quality recordings in quiet environments</p>
      </div>
    </div>
  );
};

export default UploadScreen;
