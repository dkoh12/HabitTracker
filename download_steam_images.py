#!/usr/bin/env python3
"""
Steam Community Image Downloader
Downloads all images from a Steam Community guide page
"""

import requests
from bs4 import BeautifulSoup
import os
import urllib.parse
import time
from pathlib import Path

def download_image(url, folder_path, filename):
    """Download an image from URL to the specified folder"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        file_path = os.path.join(folder_path, filename)
        with open(file_path, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ Downloaded: {filename}")
        return True
    except Exception as e:
        print(f"❌ Failed to download {filename}: {e}")
        return False

def extract_filename_from_url(url):
    """Extract a meaningful filename from the URL"""
    parsed = urllib.parse.urlparse(url)
    
    # For Steam images, try to get the ID from the path
    if 'steamusercontent.com' in url:
        # Extract the image ID from Steam URLs
        path_parts = parsed.path.split('/')
        for part in path_parts:
            if len(part) > 10 and part.replace('_', '').replace('-', '').isalnum():
                return f"steam_image_{part}.jpg"
    
    # Fallback to the last part of the path
    filename = os.path.basename(parsed.path)
    if not filename or '.' not in filename:
        filename = f"image_{hash(url) % 10000}.jpg"
    
    return filename

def scrape_steam_images(url, download_folder):
    """Scrape all images from a Steam Community page"""
    print(f"🔍 Fetching page: {url}")
    
    try:
        # Set headers to mimic a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all image URLs
        image_urls = set()
        
        # Look for img tags
        for img in soup.find_all('img'):
            src = img.get('src')
            if src:
                if src.startswith('//'):
                    src = 'https:' + src
                elif src.startswith('/'):
                    src = 'https://steamcommunity.com' + src
                
                # Filter for actual image files and Steam content
                if any(domain in src for domain in ['steamusercontent.com', 'steamstatic.com']) and \
                   any(ext in src.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
                    image_urls.add(src)
        
        # Look for links to images (Steam guide images are often linked)
        for link in soup.find_all('a'):
            href = link.get('href')
            if href and 'steamusercontent.com' in href:
                if href.startswith('//'):
                    href = 'https:' + href
                image_urls.add(href)
        
        # Also check for background images in style attributes
        for element in soup.find_all(style=True):
            style = element.get('style', '')
            if 'background-image' in style or 'url(' in style:
                import re
                urls = re.findall(r'url\(["\']?([^"\']+)["\']?\)', style)
                for img_url in urls:
                    if any(domain in img_url for domain in ['steamusercontent.com', 'steamstatic.com']):
                        if img_url.startswith('//'):
                            img_url = 'https:' + img_url
                        elif img_url.startswith('/'):
                            img_url = 'https://steamcommunity.com' + img_url
                        image_urls.add(img_url)
        
        print(f"📸 Found {len(image_urls)} unique images")
        
        # Create download folder if it doesn't exist
        Path(download_folder).mkdir(parents=True, exist_ok=True)
        
        # Download each image
        downloaded = 0
        for i, img_url in enumerate(image_urls, 1):
            filename = extract_filename_from_url(img_url)
            print(f"[{i}/{len(image_urls)}] Downloading: {filename}")
            
            if download_image(img_url, download_folder, filename):
                downloaded += 1
            
            # Be nice to the server
            time.sleep(0.5)
        
        print(f"\n✨ Download complete! {downloaded}/{len(image_urls)} images downloaded to {download_folder}")
        
    except Exception as e:
        print(f"❌ Error scraping page: {e}")

if __name__ == "__main__":
    # Steam Community URL
    steam_url = "https://steamcommunity.com/sharedfiles/filedetails/?id=2804456563"
    
    # Download folder
    download_folder = "./downloaded_images"
    
    print("🚀 Steam Community Image Downloader")
    print("=" * 50)
    
    scrape_steam_images(steam_url, download_folder)
