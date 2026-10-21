"""Explicit network acquisition only. Preparation/training never download data."""
import argparse
import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
URL = "https://archive.ics.uci.edu/static/public/179/secom.zip"
MAX_BYTES = 10_000_000


def acquire(destination: Path, lock_path: Path = ROOT / "source-lock.json") -> dict:
    lock = json.loads(lock_path.read_text())
    request = urllib.request.Request(URL, headers={"User-Agent": "GridMind-GM-MVP-005/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.geturl() != URL:
            raise ValueError("Unexpected redirect: source must remain the official pinned UCI URL")
        payload = response.read(MAX_BYTES + 1)
        headers = {key: response.headers.get(key) for key in ("Last-Modified", "ETag", "Content-Type")}
    if len(payload) > MAX_BYTES:
        raise ValueError("Source archive exceeds the bounded download size")
    checksum = hashlib.sha256(payload).hexdigest()
    if checksum != lock["archive_sha256"]:
        raise ValueError("Source checksum changed; stop and review, do not silently update the lock")
    destination.mkdir(parents=True, exist_ok=True)
    archive = destination / "secom.zip"
    archive.write_bytes(payload)
    receipt = {"url": URL, "downloaded_at_utc": datetime.now(timezone.utc).isoformat(),
               "archive_sha256": checksum, "bytes": len(payload), "response_headers": headers}
    (destination / "acquisition.json").write_text(json.dumps(receipt, indent=2) + "\n")
    return receipt


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=ROOT / "cache")
    print(json.dumps(acquire(parser.parse_args().cache), indent=2))
