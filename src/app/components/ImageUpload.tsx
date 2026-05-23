import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: string;
  maxSize?: number; // in MB
}

export function ImageUpload({ 
  value, 
  onChange, 
  folder = 'covers',
  aspectRatio = '16/9',
  maxSize = 10 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync previewUrl with value prop
  useEffect(() => {
    setPreviewUrl(value || '');
  }, [value]);

  const uploadImage = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`El archivo no debe superar ${maxSize}MB`);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      alert('Tipo de archivo no válido. Use JPG, PNG, WEBP, GIF o AVIF');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
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
        throw new Error(result.error || 'Error al subir la imagen');
      }

      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
      
      setPreviewUrl(result.url);
      onChange(result.url);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Error al subir la imagen');
      setPreviewUrl(value || '');
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
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
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
      uploadImage(file);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {previewUrl && !isUploading ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative rounded-lg overflow-hidden border-2 border-neutral-200 bg-neutral-50"
            style={{ aspectRatio }}
          >
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X size={16} />
            </button>
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
              relative rounded-lg border-2 border-dashed transition-all cursor-pointer
              ${isDragging 
                ? 'border-[#16273F] bg-[#16273F]/5' 
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50'
              }
              ${isUploading ? 'pointer-events-none' : ''}
            `}
            style={{ aspectRatio }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              {isUploading ? (
                <>
                  <div className="w-12 h-12 border-4 border-[#16273F] border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-neutral-600 font-medium">
                    Subiendo imagen...
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
                      <ImageIcon size={24} className="text-neutral-500" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-700 font-medium text-center mb-1">
                    {isDragging 
                      ? 'Suelta la imagen aquí' 
                      : 'Arrastra una imagen o haz clic'
                    }
                  </p>
                  <p className="text-xs text-neutral-500 text-center">
                    JPG, PNG, WEBP, GIF o AVIF (máx. {maxSize}MB)
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