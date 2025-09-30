#!/bin/bash
echo "Building Python downloader for Unix/Linux/macOS..."

mkdir -p dist

pip install pyinstaller

pyinstaller --onefile --name python_downloader --distpath dist python_downloader.py

chmod +x dist/python_downloader

echo "Python downloader built successfully!"
