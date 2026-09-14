#!/bin/bash
# Build script for Zella Portfolio
# Run: chmod +x build.sh && ./build.sh

echo "🔧 Building Zella Portfolio..."

# Create dist directory
mkdir -p dist
mkdir -p dist/assets/images
mkdir -p dist/assets/fonts
mkdir -p dist/assets/files

# Check if tools are installed
command -v npx >/dev/null 2>&1 || { echo "❌ npx required. Install Node.js first."; exit 1; }

# 1. Minify CSS
echo "📦 Minifying CSS..."
if command -v npx >/dev/null 2>&1; then
  npx clean-css-cli styles.css -o dist/styles.min.css
  echo "   ✓ CSS minified: $(du -h dist/styles.min.css | cut -f1)"
else
  cp styles.css dist/styles.min.css
  echo "   ⚠ clean-css not available, copied original"
fi

# 2. Minify JavaScript
echo "📦 Minifying JavaScript..."
for js in script.js fluid-effect.js liquid-border.js ink-effect.js sw.js; do
  if [ -f "$js" ]; then
    if command -v npx >/dev/null 2>&1; then
      npx terser "$js" -o "dist/${js%.js}.min.js" -c -m
      echo "   ✓ $js minified"
    else
      cp "$js" "dist/$js"
    fi
  fi
done

# 3. Convert images to WebP (if cwebp is installed)
echo "🖼️  Converting images to WebP..."
if command -v cwebp >/dev/null 2>&1; then
  find assets/images -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \) | while read img; do
    output="dist/${img%.*}.webp"
    mkdir -p "$(dirname "$output")"
    cwebp -q 85 "$img" -o "$output" 2>/dev/null
  done
  echo "   ✓ Images converted to WebP"
else
  echo "   ⚠ cwebp not installed. Install with: brew install webp"
  echo "   Copying original images..."
  cp -r assets/images/* dist/assets/images/
fi

# 4. Copy other assets
echo "📂 Copying assets..."
cp -r assets/fonts/* dist/assets/fonts/
cp -r assets/files/* dist/assets/files/ 2>/dev/null || true

# 5. Copy and update HTML files
echo "📄 Processing HTML files..."
for html in *.html; do
  # Replace CSS/JS references with minified versions
  sed -e 's/styles\.css/styles.min.css/g' \
      -e 's/script\.js/script.min.js/g' \
      -e 's/fluid-effect\.js/fluid-effect.min.js/g' \
      -e 's/liquid-border\.js/liquid-border.min.js/g' \
      "$html" > "dist/$html"
done
echo "   ✓ HTML files processed"

# 6. Copy additional files
cp robots.txt dist/ 2>/dev/null || true
cp sitemap.xml dist/ 2>/dev/null || true
cp sw.js dist/ 2>/dev/null || true

echo ""
echo "✅ Build complete! Output in ./dist/"
echo ""
echo "📊 Size comparison:"
echo "   Original CSS: $(du -h styles.css | cut -f1)"
[ -f dist/styles.min.css ] && echo "   Minified CSS: $(du -h dist/styles.min.css | cut -f1)"
