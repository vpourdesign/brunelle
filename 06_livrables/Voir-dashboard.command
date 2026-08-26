#!/bin/bash
# BRUNELLE — démarre un serveur local et ouvre le dashboard
cd "$(dirname "$0")"

PORT=8765
# Si le port est déjà pris, on suppose que le serveur roule déjà
if ! lsof -i :$PORT >/dev/null 2>&1; then
  python3 -m http.server $PORT >/dev/null 2>&1 &
  sleep 1
fi

open "http://localhost:$PORT/dashboard.html"
echo "Serveur BRUNELLE actif → http://localhost:$PORT/dashboard.html"
echo "(Ferme cette fenêtre Terminal pour arrêter le serveur.)"
wait
