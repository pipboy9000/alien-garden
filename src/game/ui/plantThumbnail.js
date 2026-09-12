// Renders the first frame of a plant's spritesheet (its smallest/"baby" sprite) into a
// thumbnail canvas, for use in UI like the buy-a-plant popup.
const resourceCache = new Map();

function loadResource(resourceName) {
  let promise = resourceCache.get(resourceName);
  if (promise) return promise;

  promise = (async () => {
    const json = await fetch(`src/entities/resources/${resourceName}/${resourceName}.json`).then((res) => res.json());
    const image = new Image();
    image.src = `src/entities/resources/${resourceName}/${resourceName}.png`;
    await image.decode();
    return { json, image };
  })();

  resourceCache.set(resourceName, promise);
  return promise;
}

export async function drawPlantThumbnail(canvas, resourceName) {
  const { json, image } = await loadResource(resourceName);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, json.width, json.height, 0, 0, canvas.width, canvas.height);
}
