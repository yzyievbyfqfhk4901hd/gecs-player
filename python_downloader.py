import yt_dlp
import os
import sys
import json
from pathlib import Path
from typing import Dict, Any

class DownloadManager:
    def __init__(self, downloads_dir: str = None):
        self.downloads_dir = downloads_dir or os.path.join(os.path.expanduser("~"), "Documents", "GecsPlayer", "Music")
        self.downloads_dir = Path(self.downloads_dir)
        self.downloads_dir.mkdir(parents=True, exist_ok=True)
        
        self.ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio/best',
            'outtmpl': str(self.downloads_dir / '%(title)s.%(ext)s'),
            'extractaudio': True,
            'audioformat': 'mp3',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'noplaylist': True,
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'writethumbnail': False,
            'writeinfojson': False,
            'logtostderr': False,
            'ignoreerrors': True,
            'nooverwrites': False,
            'retries': 3, 
        }
    
    def download(self, url: str) -> Dict[str, Any]:
        try:
            self._cleanup_temp_files()
            
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                title = info.get('title', 'Unknown')
                duration = info.get('duration', 0)
                artist = info.get('uploader', 'Unknown Artist')
                album = info.get('album', 'Unknown Album')
                
                safe_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).strip()
                if not safe_title:
                    safe_title = "Downloaded_Track"
                
                ydl_opts = self.ydl_opts.copy()
                ydl_opts['outtmpl'] = str(self.downloads_dir / f'{safe_title}.%(ext)s')
                
                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl_download:
                        ydl_download.download([url])
                except Exception as conversion_error:
                    print(f"Conversion failed, trying direct download: {conversion_error}")
                    ydl_opts_direct = ydl_opts.copy()
                    ydl_opts_direct.pop('extractaudio', None)
                    ydl_opts_direct.pop('audioformat', None)
                    ydl_opts_direct.pop('postprocessors', None)
                    ydl_opts_direct['format'] = 'bestaudio[ext=m4a]/bestaudio'
                    ydl_opts_direct['nooverwrites'] = False
                    ydl_opts_direct['retries'] = 3
                    
                    with yt_dlp.YoutubeDL(ydl_opts_direct) as ydl_direct:
                        ydl_direct.download([url])
                
                downloaded_file = self._find_downloaded_file(safe_title)
                
                if downloaded_file:
                    return {
                        'success': True,
                        'file_path': downloaded_file,
                        'filename': os.path.basename(downloaded_file),
                        'title': title,
                        'artist': artist,
                        'album': album,
                        'duration': duration,
                        'url': url
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Download completed but file not found'
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': f'Download failed: {str(e)}'
            }
    
    def _cleanup_temp_files(self):
        try:
            temp_files = list(self.downloads_dir.glob("*.temp.*"))
            for temp_file in temp_files:
                try:
                    temp_file.unlink()
                    print(f"Cleaned up temp file: {temp_file}")
                except Exception as e:
                    print(f"Could not clean up temp file {temp_file}: {e}")
        except Exception as e:
            print(f"Error during temp file cleanup: {e}")

    def _find_downloaded_file(self, title: str) -> str:
        try:
            clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
            
            audio_extensions = ['.mp3', '.m4a', '.webm', '.ogg', '.wav']
            
            for file_path in self.downloads_dir.glob("*"):
                if file_path.is_file() and file_path.suffix.lower() in audio_extensions:
                    if clean_title.lower() in file_path.stem.lower():
                        return str(file_path)
            
            temp_files = []
            for file_path in self.downloads_dir.glob("*.temp.*"):
                if file_path.is_file():
                    temp_files.append(file_path)
            
            if temp_files:
                latest_temp = max(temp_files, key=os.path.getctime)
                try:
                    new_name = latest_temp.with_suffix('.m4a')
                    
                    if new_name.exists():
                        try:
                            latest_temp.unlink()
                            print(f"Removed duplicate temp file: {latest_temp}")
                        except Exception as e:
                            print(f"Could not remove temp file: {e}")
                        return str(new_name)
                    
                    import time
                    max_retries = 3
                    for attempt in range(max_retries):
                        try:
                            latest_temp.rename(new_name)
                            print(f"Successfully renamed temp file to: {new_name}")
                            return str(new_name)
                        except (PermissionError, OSError) as e:
                            if attempt < max_retries - 1:
                                print(f"Rename attempt {attempt + 1} failed, retrying in 0.5s: {e}")
                                time.sleep(0.5)
                            else:
                                print(f"Could not rename temp file after {max_retries} attempts, using as-is: {e}")
                                return str(latest_temp)
                except Exception as rename_error:
                    print(f"Could not rename temp file, using as-is: {rename_error}")
                    return str(latest_temp)
            
            audio_files = []
            for file_path in self.downloads_dir.glob("*"):
                if file_path.is_file() and file_path.suffix.lower() in audio_extensions:
                    audio_files.append(file_path)
            
            if audio_files:
                latest_file = max(audio_files, key=os.path.getctime)
                return str(latest_file)
                
        except Exception as e:
            print(f"Error finding downloaded file: {e}")
        
        return None
    
    def is_valid_url(self, url: str) -> bool:
        if not url or not isinstance(url, str):
            return False
        
        soundcloud_domains = [
            'soundcloud.com', 'm.soundcloud.com'
        ]
        
        url_lower = url.lower().strip()
        
        for domain in soundcloud_domains:
            if domain in url_lower:
                return True
        
        return False

def main():
    import sys
    sys.stderr = open(os.devnull, 'w')
    
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'error': 'No URL provided'
        }))
        sys.exit(1)
    
    url = sys.argv[1]
    downloader = DownloadManager()
    
    if not downloader.is_valid_url(url):
        print(json.dumps({
            'success': False,
            'error': 'Invalid URL'
        }))
        sys.exit(1)
    
    result = downloader.download(url)
    print(json.dumps(result))

if __name__ == "__main__":
    main()
