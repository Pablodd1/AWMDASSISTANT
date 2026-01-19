# Deploying American Wellness MD Assistant to Vercel

Since this is a static client-side application (HTML/CSS/JS), it is very easy to deploy to Vercel.

## Prerequisites

1.  A [Vercel Account](https://vercel.com/signup).
2.  The code pushed to a GitHub repository (which you have already done).

## Deployment Steps

1.  **Login to Vercel**: Go to [vercel.com](https://vercel.com) and log in.
2.  **Add New Project**: Click "Add New..." -> "Project".
3.  **Import Git Repository**:
    *   Select "Continue with GitHub".
    *   Find the `AWMDASSISTANT` repository in the list.
    *   Click "Import".
4.  **Configure Project**:
    *   **Framework Preset**: Select "Other" (since it's plain HTML/JS).
    *   **Root Directory**: `./` (default).
    *   **Build Command**: Leave empty.
    *   **Output Directory**: Leave empty.
5.  **Deploy**: Click "Deploy".

## Verification

Vercel will build and deploy your site in seconds. You will get a URL like `https://awmdassistant.vercel.app`.

### Note on CORS and PDF.js
Since the application uses `pdf.js` with a worker, Vercel is a great environment because it serves files over HTTPS/HTTP, avoiding the `file://` protocol CORS issues you might encounter locally. The `vercel.json` included in this update ensures all routes point to `index.html`.
