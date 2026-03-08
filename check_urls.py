import requests

urls = [
    "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Fbutt_kicks.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Fmesa_flexora_unilateral.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Ftriceps_corda_unilateral.png?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2Fremada_cavalinho_T.jpeg?alt=media"
]

print("Checking URLs...")
for url in urls:
    try:
        r = requests.head(url)
        print(f"\nURL: {url}")
        print(f"Status: {r.status_code}")
        print(f"Content-Type: {r.headers.get('Content-Type')}")
        print(f"Content-Length: {r.headers.get('Content-Length')}")
    except Exception as e:
        print(f"\nError checking {url}: {e}")
