import asyncio
import aiohttp
import base64
import json
import logging
from datetime import datetime
from pathlib import Path

class LocalProxy:
 def __init__(self):
  self.setup_logging()
  self.setup_paths()
  self.load_config()
 
 def setup_logging(self):
  log_dir = Path.home() / "Projects/Dashboard/logs"
  log_dir.mkdir(parents=True, exist_ok=True)
  logging.basicConfig(
   filename=log_dir / f"proxy_{datetime.now().strftime('%Y%m%d')}.log",
   level=logging.INFO,
   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
  )
  self.logger = logging.getLogger("LocalProxy")
 
 def setup_paths(self):
  base_path = Path.home() / "Projects/Dashboard"
  directories = [
   "logs",
   "cache",
   "config",
   "data",
   "temp"
  ]
  for dir_name in directories:
   (base_path / dir_name).mkdir(parents=True, exist_ok=True)
 
 def load_config(self):
  config_path = Path.home() / "Projects/Dashboard/config/proxy_config.json"
  if not config_path.exists():
   default_config = {
    "api_settings": {
     "api_key": "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",
     "base_url": "https://api.anthropic.com"
    },
    "cache_settings": {
     "enable_cache": True,
     "cache_duration": 3600
    }
   }
   config_path.parent.mkdir(parents=True, exist_ok=True)
   with open(config_path, 'w') as f:
    json.dump(default_config, f, indent=4)
  with open(config_path) as f:
   self.config = json.load(f)

 async def send_request(self, message):
  try:
   headers = {
    "x-api-key": self.config["api_settings"]["api_key"],
    "content-type": "application/json"
   }
   async with self.session.post(
    f"{self.config['api_settings']['base_url']}/v1/messages",
    headers=headers,
    json={
     "messages": [{"role": "user", "content": message}],
     "model": "claude-3-opus-20240229",
     "max_tokens": 1024
    }
   ) as response:
    return await response.json()
  except Exception as e:
   self.logger.error(f"Request failed: {str(e)}")
   return None

class CacheManager:
 def __init__(self, cache_dir):
  self.cache_dir = Path(cache_dir)
  self.cache_dir.mkdir(parents=True, exist_ok=True)
 
 def get_cache(self, key):
  cache_file = self.cache_dir / f"{base64.b64encode(key.encode()).decode()}.json"
  if cache_file.exists():
   with open(cache_file) as f:
    data = json.load(f)
    if datetime.fromisoformat(data['timestamp']) + timedelta(seconds=3600) > datetime.now():
     return data['content']
  return None
 
 def set_cache(self, key, content):
  cache_file = self.cache_dir / f"{base64.b64encode(key.encode()).decode()}.json"
  with open(cache_file, 'w') as f:
   json.dump({
    'content': content,
    'timestamp': datetime.now().isoformat()
   }, f)
