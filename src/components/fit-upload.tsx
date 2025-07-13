'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, XCircle, FileText, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadFitFile, useCheckFitFileExists } from '@/hooks/use-training-mutations';

interface FitUploadProps {
  trainingId: string;
  onUploadSuccess?: () => void;
}

interface FitUploadResponse {
  success: boolean;
  message: string;
  data?: {
    trackpoints_count: number;
    laps_count: number;
    activity_duration: number;
    activity_distance: number;
    sport: string;
    device?: string;
  };
  error?: string;
}

interface FitStatus {
  fit_processed: boolean;
  trackpoints_count: number;
  laps_count: number;
}

export function FitUpload({ trainingId, onUploadSuccess }: FitUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fitStatus, setFitStatus] = useState<FitStatus | null>(null);
  const [uploadResult, setUploadResult] = useState<FitUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkFitStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/trainings/${trainingId}/fit-upload`);
      if (response.ok) {
        const status: FitStatus = await response.json();
        setFitStatus(status);
      }
    } catch (error) {
      console.error('Error checking FIT status:', error);
    }
  }, [trainingId]);

  // Check FIT processing status on component mount
  useEffect(() => {
    checkFitStatus();
  }, [checkFitStatus]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setError(null);

    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.fit')) {
        throw new Error('Plik musi mieć rozszerzenie .FIT');
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('Plik jest za duży (maksymalnie 50MB)');
      }

      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/trainings/${trainingId}/fit-upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: FitUploadResponse = await response.json();
      setUploadResult(result);

      if (response.ok && result.success) {
        setUploadStatus('success');
        toast.success('Plik .FIT został pomyślnie przetworzony!');
        
        // Update status
        await checkFitStatus();
        
        if (onUploadSuccess) {
          onUploadSuccess();
        }
      } else {
        setUploadStatus('error');
        setError(result.error || 'Nieznany błąd');
        toast.error(`Błąd: ${result.error || 'Nieznany błąd'}`);
      }
    } catch (error) {
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      setError(errorMessage);
      toast.error(`Błąd: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
return `${minutes}m`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    
return `${km.toFixed(1)} km`;
  };

  // If FIT is already processed, show status
  if (fitStatus?.fit_processed) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Dane .FIT przetworzono
          </CardTitle>
          <CardDescription>
            Plik .FIT został już przetworzony dla tego treningu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>Punkty GPS: {fitStatus.trackpoints_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <span>Segmenty: {fitStatus.laps_count}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload pliku .FIT
        </CardTitle>
        <CardDescription>
          Prześlij plik .FIT aby uzyskać szczegółowe dane GPS, tętno i inne metryki
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".fit"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {uploadStatus === 'idle' && (
          <Button onClick={handleUploadClick} className="w-full" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Wybierz plik .FIT
          </Button>
        )}

        {uploadStatus === 'uploading' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm">Przetwarzanie pliku...</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {uploadStatus === 'success' && uploadResult?.data && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-medium">Plik został pomyślnie przetworzony!</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Punkty GPS: {uploadResult.data.trackpoints_count.toLocaleString()}</div>
                  <div>Segmenty: {uploadResult.data.laps_count}</div>
                  <div>Czas: {formatDuration(uploadResult.data.activity_duration)}</div>
                  <div>Dystans: {formatDistance(uploadResult.data.activity_distance)}</div>
                  {uploadResult.data.device && (
                    <div className="col-span-2">Urządzenie: {uploadResult.data.device}</div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === 'error' && error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-medium">Wystąpił błąd:</p>
                <p className="text-sm">{error}</p>
                <Button 
                  onClick={() => setUploadStatus('idle')} 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                >
                  Spróbuj ponownie
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 