function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function readField(row, ...names) {
  const normalizedNames = names.map(normalizeHeader);
  const entry = Object.entries(row).find(([key]) => normalizedNames.includes(normalizeHeader(key)));
  return entry ? entry[1] : '';
}

function asAvailable(value) {
  return value === true || ['true', 'yes', 'available', '1'].includes(String(value).trim().toLowerCase());
}

const imageUrl = (photoId) => `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1000&q=85`;
const imagePools = {
  laptops: ['photo-1517336714731-489689fd1ca8', 'photo-1496181133206-80ce9b88a853', 'photo-1541807084-5c52b6b3adef', 'photo-1588872657578-7efd1f1555ed'],
  gaming: ['photo-1593642632823-8f785ba67e45', 'photo-1593305841991-05c297ba4575', 'photo-1598550476439-6847785fcea6'],
  cameras: ['photo-1516035069371-29a1b244cc32', 'photo-1502920917128-1aa500764cbd', 'photo-1519183071298-a2962be90b8e'],
  smartphones: ['photo-1511707171634-5f897ff02aa9', 'photo-1598327105666-5b89351aff97', 'photo-1512499617640-c74ae3a79d37'],
  audio: ['photo-1505740420928-5e560c06d30e', 'photo-1484704849700-f032a568e944', 'photo-1546435770-a3e426bf472b'],
  drones: ['photo-1473968512647-3e447244af8f', 'photo-1508614589041-895b88991e3e', 'photo-1527977966376-1c8408f9f108'],
  accessories: ['photo-1527814050087-3793815479db', 'photo-1587829741301-dc798b83add3', 'photo-1527443224154-c4a3942d3acf'],
};
const allFallbackImages = [...new Set(Object.values(imagePools).flat())];

function fallbackImage(category, name, model, index = 0, used = new Set()) {
  const description = `${category} ${name} ${model}`;
  const poolName = /camera|photography/i.test(description) ? 'cameras'
    : /gaming|console|playstation|xbox/i.test(description) ? 'gaming'
      : /laptop|notebook|computer/i.test(description) ? 'laptops'
        : /phone|mobile|smartphone/i.test(description) ? 'smartphones'
          : /audio|headphone|earbud|speaker|microphone/i.test(description) ? 'audio'
            : /drone|uav/i.test(description) ? 'drones'
              : 'accessories';
  const preferred = imagePools[poolName];
  const candidates = [
    ...preferred.map((_, offset) => preferred[(index + offset) % preferred.length]),
    ...allFallbackImages.map((_, offset) => allFallbackImages[(index + offset) % allFallbackImages.length]),
  ];
  const chosen = candidates.find((photoId) => !used.has(imageUrl(photoId))) || candidates[0];
  return imageUrl(chosen);
}

export function normalizeSheetProduct(row, index = 0) {
  const name = String(readField(row, 'gadget name', 'name') || '').trim();
  const model = String(readField(row, 'gadget model', 'model') || '').trim();
  const category = String(readField(row, 'category', 'catagary') || 'Equipment').trim();
  const id = String(readField(row, 'id') || index + 1);
  const rawPhoto = String(readField(row, 'photo', 'image') || '').trim();
  const image = /^https?:\/\//i.test(rawPhoto) && !/example\.com/i.test(rawPhoto)
    ? rawPhoto
    : fallbackImage(category, name, model, index);
  const specs = [
    readField(row, 'gpu'),
    readField(row, 'ram'),
    readField(row, 'storage'),
    readField(row, 'gpu size', 'gpuSize'),
  ].map((value) => String(value ?? '').trim()).filter((value) => value && !/^not applicable$/i.test(value));
  const unitValue = String(readField(row, 'hours', 'houre', 'hour') || 'hour').trim().toLowerCase();
  const available = asAvailable(readField(row, 'availability', 'avability'));

  return {
    id,
    name,
    model: model || category,
    type: category,
    category,
    price: Number(readField(row, 'price')) || 0,
    unit: unitValue === '1' || unitValue === 'hours' ? 'hour' : unitValue,
    available,
    description: String(readField(row, 'description', 'descripation') || ''),
    specs,
    image,
    alt: `${name || category} available to rent`,
    badge: available ? 'Available' : 'Unavailable',
  };
}

export async function getProducts() {
  const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!endpoint) throw new Error('Google Apps Script URL is not configured.');

  const url = new URL(endpoint);
  url.searchParams.set('action', 'products');
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Products request failed (${response.status}).`);

  const result = await response.json();
  if (!result.success || !Array.isArray(result.products)) {
    throw new Error(result.message || 'Google Sheets did not return the product list.');
  }

  const usedImages = new Set();
  return result.products
    .map((row, index) => {
      const product = normalizeSheetProduct(row, index);
      if (usedImages.has(product.image)) product.image = fallbackImage(product.category, product.name, product.model, index, usedImages);
      usedImages.add(product.image);
      return product;
    })
    .filter((product) => product.name);
}
