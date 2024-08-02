#!/bin/sh
if [ "$START_MODE" = "cluster" ]; then
  npm run cluster
else
  npm start
fi
