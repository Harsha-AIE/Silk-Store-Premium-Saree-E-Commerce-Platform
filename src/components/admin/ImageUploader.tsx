'use client';

import { useCallback, useState } from 'react';
import { Upload, X } from 'lucide-react';

type Props = {
  onFiles: (files: File[]) => void;
  previews?: string[];
  onRemovePreview?: (index: number) => void;
};

export default function ImageUploader({ onFiles, previews = [], onRemovePreview }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div>
      <label
        onDragOver={e => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center gap-3 p-8 rounded-lg cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${dragOver ? '#C8A96B' : 'rgba(200,169,107,0.3)'}`,
          backgroundColor: dragOver ? 'rgba(200,169,107,0.05)' : '#141414',
        }}
      >
        <Upload size={32} color="#C8A96B" />
        <span style={{ fontSize: '14px', color: 'rgba(248,244,236,0.7)' }}>
          Drag & drop images or tap to upload
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onFiles(files);
            e.target.value = '';
          }}
        />
      </label>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {previews.map((url, i) => (
            <div key={url} className="relative rounded-lg overflow-hidden aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {onRemovePreview && (
                <button
                  type="button"
                  onClick={() => onRemovePreview(i)}
                  className="absolute top-2 right-2 p-1 rounded-full"
                  style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#F8F4EC' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
