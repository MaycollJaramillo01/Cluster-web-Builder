from __future__ import annotations

import csv
import hashlib
import html
import os
import re
import shutil
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup

START_URL = "https://www.wilandcopainting.com/"
HOSTS = {"www.wilandcopainting.com", "wilandcopainting.com"}
OUTPUT_DIR = Path("wilandco-images")
FILES_DIR = OUTPUT_DIR / "images"
MAX_PAGES = 100
MAX_WORKERS = 12

KNOWN_PAGES = {
    START_URL,
    "https://www.wilandcopainting.com/solutions",
    "https://www.wilandcopainting.com/portfolio",
    "https://www.wilandcopainting.com/company",
    "https://www.wilandcopainting.com/contact",
    "https://www.wilandcopainting.com/media-center",
    "https://www.wilandcopainting.com/portfolio/commercial-siding-1",
    "https://www.wilandcopainting.com/portfolio/commercial-painting-ext-1",
    "https://www.wilandcopainting.com/portfolio/residential-painting-ext-1",
    "https://www.wilandcopainting.com/portfolio/commercial-painting-int-1",
}

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp",
    ".ico", ".tif", ".tiff", ".heic", ".heif",
}
CONTENT_TYPE_EXT = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
    "image/tiff": ".tiff",
    "image/heic": ".heic",
    "image/heif": ".heif",
}

session = requests.Session()
session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
})


def clean_embedded_text(value: str) -> str:
    value = html.unescape(value)
    replacements = {
        r"\/": "/",
        r"\u002F": "/",
        r"\u002f": "/",
        r"\u003A": ":",
        r"\u003a": ":",
        r"\u0026": "&",
        r"\u003D": "=",
        r"\u003d": "=",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value


def normalize_page_url(url: str) -> str | None:
    try:
        parsed = urlparse(url)
    except ValueError:
        return None
    if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() not in HOSTS:
        return None
    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    if any(path.lower().endswith(ext) for ext in IMAGE_EXTENSIONS):
        return None
    # Query strings on Wix pages usually contain tracking or preview state.
    return urlunparse(("https", "www.wilandcopainting.com", path, "", "", ""))


def canonicalize_image_url(url: str, base_url: str) -> str | None:
    url = clean_embedded_text(url).strip().strip('"\'')
    if not url or url.startswith(("data:", "blob:", "javascript:", "#")):
        return None
    if url.startswith("//"):
        url = "https:" + url
    elif not url.startswith(("http://", "https://")):
        url = urljoin(base_url, url)

    try:
        parsed = urlparse(url)
    except ValueError:
        return None
    if parsed.scheme not in {"http", "https"}:
        return None

    # Strip Wix resize/AVIF transforms and download the original media object.
    if parsed.netloc.lower() == "static.wixstatic.com" and parsed.path.startswith("/media/"):
        match = re.match(r"(/media/[^/?]+?~mv\d+\.[A-Za-z0-9]+)(?:/.*)?$", parsed.path)
        if match:
            return "https://static.wixstatic.com" + match.group(1)
        match = re.match(r"(/media/[^/?]+\.[A-Za-z0-9]+)(?:/.*)?$", parsed.path)
        if match:
            return "https://static.wixstatic.com" + match.group(1)

    # Drop fragments but retain meaningful CDN query parameters.
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, parsed.query, ""))


def looks_like_image_url(url: str) -> bool:
    path = urlparse(url).path.lower()
    return any(path.endswith(ext) for ext in IMAGE_EXTENSIONS) or any(
        marker in url.lower()
        for marker in ("wixstatic.com/media/", "images.unsplash.com/", "images.pexels.com/")
    )


