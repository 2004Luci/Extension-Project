//------------------------------------------- Possible Fixes --------------------------------------------

//To load the library
/*
require(['foo'], function (foo) {
    //foo is now loaded.
});
*/
/*
var axios, cheerio, iconv, fs, csvWriter;
require(['axios'], function(axios){
});
require(['cheerio'], function(cheerio){
});
require(['iconv'], function(iconv){
});
require(['fs'], function(fs){
});
require(['csvWriter'], function(csvWriter){
});
*/
/*

Require Issue: https://requirejs.org/docs/errors.html#notloaded

*/ 
//-------------------------------------------------------------------------------------------------------
const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');
const { URL } = require('url');
const fs = require('fs');
const csvWriter = require('csv-write-stream');

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
        return this.items.length == 0;
    }

    length() {
        return this.items.length;
    }
}

const visitedLinks = new Set();
const linksToVisit = new Queue();
const foundEmails = new Set();

const writer = csvWriter({ headers: ["Email"] });
writer.pipe(createWriteStream('emails.csv'));

const irrelevantExtensions = ['.pdf', '.mov', '.jpg', '.png', '.gif', '.zip', '.mp3', '.mp4', '.avi', '.wmv', '.m4v', '.jpeg', '.JPG'];
const relevantKeywords = ['contact', 'about', 'team', 'staff', 'support', 'help'];

const CONCURRENCY_LIMIT = 5;
let activeRequests = 0;
let visitedCount = 0;

async function scrapePage(url) {
    try {
        const response = await get(url, { responseType: 'arraybuffer' });
        const decodedContent = decode(response.data, 'utf-8');
        return load(decodedContent);
    } catch (error) {
        console.error(`Failed to scrape ${url}: ${error.message}`);
        return null;
    }
}

function findInternalLinks($, baseUrl) {
    const links = [];
    $('a[href]').each((i, element) => {
        const href = $(element).attr('href');
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
    if (relevantKeywords.some(keyword => link.toLowerCase().includes(keyword))) {
        return true;
    }
    return !visitedLinks.has(link);
}

function extractEmails($, url) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const pageText = $('body').text();
    const emails = pageText.match(emailPattern) || [];
    emails.forEach(email => {
        if (!foundEmails.has(email)) {
            foundEmails.add(email);
            writer.write([email]);
        }
    });

    // Obfuscated and hidden emails
    $('script').each((i, element) => {
        const scriptContent = $(element).html();
        // Look for common patterns of obfuscation here and decode them
    });
    
    // Look for mailto: links
    $('a[href^="mailto:"]').each((i, element) => {
        const mailto = $(element).attr('href');
        const email = mailto.replace(/^mailto:/, '');
        if (!foundEmails.has(email)) {
            foundEmails.add(email);
            writer.write([email]);
        }
    });
}

async function processLink(link) {
    if (visitedLinks.has(link)) return;

    console.log(`Scraping ${link}... Visited Count: ${visitedCount}`);
    const $ = await scrapePage(link);
    if (!$) return;

    visitedLinks.add(link);
    visitedCount++; // Increment visited count

    findInternalLinks($, link).forEach(l => linksToVisit.enqueue(l));
    extractEmails($, link);
}

async function main(url) {
    linksToVisit.enqueue(url); // Initialize with the provided URL

    while (linksToVisit.length() > 0 || activeRequests > 0) {
        while (activeRequests < CONCURRENCY_LIMIT && linksToVisit.length() > 0 && visitedCount < 300) {
            const link = linksToVisit.dequeue();
            activeRequests++;
            await processLink(link);
            activeRequests--;
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // Short delay to allow for concurrency
    }
    writer.end();
}

module.exports = main();
