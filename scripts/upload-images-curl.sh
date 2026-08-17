#!/bin/bash
# Upload das 450 imagens — uma por vez via curl
# Redimensiona com sharp (Node.js) antes do upload

set -e

BASE_URL="https://meucorre.vercel.app"
IMAGES_DIR="/home/z/my-project/tmp/pacote-visual-extracted"
LOG_FILE="/home/z/my-project/tmp/upload-curl.log"
SUCCESS=0
FAILED=0
TOTAL=0

echo "============================================================" | tee "$LOG_FILE"
echo "📤 Upload via curl + sharp — 450 imagens" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"

# Login
echo "🔐 Login..." | tee -a "$LOG_FILE"
COOKIE_FILE="/tmp/meucorre-upload-cookies.txt"
curl -s -X POST "$BASE_URL/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"clodoaldo608@gmail.com","password":"${ADMIN_PASSWORD:?ADMIN_PASSWORD must be set}"}' \
  -c "$COOKIE_FILE" -o /dev/null
echo "   ✅ Login OK" | tee -a "$LOG_FILE"

# Lista imagens
IMAGES=$(find "$IMAGES_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" \) | sort)
TOTAL=$(echo "$IMAGES" | wc -l)
echo "" | tee -a "$LOG_FILE"
echo "📦 $TOTAL imagens encontradas" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

i=0
echo "$IMAGES" | while read IMAGE_PATH; do
    i=$((i + 1))
    FILENAME=$(basename "$IMAGE_PATH")
    PCT=$((i * 100 / TOTAL))
    
    # Redimensiona com node + sharp
    RESIZED=$(node -e "
const sharp = require('sharp');
const fs = require('fs');
sharp('$IMAGE_PATH')
  .resize(1080, 1080, { fit: 'inside', withoutEnlargement: true })
  .flatten({ background: '#ffffff' })
  .jpeg({ quality: 85 })
  .toBuffer()
  .then(buf => {
    const out = '/tmp/upload-tmp.jpg';
    fs.writeFileSync(out, buf);
    console.log(out + '|' + buf.length);
  })
  .catch(err => { console.error(err); process.exit(1); });
" 2>/dev/null)
    
    if [ -z "$RESIZED" ]; then
        echo "[$i/$TOTAL] ❌ resize failed: $FILENAME" >> "$LOG_FILE"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    TMP_FILE=$(echo "$RESIZED" | cut -d'|' -f1)
    FILE_SIZE=$(echo "$RESIZED" | cut -d'|' -f2)
    
    # Upload via curl
    HTTP_CODE=$(curl -s -o /tmp/upload-response.json -w "%{http_code}" \
      -X POST "$BASE_URL/api/admin/promotion/assets/upload" \
      -b "$COOKIE_FILE" \
      -F "file=@${TMP_FILE};type=image/jpeg" \
      -F "name=${FILENAME}" \
      -F "source=upload_admin" \
      --max-time 30)
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        SUCCESS=$((SUCCESS + 1))
        printf "\r[%d/%d] %d%% ✅ %s                    " "$i" "$TOTAL" "$PCT" "$FILENAME" >> /dev/tty 2>/dev/null || true
        echo "[$i/$TOTAL] ✅ $FILENAME (${FILE_SIZE} bytes)" >> "$LOG_FILE"
    else
        FAILED=$((FAILED + 1))
        ERROR=$(cat /tmp/upload-response.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown'))" 2>/dev/null || echo "HTTP $HTTP_CODE")
        echo "[$i/$TOTAL] ❌ $FILENAME: $ERROR" >> "$LOG_FILE"
    fi
    
    # Limpa arquivo temporário
    rm -f "$TMP_FILE"
    
    # Pequeno delay
    sleep 0.1
done

echo "" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "📊 RELATÓRIO" | tee -a "$LOG_FILE"
echo "   ✅ Sucesso: $SUCCESS" | tee -a "$LOG_FILE"
echo "   ❌ Falha:   $FAILED" | tee -a "$LOG_FILE"
echo "   📁 Total:   $TOTAL" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "🔗 Valide: $BASE_URL/admin/divulgacao" | tee -a "$LOG_FILE"