def extract_page_data(page_url: str, text: str) -> tuple[set[str], set[str]]:
    normalized = clean_embedded_text(text)
    soup = BeautifulSoup(text, "html.parser")
    pages: set[str] = set()
    images: set[str] = set()

    for tag in soup.find_all(True):
        # Page links.
        href = tag.get("href")
        if isinstance(href, str):
            absolute = urljoin(page_url, href)
            page = normalize_page_url(absolute)
            if page:
                pages.add(page)

        # Common image/lazy-loading attributes.
        for attr in (
            "src", "data-src", "data-original", "data-lazy-src", "data-image",
            "data-bg", "poster", "content", "href",
        ):
            value = tag.get(attr)
            if isinstance(value, str):
                candidate = canonicalize_image_url(value, page_url)
                if candidate and looks_like_image_url(candidate):
                    images.add(candidate)

        for attr in ("srcset", "data-srcset"):
            value = tag.get(attr)
            if isinstance(value, str):
                for item in value.split(","):
                    candidate_raw = item.strip().split(" ", 1)[0]
                    candidate = canonicalize_image_url(candidate_raw, page_url)
                    if candidate and looks_like_image_url(candidate):
                        images.add(candidate)

        style = tag.get("style")
        if isinstance(style, str):
            for raw_url in re.findall(r"url\((?:['\"])?([^)'\"]+)", style, flags=re.I):
                candidate = canonicalize_image_url(raw_url, page_url)
                if candidate and looks_like_image_url(candidate):
                    images.add(candidate)

    # Internal links embedded inside Wix hydration JSON and scripts.
    for raw_path in re.findall(r"(?:https?://(?:www\.)?wilandcopainting\.com)?(/(?:portfolio|solutions|company|contact|media-center)[^\"'<>\\\s]*)", normalized, flags=re.I):
        page = normalize_page_url(urljoin(page_url, raw_path))
        if page:
            pages.add(page)

    # Direct HTTP image URLs embedded in JSON/JavaScript/CSS.
    for raw_url in re.findall(r"https?://[^\"'<>\s)]+", normalized, flags=re.I):
        candidate = canonicalize_image_url(raw_url.rstrip(".,;]"), page_url)
        if candidate and looks_like_image_url(candidate):
            images.add(candidate)

    # Wix proprietary media URIs: wix:image://v1/<media-id>/<filename>#...
    for media_id, filename in re.findall(r"wix:image://v1/([^/\"'?#]+/[^/\"'?#]+|[^/\"'?#]+)/([^#\"'?]+)", normalized, flags=re.I):
        # The first regex group can occasionally over-capture; the media ID is the first segment.
        media_id = media_id.split("/")[0]
        media_url = f"https://static.wixstatic.com/media/{media_id}"
        candidate = canonicalize_image_url(media_url, page_url)
        if candidate:
            images.add(candidate)

    # More permissive extraction for Wix media IDs in serialized data.
    for media_id in re.findall(r"(?:https://static\.wixstatic\.com)?/media/([A-Za-z0-9_-]+~mv\d+\.(?:jpg|jpeg|png|gif|webp|avif|svg|heic))", normalized, flags=re.I):
        images.add(f"https://static.wixstatic.com/media/{media_id}")

    return pages, images


def crawl_site() -> tuple[list[str], list[str]]:
    queue = list(KNOWN_PAGES)
    queued = set(queue)
    visited: set[str] = set()
    image_urls: set[str] = set()

    while queue and len(visited) < MAX_PAGES:
        page_url = queue.pop(0)
        if page_url in visited:
            continue
        visited.add(page_url)
        print(f"[crawl {len(visited):03d}] {page_url}", flush=True)
        try:
            response = session.get(page_url, timeout=35)
            response.raise_for_status()
        except Exception as exc:
            print(f"  ERROR: {exc}", flush=True)
            continue
        content_type = response.headers.get("content-type", "")
        if "html" not in content_type and "text" not in content_type:
            continue

        pages, images = extract_page_data(page_url, response.text)
        image_urls.update(images)
        for discovered in sorted(pages):
            if discovered not in queued and len(queued) < MAX_PAGES * 3:
                queued.add(discovered)
                queue.append(discovered)
        print(f"  found {len(images)} image URLs; total unique {len(image_urls)}", flush=True)
        time.sleep(0.15)

    return sorted(visited), sorted(image_urls)


def safe_filename(name: str) -> str:
    name = unquote(name)
    name = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._")
    return name[:140] or "image"


def extension_for(url: str, content_type: str) -> str:
    content_type = content_type.split(";", 1)[0].lower().strip()
    if content_type in CONTENT_TYPE_EXT:
        return CONTENT_TYPE_EXT[content_type]
    suffix = Path(unquote(urlparse(url).path)).suffix.lower()
    return suffix if suffix in IMAGE_EXTENSIONS else ".bin"


