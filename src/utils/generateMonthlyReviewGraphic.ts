interface PhotoData {
  photoUrl: string;
  restaurantName: string;
  rank: number | null;
}

interface StatsData {
  totalSwipes: number;
  likePercentage: number;
  totalFavorites: number;
  topDistrict: string;
}

interface GenerateGraphicData {
  rankedPhotos: PhotoData[];
  stats: StatsData;
  month: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

// Smart image cropping with rounded corners
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 0
) {
  const imgAspect = img.width / img.height;
  const canvasAspect = w / h;
  
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  
  if (imgAspect > canvasAspect) {
    // Image is wider
    sw = img.height * canvasAspect;
    sx = (img.width - sw) / 2;
  } else {
    // Image is taller
    sh = img.width / canvasAspect;
    sy = (img.height - sh) / 2;
  }
  
  // Apply rounded corners if specified
  if (radius > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.clip();
  }
  
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  
  if (radius > 0) {
    ctx.restore();
  }
}

export async function generateMonthlyReviewGraphic(data: GenerateGraphicData): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw gradient background (warm gradient)
  const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
  gradient.addColorStop(0, '#FFF5E1');
  gradient.addColorStop(1, '#FFE8CC');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Draw title area with enhanced text styling
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillText(`${data.month} 美食回顧`, 540, 120);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // 3. Draw Rank 1 (large image with rounded corners)
  const rank1 = data.rankedPhotos.find(p => p.rank === 1);
  if (rank1) {
    try {
      const img1 = await loadImage(rank1.photoUrl);
      drawImageCover(ctx, img1, 90, 200, 900, 700, 16);
      
      // Gold medal with gradient and shadow
      const goldGradient = ctx.createRadialGradient(150, 260, 0, 150, 260, 50);
      goldGradient.addColorStop(0, '#FFD700');
      goldGradient.addColorStop(1, '#FFA500');
      ctx.fillStyle = goldGradient;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      ctx.beginPath();
      ctx.arc(150, 260, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Medal border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Medal number
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText('1', 150, 280);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Restaurant name with enhanced styling
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      ctx.fillText(rank1.restaurantName, 540, 950);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } catch (error) {
      console.error('Error loading rank 1 image:', error);
    }
  }

  // 4. Draw Rank 2 & 3 (side by side medium images with rounded corners)
  const rank2 = data.rankedPhotos.find(p => p.rank === 2);
  const rank3 = data.rankedPhotos.find(p => p.rank === 3);
  
  if (rank2) {
    try {
      const img2 = await loadImage(rank2.photoUrl);
      drawImageCover(ctx, img2, 90, 1000, 420, 420, 12);
      
      // Silver medal with gradient
      const silverGradient = ctx.createRadialGradient(150, 1060, 0, 150, 1060, 40);
      silverGradient.addColorStop(0, '#E8E8E8');
      silverGradient.addColorStop(1, '#C0C0C0');
      ctx.fillStyle = silverGradient;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      ctx.beginPath();
      ctx.arc(150, 1060, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // Medal border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Medal number
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText('2', 150, 1075);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Restaurant name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(rank2.restaurantName, 300, 1460);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } catch (error) {
      console.error('Error loading rank 2 image:', error);
    }
  }
  
  if (rank3) {
    try {
      const img3 = await loadImage(rank3.photoUrl);
      drawImageCover(ctx, img3, 570, 1000, 420, 420, 12);
      
      // Bronze medal with gradient
      const bronzeGradient = ctx.createRadialGradient(630, 1060, 0, 630, 1060, 40);
      bronzeGradient.addColorStop(0, '#E8A87C');
      bronzeGradient.addColorStop(1, '#CD7F32');
      ctx.fillStyle = bronzeGradient;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      ctx.beginPath();
      ctx.arc(630, 1060, 40, 0, Math.PI * 2);
      ctx.fill();
      
      // Medal border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Medal number
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 3;
      ctx.fillText('3', 630, 1075);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Restaurant name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText(rank3.restaurantName, 780, 1460);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    } catch (error) {
      console.error('Error loading rank 3 image:', error);
    }
  }

  // 5. Draw other photos (small grid at bottom with rounded corners)
  const otherPhotos = data.rankedPhotos.filter(p => p.rank === null).slice(0, 4);
  let xOffset = 90;
  for (const photo of otherPhotos) {
    try {
      const img = await loadImage(photo.photoUrl);
      drawImageCover(ctx, img, xOffset, 1500, 200, 200, 8);
      xOffset += 230;
    } catch (error) {
      console.error('Error loading other photo:', error);
    }
  }

  // 6. Draw enhanced watermark (bottom right)
  // Background box for watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;
  const watermarkText = 'Generated by 台北米其林美食探險';
  ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const textMetrics = ctx.measureText(watermarkText);
  const textWidth = textMetrics.width;
  ctx.fillRect(990 - textWidth - 20, 1850, textWidth + 20, 40);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  
  // Watermark text
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.textAlign = 'right';
  ctx.fillText(watermarkText, 990, 1875);

  // 7. Convert to Blob URL
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        throw new Error('Failed to create blob');
      }
    }, 'image/png');
  });
}
