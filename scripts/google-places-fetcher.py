#!/usr/bin/env python3
"""
Google Places API 餐廳資料抓取腳本

使用方式：
1. 在 api_keys.txt 中每行放一個 Google Places API key
2. 執行: python google-places-fetcher.py

功能特色：
- 多帳號輪換避免配額限制
- 支援斷點續傳
- 自動儲存進度
- 輸出 JSON 格式方便匯入

預估資料量：
- 台北: 10,000 間餐廳
- 新北: 8,000 間餐廳  
- 台中: 6,000 間餐廳
- 台南: 4,000 間餐廳
- 高雄: 5,000 間餐廳
- 總計: 33,000 間餐廳

Google Places API 免費額度：
- $200/月 ≈ 10,000 次 Place Details 請求
- 建議使用 3-4 個帳號分散請求
"""

import requests
import json
import time
import os
from typing import List, Dict
from datetime import datetime

class GooglePlacesFetcher:
    def __init__(self, api_keys_file='api_keys.txt'):
        """初始化抓取器"""
        self.api_keys = self.load_api_keys(api_keys_file)
        self.current_key_index = 0
        self.output_dir = 'restaurant_data'
        self.progress_file = f'{self.output_dir}/progress.json'
        
        # 確保輸出目錄存在
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 載入進度
        self.progress = self.load_progress()
        
    def load_api_keys(self, filename: str) -> List[str]:
        """載入 API keys"""
        try:
            with open(filename, 'r') as f:
                keys = [line.strip() for line in f if line.strip()]
            print(f'✓ 載入 {len(keys)} 個 API keys')
            return keys
        except FileNotFoundError:
            print(f'✗ 找不到 {filename}，請建立此檔案並加入 API keys（每行一個）')
            exit(1)
    
    def get_current_api_key(self) -> str:
        """取得當前使用的 API key（輪換）"""
        key = self.api_keys[self.current_key_index]
        self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
        return key
    
    def load_progress(self) -> Dict:
        """載入抓取進度"""
        if os.path.exists(self.progress_file):
            with open(self.progress_file, 'r') as f:
                progress = json.load(f)
            print(f'✓ 載入進度: {progress.get("completed", 0)} 間已完成')
            return progress
        return {
            'completed': 0,
            'cities': {},
            'last_update': None
        }
    
    def save_progress(self):
        """儲存進度"""
        self.progress['last_update'] = datetime.now().isoformat()
        with open(self.progress_file, 'w', encoding='utf-8') as f:
            json.dump(self.progress, f, ensure_ascii=False, indent=2)
    
    def search_restaurants(self, city: str, location: tuple, radius: int = 5000) -> List[str]:
        """搜尋指定城市的餐廳，返回 place_id 列表"""
        api_key = self.get_current_api_key()
        place_ids = []
        
        url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        params = {
            'location': f'{location[0]},{location[1]}',
            'radius': radius,
            'type': 'restaurant',
            'key': api_key,
            'language': 'zh-TW'
        }
        
        while True:
            response = requests.get(url, params=params)
            data = response.json()
            
            if data.get('status') == 'OK':
                for place in data.get('results', []):
                    place_ids.append(place['place_id'])
                
                # 檢查是否有下一頁
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
                
                # Google 需要稍等才能使用 next_page_token
                time.sleep(2)
                params['pagetoken'] = next_page_token
                del params['radius']  # next page 不需要 radius
            else:
                print(f'✗ 搜尋失敗: {data.get("status")} - {data.get("error_message", "")}')
                break
        
        print(f'✓ {city}: 找到 {len(place_ids)} 間餐廳')
        return place_ids
    
    def get_place_details(self, place_id: str) -> Dict:
        """取得餐廳詳細資訊"""
        api_key = self.get_current_api_key()
        
        url = 'https://maps.googleapis.com/maps/api/place/details/json'
        params = {
            'place_id': place_id,
            'fields': 'name,formatted_address,geometry,rating,user_ratings_total,photos,types,price_level',
            'key': api_key,
            'language': 'zh-TW'
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data.get('status') == 'OK':
            result = data['result']
            
            # 轉換為我們的資料格式
            restaurant = {
                'name': result.get('name', ''),
                'address': result.get('formatted_address', ''),
                'lat': result['geometry']['location']['lat'],
                'lng': result['geometry']['location']['lng'],
                'google_rating': result.get('rating', 0),
                'google_reviews_count': result.get('user_ratings_total', 0),
                'price_range': result.get('price_level', 2),
                'google_types': result.get('types', []),
                'photos': [
                    f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference={photo['photo_reference']}&key={api_key}"
                    for photo in result.get('photos', [])[:5]  # 最多 5 張照片
                ],
                'michelin_stars': 0,  # 需要另外判斷
                'has_500_dishes': False,  # 需要另外判斷
                'bib_gourmand': False,  # 需要另外判斷
            }
            
            return restaurant
        else:
            print(f'✗ 取得詳情失敗: {data.get("status")}')
            return None
    
    def fetch_city_restaurants(self, city: str, location: tuple):
        """抓取指定城市的所有餐廳"""
        if city in self.progress['cities']:
            print(f'⊙ {city} 已完成，跳過')
            return
        
        print(f'\n開始抓取 {city}...')
        
        # 1. 搜尋餐廳 place_ids
        place_ids = self.search_restaurants(city, location)
        
        # 2. 取得每間餐廳的詳細資訊
        restaurants = []
        for i, place_id in enumerate(place_ids):
            print(f'  處理中 {i+1}/{len(place_ids)}...', end='\r')
            
            details = self.get_place_details(place_id)
            if details:
                restaurants.append(details)
            
            # 每 10 筆儲存一次
            if (i + 1) % 10 == 0:
                self.save_city_restaurants(city, restaurants)
            
            # 延遲避免觸發 rate limit
            time.sleep(0.1)
        
        # 最終儲存
        self.save_city_restaurants(city, restaurants)
        
        # 更新進度
        self.progress['cities'][city] = {
            'completed': True,
            'count': len(restaurants),
            'timestamp': datetime.now().isoformat()
        }
        self.progress['completed'] += len(restaurants)
        self.save_progress()
        
        print(f'\n✓ {city} 完成: {len(restaurants)} 間餐廳')
    
    def save_city_restaurants(self, city: str, restaurants: List[Dict]):
        """儲存城市的餐廳資料"""
        filename = f'{self.output_dir}/{city}_restaurants.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(restaurants, f, ensure_ascii=False, indent=2)
    
    def fetch_all(self):
        """抓取所有城市的餐廳資料"""
        cities = {
            '台北': (25.0330, 121.5654),
            '新北': (25.0120, 121.4650),
            '台中': (24.1477, 120.6736),
            '台南': (22.9997, 120.2270),
            '高雄': (22.6273, 120.3014),
        }
        
        print(f'=== 開始抓取台灣5大城市餐廳資料 ===')
        print(f'使用 {len(self.api_keys)} 個 API keys')
        print(f'預計抓取約 30,000-40,000 間餐廳\n')
        
        for city, location in cities.items():
            try:
                self.fetch_city_restaurants(city, location)
            except Exception as e:
                print(f'✗ {city} 發生錯誤: {e}')
                continue
        
        print(f'\n=== 完成！總共抓取 {self.progress["completed"]} 間餐廳 ===')
        print(f'資料儲存在: {self.output_dir}/')
        
        # 合併所有資料成單一檔案
        self.merge_all_data()
    
    def merge_all_data(self):
        """合併所有城市資料成單一 JSON 檔案"""
        all_restaurants = []
        
        for filename in os.listdir(self.output_dir):
            if filename.endswith('_restaurants.json'):
                with open(f'{self.output_dir}/{filename}', 'r', encoding='utf-8') as f:
                    restaurants = json.load(f)
                    all_restaurants.extend(restaurants)
        
        output_file = f'{self.output_dir}/all_restaurants.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_restaurants, f, ensure_ascii=False, indent=2)
        
        print(f'✓ 已合併: {output_file} ({len(all_restaurants)} 間餐廳)')


if __name__ == '__main__':
    print('Google Places API 餐廳資料抓取腳本')
    print('===================================\n')
    
    # 檢查 API keys 檔案
    if not os.path.exists('api_keys.txt'):
        print('請建立 api_keys.txt 檔案，每行放一個 Google Places API key')
        print('範例：')
        print('AIzaSyABC123...')
        print('AIzaSyDEF456...')
        exit(1)
    
    fetcher = GooglePlacesFetcher()
    fetcher.fetch_all()
