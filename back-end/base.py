import re
import csv
import requests 
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def scrape_page(url):
    response = requests.get(url)
    if response.status_code == 200:
        return BeautifulSoup(response.text, 'html.parser')
    else:
        return None
    
def find_internal_links(soup, base_url):
    links = []
    for a in soup.find_all('a', href=True):
        link = urljoin(base_url, a['href'])
        if link.startswith(base_url):
            links.append(link)
    return links

def extract_emails(soup):
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'    
    paragraph_texts = ' '.join([p.get_text() for p in soup.find_all('p')])
    emails = re.findall(email_pattern, paragraph_texts)
    return emails

def main():
    base_url = 'https://www.example.com'
    visited_links = set()
    links_to_visit = [base_url]

    with open('emails.csv', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Email'])

        while links_to_visit:
            link = links_to_visit.pop(0)
            if link not in visited_links:
                print(f"Scraping {link}....")
                soup = scrape_page(link)
                if soup:
                    visited_links.add(link)
                    links_to_visit.extend(find_internal_links(soup, base_url))
                    emails = extract_emails(soup)
                    for email in emails:
                        writer.writerow([email])

if __name__ == "__main__":
    main()
