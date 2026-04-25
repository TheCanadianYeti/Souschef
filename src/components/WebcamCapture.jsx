import React, { useRef, useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';

export default function WebcamCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mediaStream = null;
    
    async function startCamera() {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access the camera. Please ensure you have granted permissions.');
      }
    }
    startCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          onCapture(file);
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const handleCancel = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 text-white absolute top-0 w-full z-10 bg-gradient-to-b from-black/50 to-transparent">
          <span className="font-medium drop-shadow-md">Take Photo</span>
          <button onClick={handleCancel} className="p-2 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
            <X size={24} />
          </button>
        </div>
        
        {error ? (
          <div className="p-8 text-center text-red-400 min-h-[400px] flex items-center justify-center">
            <p>{error}</p>
          </div>
        ) : (
          <div className="relative aspect-[3/4] sm:aspect-video w-full bg-black flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
        
        <div className="p-6 flex justify-center bg-gray-900">
          <button 
            onClick={takePhoto}
            disabled={!!error}
            className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-50 group"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center group-hover:scale-95 transition-transform">
              <Camera size={28} className="text-gray-900" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