def download_one(index: int, url: str) -> dict[str, object]:
    try:
        response = session.get(url, timeout=60, stream=True, headers={"Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"})
        response.raise_for_status()
        data = response.content
        if len(data) < 100:
            raise ValueError(f"response too small ({len(data)} bytes)")
        content_type = response.headers.get("content-type", "").split(";", 1)[0].lower().strip()
        ext = extension_for(url, content_type)
        if not content_type.startswith("image/") and ext == ".bin":
            raise ValueError(f"not an image: {content_type or 'unknown content type'}")

        digest = hashlib.sha256(data).hexdigest()
        basename = safe_filename(Path(unquote(urlparse(url).path)).name)
        stem = safe_filename(Path(basename).stem)
        filename = f"{index:04d}_{stem[:90]}_{digest[:10]}{ext}"
        path = FILES_DIR / filename
        path.write_bytes(data)
        return {
            "ok": True,
            "url": url,
            "filename": filename,
            "bytes": len(data),
            "sha256": digest,
            "content_type": content_type,
        }
    except Exception as exc:
        return {"ok": False, "url": url, "error": str(exc)}


def download_images(image_urls: list[str]) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    FILES_DIR.mkdir(parents=True, exist_ok=True)
    successes: list[dict[str, object]] = []
    failures: list[dict[str, object]] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(download_one, i, url): url for i, url in enumerate(image_urls, 1)}
        for completed, future in enumerate(as_completed(futures), 1):
            result = future.result()
            if result.get("ok"):
                successes.append(result)
            else:
                failures.append(result)
            if completed % 20 == 0 or completed == len(futures):
                print(f"[download] {completed}/{len(futures)} processed; {len(successes)} saved", flush=True)

    # Deduplicate identical binaries while retaining a manifest record for each source URL.
    by_hash: dict[str, dict[str, object]] = {}
    for item in sorted(successes, key=lambda x: str(x["filename"])):
        digest = str(item["sha256"])
        if digest in by_hash:
            duplicate_path = FILES_DIR / str(item["filename"])
            if duplicate_path.exists():
                duplicate_path.unlink()
            item["duplicate_of"] = by_hash[digest]["filename"]
        else:
            by_hash[digest] = item
            item["duplicate_of"] = ""

    return successes, failures


def write_manifests(pages: list[str], successes: list[dict[str, object]], failures: list[dict[str, object]]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUTPUT_DIR / "pages_crawled.txt").write_text("\n".join(pages) + "\n", encoding="utf-8")

    with (OUTPUT_DIR / "manifest.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["filename", "duplicate_of", "bytes", "content_type", "sha256", "url"])
        writer.writeheader()
        for item in sorted(successes, key=lambda x: str(x["url"])):
            writer.writerow({key: item.get(key, "") for key in writer.fieldnames})

    with (OUTPUT_DIR / "failed_urls.csv").open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=["url", "error"])
        writer.writeheader()
        for item in sorted(failures, key=lambda x: str(x["url"])):
            writer.writerow({"url": item.get("url", ""), "error": item.get("error", "")})

    unique_files = len(list(FILES_DIR.glob("*")))
    total_bytes = sum(path.stat().st_size for path in FILES_DIR.glob("*") if path.is_file())
    summary = (
        f"Pages crawled: {len(pages)}\n"
        f"Image URL downloads successful: {len(successes)}\n"
        f"Unique image files: {unique_files}\n"
        f"Failed image URLs: {len(failures)}\n"
        f"Total unique image bytes: {total_bytes}\n"
    )
    (OUTPUT_DIR / "README.txt").write_text(summary, encoding="utf-8")
    print(summary, flush=True)


def main() -> int:
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    pages, image_urls = crawl_site()
    print(f"Discovered {len(image_urls)} unique candidate image URLs", flush=True)
    successes, failures = download_images(image_urls)
    write_manifests(pages, successes, failures)
    shutil.make_archive("wilandco-all-images", "zip", root_dir=OUTPUT_DIR)
    print("Created wilandco-all-images.zip", flush=True)
    return 0 if successes else 1


if __name__ == "__main__":
    sys.exit(main())
