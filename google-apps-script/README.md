# Google Sheets rental integration

The site expects a Google Apps Script web app. [`Code.gs`](./Code.gs) is the matching server-side implementation: it reads products from the first tab, preserves product creation and availability updates, and appends confirmed rental requests to the **second tab**. If the spreadsheet has only one tab, it creates an `Orders` tab as tab two.

## Deploy the order writer

1. Open the spreadsheet and choose **Extensions → Apps Script**.
2. Replace the project's server code with [`Code.gs`](./Code.gs) and save it. The script is configured for spreadsheet ID `1w1Dk42FjXkmxTdbfajWvY1-KCBtgF0mXHAZjBZaDRXg`.
3. Choose **Deploy → Manage deployments**, edit the existing Web app deployment, select **New version**, and deploy. Keep **Execute as** set to you, and allow the site to reach the web app.
4. Keep the existing `GOOGLE_APPS_SCRIPT_URL` in `.env.local` if it points to this deployment's `/exec` URL. Restart `npm run dev` after changing environment configuration.

The order API now sends the item, customer name, email, phone, and rental dates. Start and end times can be selected to the minute; rentals may last from one minute up to 24 hours. The script validates the product and rental window, serializes booking checks to avoid concurrent overlaps, calculates the amount from the Products tab, and appends a pending order to tab two. The site displays confirmation only after the script returns a saved order reference.

## Sheet structure

The script treats the first spreadsheet tab as the product catalog and the second as the order tab. It matches common existing header names and adds missing order columns to the header row without deleting existing columns. Order rows include an order reference, timestamp, product ID and name, customer contact details, rental start/end, duration, estimated total, and `Pending` status.

The Apps Script source is not deployed automatically when files in this Next.js project change. Deploy the new version above for the live web app to use this order writer.
