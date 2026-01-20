const puppeteer = require('puppeteer');
const { spawn } = require('child_process');

async function run() {
    console.log("Starting server...");
    const server = spawn('python3', ['-m', 'http.server', '8080']);

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
        const response = await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });

        if (response.status() !== 200) {
            throw new Error(`Failed to load page: ${response.status()}`);
        }
        console.log("Page loaded successfully (200 OK)");

        const title = await page.title();
        console.log(`Page Title: ${title}`);
        if (title !== "MediDoc AI Analyzer") {
            throw new Error(`Incorrect title: ${title}`);
        }

        // Check for console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('PAGE ERROR:', msg.text());
            }
        });

        // Check if critical elements exist
        const dropZone = await page.$('#drop-zone');
        if (!dropZone) throw new Error("Drop zone not found");
        console.log("UI: Drop zone found");

        const medicalKnowledge = await page.evaluate(() => typeof MedicalKnowledge);
        if (medicalKnowledge !== 'object') throw new Error("MedicalKnowledge object not found on window");
        console.log("Logic: MedicalKnowledge loaded");

        const toastContainer = await page.$('#toast-container');
        if (!toastContainer) throw new Error("Toast container not found");
        console.log("UI: Toast container found");

        console.log("VERIFICATION SUCCESSFUL");

    } catch (error) {
        console.error("VERIFICATION FAILED:", error);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
        server.kill();
    }
}

run();
