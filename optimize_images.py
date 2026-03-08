import os
from PIL import Image

def optimize_images(directory):
    total_saved = 0
    count = 0
    
    print(f"Scanning {directory}...")
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                filepath = os.path.join(root, file)
                try:
                    original_size = os.path.getsize(filepath)
                    
                    # Skip small files (less than 500KB)
                    if original_size < 500 * 1024:
                        continue
                        
                    with Image.open(filepath) as img:
                        # Calculate new size maintaining aspect ratio
                        max_width = 1280
                        if img.width > max_width:
                            ratio = max_width / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        
                        # Save with optimization
                        # We overwrite the file to keep the same extension and path
                        img.save(filepath, optimize=True, quality=85)
                    
                    new_size = os.path.getsize(filepath)
                    saved = original_size - new_size
                    total_saved += saved
                    count += 1
                    
                    print(f"Optimized {file}: {original_size/1024/1024:.2f}MB -> {new_size/1024/1024:.2f}MB (Saved {saved/1024/1024:.2f}MB)")
                    
                except Exception as e:
                    print(f"Error optimizing {file}: {e}")

    print(f"\nOptimization Complete!")
    print(f"Total files optimized: {count}")
    print(f"Total space saved: {total_saved/1024/1024:.2f} MB")

if __name__ == "__main__":
    target_dir = os.path.normpath(os.path.join(os.getcwd(), 'public/images/exercises'))
    optimize_images(target_dir)
