import requests

base = "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2F"
suffix = "?alt=media"

candidates = [
    "cadeira_extensora_unilateral.png",
    "cadeira_extensora_unilateral.jpg",
    "cadeira_extensora_unilateral.jpeg",
    "Cadeira_Extensora_Unilateral.png",
    "Cadeira_Extensora_Unilateral.jpg"
]

print("Probing URLs for Cadeira Extensora Unilateral...")
for c in candidates:
    url = f"{base}{c}{suffix}"
    try:
        r = requests.head(url)
        if r.status_code == 200:
            print(f"FOUND: {c}")
            print(f"URL: {url}")
            break
        else:
            print(f"404: {c}")
    except:
        print(f"Error: {c}")
