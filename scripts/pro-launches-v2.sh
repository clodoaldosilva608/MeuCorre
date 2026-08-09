#!/bin/bash
# 6 lançamentos limpos com wait explícito
set -e
TOTAL=6
for i in $(seq 1 $TOTAL); do
  echo "=== Launch $i ==="
  # Snapshot para achar o botão Nova corrida atual
  REFS=$(agent-browser snapshot -i -c 2>&1)
  NOVA_REF=$(echo "$REFS" | grep 'button "Nova corrida"' | head -1 | grep -o '@e[0-9]*' | head -1)
  [ -z "$NOVA_REF" ] && { echo "no Nova corrida button"; echo "$REFS" | head -20; exit 1; }
  agent-browser click "$NOVA_REF" 2>&1 | tail -1
  sleep 1.5
  # Snapshot para achar botões do form
  REFS=$(agent-browser snapshot -i -c 2>&1)
  IFOOD_REF=$(echo "$REFS" | grep 'button "iFood iFood"' | head -1 | grep -o '@e[0-9]*' | head -1)
  R25_REF=$(echo "$REFS" | grep 'button "R$ 25"' | head -1 | grep -o '@e[0-9]*' | head -1)
  KM_REF=$(echo "$REFS" | grep 'textbox "0,0"' | head -1 | grep -o '@e[0-9]*' | head -1)
  NOTE_REF=$(echo "$REFS" | grep 'textbox "ex: bairro' | head -1 | grep -o '@e[0-9]*' | head -1)
  LAUNCH_REF=$(echo "$REFS" | grep 'button "Lançar Corrida"' | head -1 | grep -o '@e[0-9]*' | head -1)
  echo "refs: iFood=$IFOOD_REF R25=$R25_REF km=$KM_REF note=$NOTE_REF launch=$LAUNCH_REF"
  agent-browser click "$IFOOD_REF" 2>&1 | tail -1
  agent-browser click "$R25_REF" 2>&1 | tail -1
  agent-browser fill "$KM_REF" "5,0" 2>&1 | tail -1
  agent-browser fill "$NOTE_REF" "PRO test #$i" 2>&1 | tail -1
  # Re-snapshot pois o botão Lançar pode mudar de disabled p/ enabled
  REFS2=$(agent-browser snapshot -i -c 2>&1)
  LAUNCH_REF=$(echo "$REFS2" | grep 'button "Lançar Corrida"' | head -1 | grep -o '@e[0-9]*' | head -1)
  agent-browser click "$LAUNCH_REF" 2>&1 | tail -1
  sleep 2
  echo "  -> launch $i done"
done
echo "=== Final ==="
agent-browser snapshot -i -c 2>&1 | grep -E "heading|^- button \"Nova" | head -10
