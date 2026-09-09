'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  X, 
  Check, 
  RotateCcw, 
  AlertCircle, 
  RotateCw, 
  Crop, 
  Maximize2 
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

interface CropBox {
  x: number; // percentage 0 to 100
  y: number; // percentage 0 to 100
  width: number; // percentage 0 to 100
  height: number; // percentage 0 to 100
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  // Capture & Editing State
  const [rawCapturedUrl, setRawCapturedUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [cropBox, setCropBox] = useState<CropBox>({ x: 5, y: 5, width: 90, height: 90 });
  
  // Drag / Resize State
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ 
    clientX: number; 
    clientY: number; 
    box: CropBox;
    containerWidth: number;
    containerHeight: number;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isCapturingFlash, setIsCapturingFlash] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Stop active media stream
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
  }, [stream]);

  // Enumerate cameras
  const getCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setCameras(videoDevices);
    } catch {
      // Ignore device enumeration errors
    }
  };

  // Start video stream
  const startCamera = useCallback(async () => {
    setError(null);
    setIsInitializing(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Perangkat / browser Anda tidak mendukung akses kamera langsung.');
      setIsInitializing(false);
      return;
    }

    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: selectedCameraId
          ? { deviceId: { exact: selectedCameraId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      await getCameraDevices();
    } catch (err: any) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Akses kamera ditolak. Berikan izin akses kamera pada browser Anda.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('Kamera tidak ditemukan pada perangkat Anda.');
      } else {
        setError(err.message || 'Gagal menyalakan kamera. Coba ganti pengaturan atau izinkan kamera.');
      }
    } finally {
      setIsInitializing(false);
    }
  }, [facingMode, selectedCameraId]);

  // Handle open/close
  useEffect(() => {
    if (isOpen) {
      setRawCapturedUrl(null);
      setRotation(0);
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
      startCamera();
    } else {
      stopStream();
      setRawCapturedUrl(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Toggle camera mode
  const toggleFacingMode = () => {
    setSelectedCameraId('');
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Switch camera device
  const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCameraId(e.target.value);
  };

  // Retake photo
  const handleRetake = () => {
    setRawCapturedUrl(null);
    setRotation(0);
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
    startCamera();
  };

  // Take snapshot
  const takePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flash visual
    setIsCapturingFlash(true);
    setTimeout(() => setIsCapturingFlash(false), 200);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Stop video track to save battery/bandwidth while editing
    stopStream();

    setRawCapturedUrl(dataUrl);
    setRotation(0);
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
  };

  // Rotate image by 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    // Reset crop box on rotation
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
  };

  // Reset crop to full frame
  const handleResetCrop = () => {
    setCropBox({ x: 0, y: 0, width: 100, height: 100 });
  };

  // -------------------------------------------------------------
  // Pointer/Touch Drag and Resize Handling for Crop Box
  // -------------------------------------------------------------
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    setActiveHandle(handle);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox },
      containerWidth: rect.width,
      containerHeight: rect.height,
    };

    // Capture pointer to track outside window
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStartRef.current) return;

    e.preventDefault();
    const { clientX, clientY, box, containerWidth, containerHeight } = dragStartRef.current;
    const dx = ((e.clientX - clientX) / containerWidth) * 100;
    const dy = ((e.clientY - clientY) / containerHeight) * 100;

    const minSize = 10; // minimum percentage size

    let newX = box.x;
    let newY = box.y;
    let newWidth = box.width;
    let newHeight = box.height;

    if (activeHandle === 'move') {
      newX = Math.max(0, Math.min(100 - box.width, box.x + dx));
      newY = Math.max(0, Math.min(100 - box.height, box.y + dy));
    } else {
      // Resize handles
      if (activeHandle.includes('left')) {
        const potentialX = Math.min(box.x + dx, box.x + box.width - minSize);
        const clampedX = Math.max(0, potentialX);
        newWidth = box.width + (box.x - clampedX);
        newX = clampedX;
      }
      if (activeHandle.includes('right')) {
        const potentialWidth = box.width + dx;
        newWidth = Math.max(minSize, Math.min(100 - box.x, potentialWidth));
      }
      if (activeHandle.includes('top')) {
        const potentialY = Math.min(box.y + dy, box.y + box.height - minSize);
        const clampedY = Math.max(0, potentialY);
        newHeight = box.height + (box.y - clampedY);
        newY = clampedY;
      }
      if (activeHandle.includes('bottom')) {
        const potentialHeight = box.height + dy;
        newHeight = Math.max(minSize, Math.min(100 - box.y, potentialHeight));
      }
    }

    setCropBox({
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      width: Math.round(newWidth * 10) / 10,
      height: Math.round(newHeight * 10) / 10,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture release fails
      }
      setActiveHandle(null);
      dragStartRef.current = null;
    }
  };

  // -------------------------------------------------------------
  // Process Crop and Export Final Image
  // -------------------------------------------------------------
  const handleConfirmCrop = async () => {
    if (!rawCapturedUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = rawCapturedUrl;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Create intermediate rotated canvas if rotated
    const origWidth = img.naturalWidth;
    const origHeight = img.naturalHeight;

    const rotCanvas = document.createElement('canvas');
    const rotCtx = rotCanvas.getContext('2d');
    if (!rotCtx) return;

    if (rotation === 90 || rotation === 270) {
      rotCanvas.width = origHeight;
      rotCanvas.height = origWidth;
    } else {
      rotCanvas.width = origWidth;
      rotCanvas.height = origHeight;
    }

    rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rotCtx.rotate((rotation * Math.PI) / 180);
    rotCtx.drawImage(img, -origWidth / 2, -origHeight / 2);

    // Now crop from the rotated canvas
    const cropPixelX = (cropBox.x / 100) * rotCanvas.width;
    const cropPixelY = (cropBox.y / 100) * rotCanvas.height;
    const cropPixelW = (cropBox.width / 100) * rotCanvas.width;
    const cropPixelH = (cropBox.height / 100) * rotCanvas.height;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = Math.max(1, Math.round(cropPixelW));
    finalCanvas.height = Math.max(1, Math.round(cropPixelH));

    const finalCtx = finalCanvas.getContext('2d');
    if (!finalCtx) return;

    finalCtx.drawImage(
      rotCanvas,
      cropPixelX,
      cropPixelY,
      cropPixelW,
      cropPixelH,
      0,
      0,
      finalCanvas.width,
      finalCanvas.height
    );

    finalCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').substring(0, 14);
        const fileName = `bukti_kamera_${timestamp}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-border bg-brand-warm-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-gold-light text-brand-gold flex items-center justify-center">
              {rawCapturedUrl ? <Crop className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-dark">
                {rawCapturedUrl ? 'Pangkas / Crop Bukti Transaksi' : 'Kamera Bukti Transaksi'}
              </h3>
              <p className="text-[11px] text-brand-muted">
                {rawCapturedUrl
                  ? 'Geser & sesuaikan kotak untuk memotong struk/nota'
                  : 'Arahkan kamera lalu tekan tombol jepret'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-muted hover:text-brand-dark hover:bg-brand-warm transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Crop Canvas Area */}
        <div className="relative bg-zinc-950 flex-1 flex items-center justify-center min-h-[350px] sm:min-h-[420px] max-h-[60vh] overflow-hidden select-none">
          {/* Flash Effect */}
          {isCapturingFlash && (
            <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
          )}

          {error ? (
            <div className="p-6 text-center text-white space-y-3 max-w-xs z-10">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">{error}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-2 px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba Lagi
              </button>
            </div>
          ) : rawCapturedUrl ? (
            // -------------------------------------------------------------
            // Interactive Crop & Rotation Editor
            // -------------------------------------------------------------
            <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-full h-full flex items-center justify-center p-3"
              style={{ touchAction: 'none' }}
            >
              {/* Display Image with CSS Rotation */}
              <div className="relative max-w-full max-h-[55vh] flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={rawCapturedUrl}
                  alt="Captured Evidence"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    maxHeight: '52vh',
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                  className="rounded-lg shadow-md transition-transform duration-200"
                />

                {/* Dark Mask Overlays Outside Crop Box */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, rgba(0,0,0,0.65) ${cropBox.x}%, transparent ${cropBox.x}%, transparent ${cropBox.x + cropBox.width}%, rgba(0,0,0,0.65) ${cropBox.x + cropBox.width}%)`,
                  }}
                />
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    clipPath: `polygon(
                      0% 0%, 100% 0%, 100% 100%, 0% 100%,
                      0% ${cropBox.y}%, 
                      ${cropBox.x}% ${cropBox.y}%, 
                      ${cropBox.x}% ${cropBox.y + cropBox.height}%, 
                      ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%, 
                      ${cropBox.x + cropBox.width}% ${cropBox.y}%, 
                      0% ${cropBox.y}%
                    )`,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                  }}
                />

                {/* Resizable Draggable Crop Box */}
                <div
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`,
                  }}
                  className="absolute border-2 border-brand-gold z-20 cursor-move transition-[border-color] shadow-2xl"
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Rule of Thirds Grid Lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/25" />
                    <div className="border-r border-b border-white/25" />
                    <div className="border-b border-white/25" />
                    <div className="border-r border-b border-white/25" />
                    <div className="border-r border-b border-white/25" />
                    <div className="border-b border-white/25" />
                    <div className="border-r border-white/25" />
                    <div className="border-r border-white/25" />
                    <div />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'top-left')}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-brand-gold border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'top-right')}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-brand-gold border-2 border-white rounded-full cursor-nesw-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'bottom-left')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-brand-gold border-2 border-white rounded-full cursor-nesw-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'bottom-right')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-brand-gold border-2 border-white rounded-full cursor-nwse-resize shadow-md"
                  />

                  {/* Edge Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'top')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-brand-gold/90 border border-white rounded-full cursor-ns-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'bottom')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2 bg-brand-gold/90 border border-white rounded-full cursor-ns-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'left')}
                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-6 bg-brand-gold/90 border border-white rounded-full cursor-ew-resize"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'right')}
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-6 bg-brand-gold/90 border border-white rounded-full cursor-ew-resize"
                  />
                </div>
              </div>
            </div>
          ) : (
            // -------------------------------------------------------------
            // Clean Unobstructed Live Video Feed
            // -------------------------------------------------------------
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover max-h-[480px]"
              />

              {/* Camera Switch Controls */}
              {cameras.length > 1 && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    title="Ganti Kamera Depan / Belakang"
                    className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toolbar / Actions Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-brand-border">
          {rawCapturedUrl ? (
            // Crop Mode Actions & Tools
            <div className="space-y-3">
              {/* Secondary Crop Tools (Rotate, Full Frame) */}
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-3 py-1.5 bg-brand-warm border border-brand-border hover:bg-brand-warm-50 text-brand-dark rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Putar 90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCrop}
                  className="px-3 py-1.5 bg-brand-warm border border-brand-border hover:bg-brand-warm-50 text-brand-dark rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-brand-muted" />
                  <span>Pilih Seluruh Gambar</span>
                </button>
              </div>

              {/* Primary Actions: Retake vs Apply Crop */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-brand-border hover:bg-brand-warm-50 text-brand-dark font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-brand-muted" />
                  <span>Ambil Ulang</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmCrop}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-gold hover:bg-brand-gold-hover text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Pangkas & Gunakan</span>
                </button>
              </div>
            </div>
          ) : (
            // Camera Live Capture Controls
            <div className="flex items-center justify-between gap-3">
              {cameras.length > 1 ? (
                <div className="flex-1 max-w-[150px]">
                  <select
                    value={selectedCameraId}
                    onChange={handleDeviceChange}
                    className="w-full text-xs py-2 px-2.5 bg-brand-warm-50 border border-brand-border rounded-xl text-brand-dark font-medium focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Kamera Default</option>
                    {cameras.map((c, i) => (
                      <option key={c.deviceId || i} value={c.deviceId}>
                        {c.label || `Kamera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              {/* Shutter Button */}
              <div className="flex-1 flex justify-center">
                <button
                  type="button"
                  onClick={takePhoto}
                  disabled={Boolean(error) || isInitializing}
                  className="w-14 h-14 rounded-full bg-brand-gold hover:bg-brand-gold-hover text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ring-4 ring-brand-gold/30"
                  title="Jepret Foto"
                >
                  <Camera className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-brand-muted hover:text-brand-dark px-3 py-2 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
