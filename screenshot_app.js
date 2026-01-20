const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function run() {
    console.log("Starting server...");
    const server = spawn('python3', ['-m', 'http.server', '8081']); // Port 8081 to avoid conflict

    // Give server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    let browser;
    try {
        console.log("Launching browser...");
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        console.log("Navigating to app...");
        await page.goto('http://localhost:8081', { waitUntil: 'networkidle0' });

        // Trigger a toast
        await page.evaluate(() => {
            showToast("Test Toast Notification", "success");
        });

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 500));

        await page.screenshot({ path: 'verification_screenshot.png' });
        console.log("Screenshot taken: verification_screenshot.png");

    } catch (error) {
        console.error("VERIFICATION FAILED:", error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.kill();
    }
}

run();
