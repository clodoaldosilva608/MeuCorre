#!/bin/bash
# Simula 6 lançamentos como usuário PRO para verificar limite ilimitado
set -e
TOTAL=6
for i in $(seq 1 $TOTAL); do
  echo "=== Lançamento $i/$TOTAL ==="
  # Abre modal Nova corrida
  agent-browser find role button click --name "Nova corrida" 2>&1 | tail -1
  sleep 1
  # Seleciona iFood
  agent-browser find role button click --name "iFood" 2>&1 | tail -1
  sleep 0.5
  # Clica R$25
  agent-browser find role button click --name 'R$ 25' 2>&1 | tail -1
  sleep 0.5
  # Snapshot pra encontrar textbox da km e nota
  REFS=$(agent-browser snapshot -i -c 2>&1)
  KM_REF=$(echo "$REFS" | grep 'textbox "0,0"' | head -1 | grep -o '@e[0-9]*' | head -1)
  NOTE_REF=$(echo "$REFS" | grep 'bairro Centro' | head -1 | grep -o '@e[0-9]*' | head -1)
  if [ -z "$KM_REF" ] || [ -z "$NOTE_REF" ]; then
    echo "ERROR: Could not find textbox refs"
    echo "$REFS" | head -20
    continue
  fi
  agent-browser fill "$KM_REF" "5,0" 2>&1 | tail -1
  agent-browser fill "$NOTE_REF" "PRO launch #$i" 2>&1 | tail -1
  sleep 0.5
  # Snapshot pra pegar o botão Lançar Corrida (pode estar em ref diferente)
  REFS2=$(agent-browser snapshot -i -c 2>&1)
  LAUNCH_REF=$(echo "$REFS2" | grep 'Lançar Corrida' | head -1 | grep -o '@e[0-9]*' | head -1)
  if [ -z "$LAUNCH_REF" ]; then
    echo "ERROR: Could not find Lançar Corrida button"
    continue
  fi
  agent-browser click "$LAUNCH_REF" 2>&1 | tail -1
  sleep 1.5
  echo "  → Lançamento $i OK"
done
echo "=== Final state ==="
agent-browser snapshot -i -c 2>&1 | grep -E "heading|button \"Nova" | head -8
