import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

const CropModal = ({ isOpen, image, onClose, onSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  if (!isOpen) return null;

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSave = async () => {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels);
    onSave(croppedImage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
        <h3 className="text-zinc-900 dark:text-white font-bold text-lg">Adjust Profile Picture</h3>
        
        {/* Crop Container */}
        <div className="relative w-full h-80 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        {/* 💡 Updated: Slider background track adapts to light/dark surfaces */}
        <input 
            type="range" min={1} max={3} step={0.1} value={zoom} 
            onChange={(e) => setZoom(e.target.value)} 
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />

        <div className="flex gap-3 mt-2">
          <button 
            onClick={onClose} 
            className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 py-2.5 rounded-lg font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;