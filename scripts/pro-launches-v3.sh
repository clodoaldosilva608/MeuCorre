#!/bin/bash
# 6 lançamentos como PRO — prova de lançamentos ilimitados
set -e
TOTAL=6
for i in $(seq 1 $TOTAL); do
  echo "=== Launch $i/$TOTAL ==="
  # Snapshot para achar o botão Nova corrida
  REFS=$(agent-browser snapshot -i -c 2>&1)
  # Linha: - button "Nova corrida" [ref=e1]
  NOVA_NUM=$(echo "$REFS" | grep 'button "Nova corrida"' | head -1 | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e//')
  [ -z "$NOVA_NUM" ] && { echo "ERROR: no Nova corrida button"; exit 1; }
  agent-browser click "@e${NOVA_NUM}" 2>&1 | tail -1
  sleep 1.5
  # Snapshot do form
  REFS=$(agent-browser snapshot -i -c 2>&1)
  IFOOD_NUM=$(echo "$REFS" | grep 'button "iFood iFood"' | head -1 | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e//')
  R25_NUM=$(echo "$REFS" | grep 'button "R$ 25"' | head -1 | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e//')
  KM_NUM=$(echo "$REFS" | grep 'textbox "0,0"' | head -1 | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e//')
  NOTE_NUM=$(echo "$REFS" | grep 'textbox "ex: bairro' | head -1 | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e//')
  echo "refs: iFood=$IFOOD_NUM R25=$R25_NUM km=$KM_NUM note=$NOTE_NUM"
  agent-browser click "@e${IFOOD_NUM}" 2>&1 | tail -1
  agent-browser click "@e${R25_NUM}" 2>&1 | tail -1
  agent-browser fill "@e${KM_NUM}" "5,0" 2>&1 | tail -1
  agent-browser fill "@e${NOTE_NUM}" "PRO test #$i" 2>&1 | tail -1
  # Re-snapshot pois Lançar Corrida muda de disabled p/ enabled
  REFS2=$(agent-browser snapshot -i -c 2>&1)
  LAUNCH_NUM=$(echo "$REFS2" | grep 'button "Lançar Corrida"' | head -1 | grep -oE 'ref=e[0-9]+' | head -1 | sed 's/ref=e//')
  agent-browser click "@e${LAUNCH_NUM}" 2>&1 | tail -1
  sleep 2
  echo "  -> launch $i OK"
done
echo "=== Final state ==="
agent-browser screenshot /home/z/my-project/screenshots/25-pro-6-launches.png 2>&1 | tail -1
agent-browser snapshot -i -c 2>&1 | grep -E "^- heading" | head -8
