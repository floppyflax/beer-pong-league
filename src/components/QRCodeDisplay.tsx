import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Maximize2, X } from 'lucide-react';

interface QRCodeDisplayProps {
  tournamentId: string;
  tournamentName: string;
  size?: number;
}

export const QRCodeDisplay = ({ 
  tournamentId, 
  tournamentName, 
  size = 256 
}: QRCodeDisplayProps) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Generate tournament join URL
  const joinUrl = `${window.location.origin}/tournament/join/${tournamentId}`;
  
  const handleFullScreen = () => {
    setIsFullScreen(true);
  };
  
  const closeFullScreen = () => {
    setIsFullScreen(false);
  };
  
  return (
    <>
      {/* Regular QR Code Display */}
      <div className="bg-slate-800 rounded-lg p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          Inviter des participants
        </h3>
        
        <p className="text-slate-400 mb-4">
          Scannez ce QR code pour rejoindre le tournament
        </p>
        
        <div className="bg-white p-4 rounded-lg inline-block">
          <QRCodeSVG 
            value={joinUrl} 
            size={size}
            level="H"
            includeMargin={true}
          />
        </div>
        
        <div className="mt-4 flex gap-2 justify-center">
          <button
            onClick={handleFullScreen}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            aria-label="Display QR code in full screen"
          >
            <Maximize2 size={20} />
            Afficher en plein écran
          </button>
        </div>
        
        <p className="text-sm text-slate-500 mt-4 break-all">
          {joinUrl}
        </p>
      </div>

      {/* Full Screen Modal */}
      {isFullScreen && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={closeFullScreen}
        >
          <button
            onClick={closeFullScreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            aria-label="Close full screen"
          >
            <X size={32} />
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-8">
              {tournamentName}
            </h1>
            
            <div className="bg-white p-8 rounded-lg inline-block">
              <QRCodeSVG 
                value={joinUrl} 
                size={512} 
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="text-2xl text-white mt-8">
              Scannez pour rejoindre
            </p>
            
            <p className="text-lg text-slate-300 mt-4 break-all max-w-2xl mx-auto">
              {joinUrl}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
