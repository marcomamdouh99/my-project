#!/bin/bash
cd /home/z/my-project
node node_modules/next/dist/bin/next dev -p 3000 2>&1 | tee /home/z/my-project/dev.log
