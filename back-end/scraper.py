import re
import csv
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor, as_completed

def scrape_page(url):
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return BeautifulSoup(response.text, 'html.parser')
    except requests.RequestException:
        return None

def find_internal_links(soup, base_url):
    links = []
    for a in soup.find_all('a', href=True):
        link = urljoin(base_url, a['href'])
        if link.startswith(base_url) and is_relevant_link(link) and link not in links:
            links.append(link)
    return links

def is_relevant_link(link):
    irrelevant_extensions = ('.pdf', '.mov', '.jpg', '.png', '.gif', '.zip', '.mp3', '.mp4', '.avi', '.wmv')
    return not link.endswith(irrelevant_extensions)

def extract_emails(soup):
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    paragraph_texts = ' '.join([p.get_text() for p in soup.find_all('p')])
    emails = re.findall(email_pattern, paragraph_texts)
    return emails

def main():
    base_url = 'https://www.silvertouch.com/'
    visited_links = set()
    links_to_visit = [base_url]
    found_emails = set()
    max_depth = 3
    max_pages = 100
    current_depth = 0
    pages_visited = 0
    email_goal = 25

    with open('emails.csv', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Email'])

        while links_to_visit and len(found_emails) < email_goal and current_depth <= max_depth:
            next_level_links = []
            with ThreadPoolExecutor(max_workers=10) as executor:
                futures = {executor.submit(scrape_page, link): link for link in links_to_visit if link not in visited_links}

                for future in as_completed(futures):
                    link = futures[future]
                    soup = future.result()
                    if soup:
                        print(f"Scraping {link}....")
                        visited_links.add(link)
                        emails = extract_emails(soup)
                        for email in emails:
                            if email not in found_emails:
                                writer.writerow([email])
                                found_emails.add(email)
                        next_level_links.extend(find_internal_links(soup, base_url))
                        pages_visited += 1
                        if len(found_emails) >= email_goal:
                            break

            links_to_visit = next_level_links
            current_depth += 1

if __name__ == "__main__":
    main()
