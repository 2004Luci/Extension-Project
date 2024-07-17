console.log("Scripting for Chrome Extension");
document.querySelector(".btn").addEventListener("click", () => {
    window.location.href = "http://127.0.0.1:3000/SilverTouch/login.html";
})
class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(element) {
        this.items.push(element);
    }

    dequeue() {
        if (this.isEmpty()) {
            return "Underflow";
        }
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    length() {
        return this.items.length;
    }
}

const visitedLinks = new Set();
const prioritizedLinksToVisit = new Queue();
const regularLinksToVisit = new Queue();
const foundEmails = new Set();

const irrelevantExtensions = ['.pdf', '.mov', '.jpg', '.png', '.gif', '.zip', '.mp3', '.mp4', '.avi', '.wmv', '.m4v', '.jpeg', '.JPG'];
const contactKeywords = ['contact', 'about', 'team', 'staff', 'support', 'help', 'reach-us', 'get-in-touch'];
const contentKeywords = ['phone', 'email', 'address', 'location', 'contact', 'reach', 'support'];

const CONCURRENCY_LIMIT = 20;
let activeRequests = 0;
let visitedCount = 0;
let baseUrl = '';

async function scrapePage(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        updateStatus(`Scraping ${url}...`);
        return new DOMParser().parseFromString(text, 'text/html');
    } catch (error) {
        console.error(`Failed to scrape ${url}: ${error.message}`);
        return null;
    }
}

function findInternalLinks(doc, baseUrl) {
    const links = [];
    const anchors = doc.querySelectorAll('a[href]');
    anchors.forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (!href) return;
        const link = new URL(href, baseUrl).toString();
        if (link.startsWith(baseUrl) && isRelevantLink(link)) {
            links.push(link);
        }
    });
    return links;
}

function isRelevantLink(link) {
    if (irrelevantExtensions.some(ext => link.endsWith(ext))) {
        return false;
    }
    if (contactKeywords.some(keyword => link.toLowerCase().includes(keyword))) {
        return true;
    }
    return !visitedLinks.has(link);
}

function extractEmails(doc) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const pageText = doc.body.textContent || "";
    const emails = pageText.match(emailPattern) || [];
    emails.forEach(email => {
        if (!foundEmails.has(email)) {
            foundEmails.add(email);
        }
    });

    const mailtoLinks = doc.querySelectorAll('a[href^="mailto:"]');
    mailtoLinks.forEach(link => {
        const mailto = link.getAttribute('href');
        const email = mailto.replace(/^mailto:/, '');
        if (!foundEmails.has(email)) {
            foundEmails.add(email);
        }
    });
}

function containsContactInfo(doc) {
    const bodyText = doc.body.textContent.toLowerCase();
    return contentKeywords.some(keyword => bodyText.includes(keyword)) ||
        doc.querySelectorAll('form').length > 0 ||
        doc.querySelectorAll('address').length > 0 ||
        doc.querySelectorAll('a[href^="mailto:"]').length > 0;
}

async function processLink(link) {
    if (visitedLinks.has(link)) return;

    updateStatus(`Scraping ${link}...`);
    updateCurrentURL(link);
    const doc = await scrapePage(link);
    if (!doc) return;

    visitedLinks.add(link);
    visitedCount++;
    updateVisitedCount(visitedCount);

    findInternalLinks(doc, baseUrl).forEach(l => {
        if (isRelevantLink(l)) {
            prioritizedLinksToVisit.enqueue(l);
        } else {
            regularLinksToVisit.enqueue(l);
        }
    });

    if (containsContactInfo(doc)) {
        extractEmails(doc);
    }
}

async function main() {
    prioritizedLinksToVisit.enqueue(baseUrl);

    while (prioritizedLinksToVisit.length() > 0 || regularLinksToVisit.length() > 0 || activeRequests > 0) {
        while (activeRequests < CONCURRENCY_LIMIT && (prioritizedLinksToVisit.length() > 0 || (regularLinksToVisit.length() > 0 && visitedCount < 500))) {
            const link = prioritizedLinksToVisit.length() > 0 ? prioritizedLinksToVisit.dequeue() : regularLinksToVisit.dequeue();
            activeRequests++;
            processLink(link).then(() => {
                activeRequests--;
            });
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Create and download CSV file
    const csvContent = "Email\n" + Array.from(foundEmails).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emails.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function updateStatus(message) {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = `<p>${message}</p>`;
}

function updateVisitedCount(count) {
    const visitedCountDiv = document.getElementById('visitedCount');
    visitedCountDiv.innerHTML = `<strong>Visited Count:</strong> ${count}`;
}

function updateCurrentURL(url) {
    const currentURLDiv = document.getElementById('currentURL');
    currentURLDiv.innerHTML = `<strong>Currently Scraping:</strong> ${url}`;
}

document.getElementById('startButton').addEventListener('click', () => {
    const urlInput = document.getElementById('urlInput').value;
    if (urlInput) {
        baseUrl = new URL(urlInput).origin;
        updateVisitedCount(0); // Reset visited count display
        updateStatus(''); // Clear previous status
        updateCurrentURL('None'); // Reset current URL display
        main().catch(error => console.error(error));
    } else {
        alert('Please enter a valid URL');
    }
});

