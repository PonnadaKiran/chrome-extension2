// DownloadImages.tsx
import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DownloadImages = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadImages = () => {
    setIsDownloading(true); // Indicate that downloading has started
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabs[0].id },
            func: getAllImageUrls,
          },
          (results) => {
            if (results && results[0]?.result?.length) {
              const imageUrls = results[0].result;
              downloadImagesAsZip(imageUrls);
            } else {
              setIsDownloading(false); // No images, stop downloading state
            }
          }
        );
      }
    });
  };

  // Get all image URLs and their formats from the current tab
  const getAllImageUrls = () => {
    const images = Array.from(document.querySelectorAll('img'));
    return images
      .map((img) => {
        const src = img.src;
        const ext = src.split('.').pop()?.split(/#|\?/)[0]; // Extract file extension
        return { src, ext };
      })
      .filter(({ src, ext }) => src && ext); // Only return valid images
  };

  const downloadImagesAsZip = async (imageUrls: { src: string; ext: string | undefined }[]) => {
    const zip = new JSZip();
    const imgFolder = zip.folder("images");

    const validImages = await Promise.all(
      imageUrls.map(async ({ src, ext }, index) => {
        const imageBlob = await fetchImageAsBlob(src);
        if (imageBlob && ext) {
          imgFolder?.file(`image-${index}.${ext}`, imageBlob); // Store image in original format
        }
        return !!imageBlob; // Return true if the image was successfully added
      })
    );

    // If no valid images were added, don't create an empty ZIP
    if (validImages.some(Boolean)) {
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'images.zip');
      });
    } else {
      console.warn('No valid images found.');
    }

    setIsDownloading(false); // Reset downloading state
  };

  const fetchImageAsBlob = async (url: string): Promise<Blob | null> => {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.blob();
      }
      console.error(`Failed to fetch image: ${url}`);
      return null;
    } catch (error) {
      console.error(`Error fetching image: ${url}`, error);
      return null;
    }
  };

  return (
    <div>
      <button onClick={handleDownloadImages} disabled={isDownloading}>
        {isDownloading ? 'Downloading Images...' : 'Download All Images'}
      </button>
    </div>
  );
};

export default DownloadImages;

