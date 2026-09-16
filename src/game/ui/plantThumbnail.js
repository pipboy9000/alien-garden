// Renders a plant's level-specific UI thumbnail into a canvas.
const thumbnailCache = new Map();

function loadThumbnail(plantId, level) {
  const cacheKey = `${plantId}:level-${level}`;
  let promise = thumbnailCache.get(cacheKey);
  if (promise) return promise;

  promise = (async () => {
    const image = new Image();
    image.src = `${import.meta.env.BASE_URL}thumbnails/${plantId}/level-${level}.png`;
    await image.decode();
    return image;
  })();

  thumbnailCache.set(cacheKey, promise);
  return promise;
}

export async function drawPlantThumbnail(canvas, plantId, level = 1) {
  const image = await loadThumbnail(plantId, level);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}
