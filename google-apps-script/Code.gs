// Nexus Gear Google Apps Script web app.
// Deploy this script against the spreadsheet below as a Web app (execute as you).
const SPREADSHEET_ID = '1w1Dk42FjXkmxTdbfajWvY1-KCBtgF0mXHAZjBZaDRXg';

const PRODUCT_FIELDS = [
  { key: 'id', label: 'id', aliases: ['id', 'product id', 'gadget id'] },
  { key: 'name', label: 'gadget name', aliases: ['gadget name', 'name', 'product name'] },
  { key: 'model', label: 'gadget model', aliases: ['gadget model', 'model', 'product model'] },
  { key: 'category', label: 'catagary', aliases: ['category', 'catagary', 'catagory'] },
  { key: 'price', label: 'price', aliases: ['price', 'rental price', 'hourly price'] },
  { key: 'hours', label: 'houre', aliases: ['hour', 'hours', 'houre', 'unit'] },
  { key: 'availability', label: 'avability', aliases: ['availability', 'avability', 'available'] },
  { key: 'description', label: 'descripation', aliases: ['description', 'descripation'] },
  { key: 'gpu', label: 'gpu', aliases: ['gpu', 'main spec'] },
  { key: 'ram', label: 'ram', aliases: ['ram'] },
  { key: 'storage', label: 'storage', aliases: ['storage'] },
  { key: 'gpuSize', label: 'gpu size', aliases: ['gpu size', 'gpusize'] },
  { key: 'photo', label: 'photo', aliases: ['photo', 'image'] },
];

const ORDER_FIELDS = [
  { key: 'orderId', label: 'Order ID', aliases: ['order id', 'order reference', 'reference'] },
  { key: 'createdAt', label: 'Submitted At', aliases: ['submitted at', 'created at', 'timestamp', 'date ordered'] },
  { key: 'productId', label: 'Product ID', aliases: ['product id', 'gadget id', 'id'] },
  { key: 'item', label: 'Gadget', aliases: ['gadget', 'item', 'product', 'product name', 'gadget name'] },
  { key: 'name', label: 'Customer Name', aliases: ['customer name', 'name', 'full name'] },
  { key: 'email', label: 'Email', aliases: ['email', 'email address'] },
  { key: 'phone', label: 'Phone', aliases: ['phone', 'phone number', 'contact number'] },
  { key: 'startDate', label: 'Rental Starts', aliases: ['rental starts', 'start date', 'start', 'from'] },
  { key: 'endDate', label: 'Rental Ends', aliases: ['rental ends', 'end date', 'end', 'to'] },
  { key: 'hours', label: 'Hours', aliases: ['hours', 'duration'] },
  { key: 'total', label: 'Estimated Total', aliases: ['estimated total', 'total', 'amount', 'rental cost'] },
  { key: 'status', label: 'Status', aliases: ['status', 'order status'] },
];

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalize_(value) {
  return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function productSheet_() {
  const sheets = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets();
  if (!sheets.length) throw new Error('The spreadsheet has no product tab.');
  return sheets[0];
}

function ordersSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = spreadsheet.getSheets();
  if (sheets.length > 1) return sheets[1];
  return spreadsheet.insertSheet('Orders');
}

function headerIndexes_(sheet, definitions, addMissing) {
  let lastColumn = Math.max(sheet.getLastColumn(), 1);
  let headers = sheet.getLastRow() ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  if (!headers.some((value) => String(value).trim())) headers = [];

  if (!headers.length) {
    headers = definitions.map((field) => field.label);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  const indexes = {};
  definitions.forEach((field) => {
    const aliases = field.aliases.map(normalize_);
    let index = headers.findIndex((header) => aliases.includes(normalize_(header)));
    if (index < 0 && addMissing) {
      index = headers.length;
      headers.push(field.label);
      sheet.getRange(1, index + 1).setValue(field.label);
    }
    if (index >= 0) indexes[field.key] = index;
  });
  return { headers, indexes };
}

function readRows_(sheet, definitions) {
  const { headers } = headerIndexes_(sheet, definitions, false);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || !headers.length) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, Math.max(headers.length, sheet.getLastColumn())).getValues();
  return values.map((row) => {
    const record = {};
    headers.forEach((header, index) => { record[String(header)] = row[index]; });
    return record;
  });
}

function getProducts_() {
  return readRows_(productSheet_(), PRODUCT_FIELDS).filter((row) => {
    const name = row['gadget name'] || row.name || row['product name'];
    return String(name || '').trim();
  });
}

function doGet(event) {
  const action = event && event.parameter && event.parameter.action;
  if (action !== 'products') return json_({ success: false, message: 'Unsupported action.' });
  try {
    return json_({ success: true, products: getProducts_() });
  } catch (error) {
    return json_({ success: false, message: error.message || 'Could not read the Products tab.' });
  }
}

