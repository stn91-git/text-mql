#!/bin/bash

# go to project dir
cd /home/ubuntu/text-mql/backend

# activate venv
source venv/bin/activate

# run uvicorn
python3 main.py
