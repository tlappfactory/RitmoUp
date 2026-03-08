import requests

base = "https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2F"
suffix = "?alt=media"

candidates = [
    "puxada_frente_polia.png",
    "puxada_frente_polia.jpg",
    "puxada_frente_polia.jpeg",
    "Puxada_Frente_Polia.png",
    "puxada_frente_polia.PNG"
]

print("Probing URLs...")
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