function appendByFields_(sheet, definitions, record) {
  const { headers, indexes } = headerIndexes_(sheet, definitions, true);
  const row = Array(headers.length).fill('');
  definitions.forEach((field) => {
    if (indexes[field.key] !== undefined) row[indexes[field.key]] = record[field.key] == null ? '' : record[field.key];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
}

function fieldValue_(row, definitions, key) {
  const field = definitions.find((item) => item.key === key);
  for (const alias of field.aliases) {
    const actual = Object.keys(row).find((header) => normalize_(header) === normalize_(alias));
    if (actual !== undefined) return row[actual];
  }
  return '';
}

function available_(value) {
  return value === true || ['true', 'yes', 'available', '1'].includes(normalize_(value));
}

function saveProduct_(body) {
  const sheet = productSheet_();
  const rows = readRows_(sheet, PRODUCT_FIELDS);
  const currentIds = rows.map((row) => Number(fieldValue_(row, PRODUCT_FIELDS, 'id')) || 0);
  const record = {
    id: Math.max(0, ...currentIds) + 1,
    name: String(body.name || '').trim(),
    model: String(body.model || '').trim(),
    category: String(body.category || '').trim(),
    price: Number(body.price),
    hours: body.hours || 'hour',
    availability: Boolean(body.availability),
    description: String(body.description || '').trim(),
    gpu: String(body.gpu || '').trim(),
    ram: String(body.ram || '').trim(),
    storage: String(body.storage || '').trim(),
    gpuSize: String(body.gpuSize || '').trim(),
    photo: String(body.photo || '').trim(),
  };
  if (!record.name || !record.model || !record.category || !Number.isFinite(record.price) || record.price < 0) {
    throw new Error('Name, model, category, and a valid price are required.');
  }
  appendByFields_(sheet, PRODUCT_FIELDS, record);
  return record.id;
}

function setAvailability_(body) {
  const sheet = productSheet_();
  const { headers, indexes } = headerIndexes_(sheet, PRODUCT_FIELDS, false);
  if (indexes.id === undefined || indexes.availability === undefined) throw new Error('The Products tab needs product ID and availability columns.');
  const lastRow = sheet.getLastRow();
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, Math.max(headers.length, sheet.getLastColumn())).getValues() : [];
  const target = rows.findIndex((row) => String(row[indexes.id]) === String(body.id));
  if (target < 0) throw new Error('Product not found.');
  sheet.getRange(target + 2, indexes.availability + 1).setValue(Boolean(body.availability));
}

function findProduct_(id) {
  return getProducts_().find((row) => String(fieldValue_(row, PRODUCT_FIELDS, 'id')) === String(id));
}

function makeOrder_(body) {
  const id = String(body.gadgetId || '').trim();
  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;
  const hours = durationMinutes / 60;
  if (!id || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start <= new Date() || end <= start || !Number.isInteger(durationMinutes) || durationMinutes > 1440) {
    throw new Error('Choose a valid future rental window between 1 and 24 hours.');
  }

  const product = findProduct_(id);
  if (!product) throw new Error('The selected product was not found in the Products tab.');
  if (!available_(fieldValue_(product, PRODUCT_FIELDS, 'availability'))) throw new Error('This product is not currently available to rent.');

  const orderSheet = ordersSheet_();
  const { headers, indexes } = headerIndexes_(orderSheet, ORDER_FIELDS, true);
  const lastRow = orderSheet.getLastRow();
  if (lastRow > 1) {
    const rows = orderSheet.getRange(2, 1, lastRow - 1, Math.max(headers.length, orderSheet.getLastColumn())).getValues();
    const now = new Date();
    const activeProductIndex = indexes.productId;
    rows.forEach((row) => {
      const rowProductId = String(row[activeProductIndex] || '');
      const status = normalize_(row[indexes.status]);
      if (rowProductId !== id || ['cancelled', 'canceled', 'rejected', 'declined'].includes(status)) return;
      const existingStart = new Date(row[indexes.startDate]);
      const existingEnd = new Date(row[indexes.endDate]);
      if (Number.isFinite(existingStart.getTime()) && Number.isFinite(existingEnd.getTime()) && start < existingEnd && end > existingStart && now < existingEnd) {
        throw new Error('This gadget is already booked for some of those dates. Please choose another time.');
      }
    });
  }

  const reference = 'NX-' + Utilities.getUuid().split('-')[0].toUpperCase();
  const hourlyPrice = Number(fieldValue_(product, PRODUCT_FIELDS, 'price'));
  const total = hourlyPrice * hours;
  appendByFields_(orderSheet, ORDER_FIELDS, {
    orderId: reference,
    createdAt: new Date(),
    productId: id,
    item: String(fieldValue_(product, PRODUCT_FIELDS, 'name')),
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim(),
    phone: String(body.phone || '').trim(),
    startDate: start,
    endDate: end,
    hours,
    total,
    status: 'Pending',
  });
  return reference;
}

function doPost(event) {
  let body;
  try {
    body = JSON.parse(event.postData.contents || '{}');
  } catch (error) {
    return json_({ success: false, message: 'Invalid JSON request.' });
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (body.action === 'addProduct') {
      return json_({ success: true, productId: saveProduct_(body) });
    }
    if (body.action === 'updateAvailability') {
      setAvailability_(body);
      return json_({ success: true });
    }
    if (body.action === 'order') {
      if (!String(body.name || '').trim() || !String(body.email || '').trim() || !String(body.phone || '').trim()) {
        throw new Error('Customer name, email, and phone are required.');
      }
      return json_({ success: true, orderId: makeOrder_(body) });
    }
    return json_({ success: false, message: 'Unsupported action.' });
  } catch (error) {
    return json_({ success: false, message: error.message || 'Could not save the request to the spreadsheet.' });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
