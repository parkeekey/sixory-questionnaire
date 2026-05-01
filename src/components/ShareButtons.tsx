import html2canvas from 'html2canvas';

interface ShareButtonsProps {
  targetRef: React.RefObject<HTMLDivElement>;
  resultText: string;
}

export default function ShareButtons({ targetRef, resultText }: ShareButtonsProps) {
  const captureAndSave = async () => {
    if (!targetRef.current) return;
    
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `world-of-coffee-result-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  const captureAndShare = async () => {
    if (!targetRef.current) return;
    
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false
      });
      
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) return;
        
        const file = new File([blob], 'result.png', { type: 'image/png' });
        
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My World of Coffee Result',
            text: resultText
          });
        } else {
          // Fallback: download the image
          const link = document.createElement('a');
          link.download = `world-of-coffee-result-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  return (
    <div className="share-buttons">
      <button 
        className="share-btn save-btn"
        onClick={captureAndSave}
        aria-label="Save screenshot"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Save</span>
      </button>
      <button 
        className="share-btn share-action-btn"
        onClick={captureAndShare}
        aria-label="Share screenshot"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Share</span>
      </button>
    </div>
  );
}
