import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Move,
  ShieldCheck,
  Check,
  Trash2,
  Info,
} from 'lucide-react';
import { User, Member } from '../types';
import { storageService } from '../services/storageService';
import { authService } from '../services/authService';
import { SAMPLE_PASSPORT_PHOTOS, SamplePassportPhoto } from '../utils/directors';

interface PassportPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  targetMember?: Member | null;
  targetOfficialUsername?: string;
  onPhotoSaved?: (newPhotoUrl: string, requiresAuth: boolean) => void;
}

export const PassportPhotoModal: React.FC<PassportPhotoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetMember,
  targetOfficialUsername,
  onPhotoSaved,
}) => {
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);

  const isOfficialOrAdmin = storageService.isOfficialOrAdmin(currentUser);
  const isEditingOtherMember = Boolean(
    targetMember && (!currentUser?.memberId || targetMember.id.toLowerCase() !== currentUser.memberId.toLowerCase())
  );

  // Determine effective member or target
  const member = targetMember || (currentUser?.memberId ? storageService.getMemberById(currentUser.memberId) : null);
  const targetOfficialObj = targetOfficialUsername
    ? storageService.getOfficials().find(
        (o) =>
          o.username.toLowerCase() === targetOfficialUsername.toLowerCase() ||
          o.id === targetOfficialUsername
      )
    : null;
  const existingPhoto =
    member?.pendingPhotoUrl || member?.photoUrl || targetOfficialObj?.photoUrl || currentUser?.photoUrl;

  useEffect(() => {
    if (isOpen) {
      if (existingPhoto) {
        setSelectedImageSrc(existingPhoto);
      } else {
        setSelectedImageSrc('');
      }
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setStatusMessage(null);
    }
  }, [isOpen, existingPhoto]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, or WebP).' });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image file is too large. Please select a photo under 8MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImageSrc(result);
      setZoom(1.0);
      setPanX(0);
      setPanY(0);
      setRotation(0);
      setStatusMessage({ type: 'info', text: 'Photo loaded. Adjust zoom and position to frame inside the 2x2 passport box.' });
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SamplePassportPhoto) => {
    setSelectedImageSrc(sample.url);
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setRotation(0);
    setStatusMessage({ type: 'info', text: `Sample selected: ${sample.label}. Standard 2x2 format preview ready.` });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResetFraming = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  };

  /**
   * Generates crisp 500x500 2x2 square passport photo canvas export
   */
  const exportPassportPhoto = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!selectedImageSrc) {
        reject(new Error('No image loaded'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const size = 500; // Standard 500x500 square 2x2 passport resolution
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Clean white / neutral passport backdrop
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        // Move to center
        ctx.translate(size / 2 + panX, size / 2 + panY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);

        // Draw image centered
        const aspect = img.width / img.height;
        let drawW = size;
        let drawH = size;
        if (aspect >= 1) {
          drawW = size * aspect;
          drawH = size;
        } else {
          drawW = size;
          drawH = size / aspect;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Subtle 1px clean passport border
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, size, size);

        // Compress to high quality JPEG data URL (~40-60 KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        resolve(dataUrl);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for passport rendering.'));
      };

      img.src = selectedImageSrc;
    });
  };

  const handleSavePhoto = async () => {
    if (!selectedImageSrc) {
      setStatusMessage({ type: 'error', text: 'Please upload or select a photo before saving.' });
      return;
    }
    if (!currentUser) {
      setStatusMessage({ type: 'error', text: 'You must be logged in to update a photo.' });
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage(null);
      const photoDataUrl = await exportPassportPhoto();

      // Case A: Official or Admin editing a shareholder
      if (isOfficialOrAdmin && isEditingOtherMember && targetMember) {
        const targetId = targetMember.id;
        storageService.officialSetMemberPhoto(targetId, photoDataUrl, currentUser);
        setStatusMessage({
          type: 'success',
          text: `2×2 Passport Photo for Shareholder ${targetMember.name} (${targetId}) has been updated and authorized.`,
        });
        if (onPhotoSaved) {
          onPhotoSaved(photoDataUrl, false);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
        return;
      }

      // Case B: Official or Admin editing an Official
      if (isOfficialOrAdmin && targetOfficialObj) {
        const updatedOff = storageService.updateOfficialPhoto(
          targetOfficialObj.username,
          photoDataUrl,
          currentUser
        );
        if (
          currentUser.username.toLowerCase() === targetOfficialObj.username.toLowerCase() ||
          currentUser.id === updatedOff.id
        ) {
          authService.updateCurrentUserPhoto(photoDataUrl, 'AUTHORIZED');
        }
        setStatusMessage({
          type: 'success',
          text: `2×2 Passport Photo for Official ${updatedOff.name} updated and authorized.`,
        });
        if (onPhotoSaved) {
          onPhotoSaved(photoDataUrl, false);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
        return;
      }

      // Case B: User updating own photo (or Official updating self)
      const targetId = member?.id || currentUser.memberId || currentUser.username;
      const result = storageService.updateUserOwnPhoto(targetId, photoDataUrl, currentUser);

      if (!result.requiresAuthorization) {
        authService.updateCurrentUserPhoto(photoDataUrl, 'AUTHORIZED');
        setStatusMessage({
          type: 'success',
          text: 'Your 2x2 passport photo has been updated and authorized with official privileges.',
        });
      } else {
        authService.updateCurrentUserPhoto(photoDataUrl, 'PENDING_AUTHORIZATION');
        setStatusMessage({
          type: 'success',
          text: '2x2 passport photo submitted successfully! It is pending review and authorization by Society Officials or Admin.',
        });
      }

      if (onPhotoSaved) {
        onPhotoSaved(photoDataUrl, result.requiresAuthorization);
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save photo.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePhoto = () => {
    if (!currentUser) return;
    const targetId = member?.id || currentUser.memberId;
    if (!targetId) return;

    if (!confirm('Are you sure you want to remove this 2x2 passport photo?')) return;

    try {
      setIsProcessing(true);
      storageService.removeMemberPhoto(targetId, currentUser);
      authService.updateCurrentUserPhoto('', 'REJECTED');
      setSelectedImageSrc('');
      setStatusMessage({ type: 'info', text: '2x2 Passport photo has been removed.' });
      if (onPhotoSaved) {
        onPhotoSaved('', false);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to remove photo.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 shadow-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">2×2 Passport Photo Specification</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Standard 1:1 Format
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isOfficialOrAdmin && (isEditingOtherMember || (targetMember && targetMember.id !== currentUser?.memberId))
                  ? `Official Direct Edit & Authorization for ${targetMember?.name} (${targetMember?.id})`
                  : 'Update personal shareholder photo for official identity records'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authorization Policy Banner */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 text-xs">
          {isOfficialOrAdmin ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Official / Admin Authority Active:</strong> Photos uploaded or edited by Society Officials & Admins are{' '}
                <strong className="underline">immediately AUTHORIZED</strong> for official registry records.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-300">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                <strong>Member Submission Notice:</strong> You can upload/change your own 2x2 photo. It will be sent to{' '}
                <strong>Society Officials & Admin for Authorization</strong> before official commitment.
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-700 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-950/70 border-rose-700 text-rose-300'
                  : 'bg-blue-950/70 border-blue-700 text-blue-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-blue-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: 2x2 Passport Framing Canvas / Preview */}
            <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800 relative">
              <div className="text-center mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Passport 2" × 2" (51mm × 51mm) Frame
                </span>
                <p className="text-[10px] text-slate-500">Center face inside the oval and chin guidelines</p>
              </div>

              {/* The 2x2 Square Frame */}
              <div className="relative w-64 h-64 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-600 bg-white select-none">
                {selectedImageSrc ? (
                  <div
                    className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <img
                      src={selectedImageSrc}
                      alt="Passport preview"
                      className="absolute max-w-none transition-transform pointer-events-none"
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) scale(${zoom}) rotate(${rotation}deg)`,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-400">
                    <Camera className="w-12 h-12 text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-300">No Photo Selected</p>
                    <p className="text-[10px] text-slate-500 mt-1">Upload a photo or pick a sample headshot below</p>
                  </div>
                )}

                {/* Passport Spec Alignment Overlay (Oval Head & Chin Guide) */}
                {selectedImageSrc && showGuidelines && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Outer border & subtle crosshair */}
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-emerald-500/30" />
                    <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-emerald-500/30" />

                    {/* Eye Level Guideline (typically 56% to 69% from bottom) */}
                    <div className="absolute top-[38%] inset-x-8 border-b border-emerald-400/50 flex justify-between px-1">
                      <span className="text-[8px] text-emerald-400 font-mono tracking-tighter">EYE LEVEL</span>
                      <span className="text-[8px] text-emerald-400 font-mono tracking-tighter">EYE LEVEL</span>
                    </div>

                    {/* Head Oval Silhouette (covers 50% to 69% of image height) */}
                    <div className="w-36 h-48 rounded-[50%] border-2 border-dashed border-emerald-400/70 shadow-sm flex items-end justify-center pb-2">
                      <span className="text-[8px] font-mono font-bold text-emerald-300/80 bg-slate-950/70 px-1 rounded">
                        CHIN
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <span className="text-[9px] font-semibold text-emerald-400/90 bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        2x2 Passport Standard (1:1)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guidelines toggle button */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuidelines(!showGuidelines)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${
                    showGuidelines
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {showGuidelines ? '✓ Passport Guides Visible' : 'Show Passport Guides'}
                </button>
                {selectedImageSrc && (
                  <button
                    type="button"
                    onClick={handleResetFraming}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    Reset Framing
                  </button>
                )}
              </div>
            </div>

            {/* Right: Controls & Adjustments */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Upload & Choose Input */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-200 block">1. Select or Upload Image</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload From Device / Camera</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedImageSrc && (
                    <button
                      type="button"
                      onClick={handleRotate}
                      title="Rotate 90 Degrees"
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sample Preset Headshots */}
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Or Pick a Verified 2x2 Sample (Instant Test):</span>
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {SAMPLE_PASSPORT_PHOTOS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleSelectSample(sample)}
                        title={sample.label}
                        className={`group relative rounded-lg overflow-hidden border transition aspect-square ${
                          selectedImageSrc === sample.url
                            ? 'border-emerald-400 ring-2 ring-emerald-500/50'
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <img
                          src={sample.url}
                          alt={sample.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-1">
                          <span className="text-[9px] text-white font-medium truncate w-full">
                            {sample.label.split(' ')[0]}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Framing Controls (Zoom & Pan) */}
              {selectedImageSrc && (
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                    <span>2. Passport Framing Adjustments</span>
                    <span className="text-[11px] font-mono text-emerald-400">{Math.round(zoom * 100)}%</span>
                  </label>

                  {/* Zoom Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <ZoomOut className="w-3 h-3" /> Zoom
                      </span>
                      <ZoomIn className="w-3 h-3" />
                    </div>
                    <input
                      type="range"
                      min="0.8"
                      max="2.5"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Vertical Pan (Up/Down) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Move className="w-3 h-3" /> Vertical Position
                      </span>
                      <span className="font-mono text-[10px]">{panY}px</span>
                    </div>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      step="2"
                      value={panY}
                      onChange={(e) => setPanY(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Horizontal Pan (Left/Right) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Horizontal Position</span>
                      <span className="font-mono text-[10px]">{panX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      step="2"
                      value={panX}
                      onChange={(e) => setPanX(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Shareholder Metadata Info */}
              {member && (
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Target Shareholder:</span>
                    <strong className="text-white">{member.name}</strong>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Share Allocation:</span>
                    <span className="font-mono text-emerald-400">Share #{member.shareNumber} ({member.id})</span>
                  </div>
                  {member.photoStatus && (
                    <div className="flex justify-between text-slate-400">
                      <span>Current Photo Status:</span>
                      <span
                        className={`font-semibold ${
                          member.photoStatus === 'AUTHORIZED'
                            ? 'text-emerald-400'
                            : member.photoStatus === 'PENDING_AUTHORIZATION'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {member.photoStatus === 'AUTHORIZED'
                          ? '✓ Authorized'
                          : member.photoStatus === 'PENDING_AUTHORIZATION'
                          ? '⏳ Pending Authorization'
                          : '✕ Rejected'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            {existingPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Current Photo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSavePhoto}
              disabled={!selectedImageSrc || isProcessing}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
                !selectedImageSrc || isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isOfficialOrAdmin
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing 2x2 Photo...</span>
                </>
              ) : isOfficialOrAdmin ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Commit & Authorize 2x2 Photo</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Photo for Official Authorization</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
