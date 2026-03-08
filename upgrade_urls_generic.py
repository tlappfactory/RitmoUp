import re

mock_file = r'c:\RitmoUp\mockData.ts'

with open(mock_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern: https://storage.googleapis.com/ritmoup-b432b.firebasestorage.app/exercises/[SLUG]
# Replacement: https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2F[SLUG]?alt=media

# Note: The slug might contain spaces or characters.
# We capture everything until the closing quote.
pattern = r"https://storage\.googleapis\.com/ritmoup-b432b\.firebasestorage\.app/exercises/([^'\"]+)"

def replacement(match):
    slug = match.group(1)
    # URL encode the slug if needed (e.g. spaces to %20)
    # But usually simple strings
    slug_encoded = slug.replace(' ', '%20')
    return f"https://firebasestorage.googleapis.com/v0/b/ritmoup-b432b.firebasestorage.app/o/exercises%2F{slug_encoded}?alt=media"

new_content, count = re.subn(pattern, replacement, content)

with open(mock_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Generic upgrade applied to {count} URLs.")
