import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, File as FileIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface FileUploadProps {
  value?: string;
  onChange: (url: string, fileName?: string) => void;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  placeholder?: string;
}

export function FileUpload({ 
  value, 
  onChange, 
  folder = 'files',
  accept = '*/*',
  maxSize = 10,
  placeholder = 'Arrastra un archivo o haz clic'
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState(value || '');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync fileUrl with value prop
  useEffect(() => {
    setFileUrl(value || '');
    if (value) {
      // Extract filename from URL
      const urlParts = value.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      setFileName(decodeURIComponent(lastPart));
    }
  }, [value]);

  const uploadFile = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`El archivo no debe superar ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setFileName(file.name);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4cb2c9d0/storage/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Error al subir el archivo');
      }

      setFileUrl(result.url);
      onChange(result.url, file.name);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(error.message || 'Error al subir el archivo');
      setFileUrl(value || '');
      setFileName('');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleRemove = () => {
    setFileUrl('');
    setFileName('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) {
      return <FileText size={24} className="text-red-500" />;
    }
    return <FileIcon size={24} className="text-neutral-500" />;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {fileUrl && !isUploading ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-lg border-2 border-neutral-200 bg-neutral-50 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getFileIcon(fileName)}
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-neutral-700 truncate">
                  {fileName || 'Archivo subido'}
                </p>
                <a 
                  href={fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:text-blue-600 truncate block"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ver archivo
                </a>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="flex-shrink-0 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative rounded-lg border-2 border-dashed transition-all cursor-pointer p-8
              ${isDragging 
                ? 'border-[#16273F] bg-[#16273F]/5' 
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50'
              }
              ${isUploading ? 'pointer-events-none' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-center">
              {isUploading ? (
                <>
                  <div className="w-12 h-12 border-4 border-[#16273F] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-neutral-600 font-medium">
                    Subiendo archivo...
                  </p>
                  <div className="w-full max-w-[200px] h-2 bg-neutral-200 rounded-full mt-3 overflow-hidden">
                    <motion.div
                      className="h-full bg-[#16273F]"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center mb-3">
                    {isDragging ? (
                      <Upload size={24} className="text-[#16273F]" />
                    ) : (
                      <FileIcon size={24} className="text-neutral-500" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-700 font-medium text-center mb-1">
                    {isDragging 
                      ? 'Suelta el archivo aquí' 
                      : placeholder
                    }
                  </p>
                  <p className="text-xs text-neutral-500 text-center">
                    Máximo {maxSize}MB
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}