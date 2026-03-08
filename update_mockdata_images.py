import json
import os

def update_mockdata():
    if not os.path.exists('url_mapping.json'):
        print("url_mapping.json not found.")
        return

    with open('url_mapping.json', 'r') as f:
        mapping = json.load(f)
    
    target_file = 'mockData.ts'
    if not os.path.exists(target_file):
        print(f"{target_file} not found.")
        return

    with open(target_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    count = 0
    for local_path, remote_url in mapping.items():
        # local_path is like "/images/exercises/foo.png"
        # We replace both single and double quoted versions to be safe, 
        # though mockData usually uses single quotes or we can just replace the string itself
        if local_path in content:
            content = content.replace(local_path, remote_url)
            count += 1
            
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Updated {count} references in {target_file}")

if __name__ == '__main__':
    update_mockdata()
