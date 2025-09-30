@echo off
echo Building Python downloader for Windows...

if not exist "dist" mkdir dist

pip install pyinstaller

pyinstaller --onefile --name python_downloader --distpath dist python_downloader.py

echo Python downloader built successfully!
