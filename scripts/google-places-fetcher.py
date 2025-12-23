#!/usr/bin/env python3
"""
Google Places API 餐廳資料抓取腳本 v2.0 (安全優化版)

使用方式：
1. 在 api_keys.txt 中每行放一個 Google Places API key
2. 執行: python google-places-fetcher.py

功能特色：
- 多帳號輪換避免配額限制
- 支援斷點續傳
- 自動儲存進度
- 輸出 JSON 格式方便匯入
- ✅ 安全性: 不儲存含 API Key 的照片 URL
- ✅ 去重邏輯: 使用 google_place_id 避免重複抓取
- ✅ 座標驗證: 確保在台灣範圍內
- ✅ 重試機制: API 失敗時自動重試（最多 3 次，指數退避）
- ✅ 資料驗證: 驗證必要欄位完整性
- ✅ 完整欄位: 新增電話、網站、營業時間、Google Maps URL
- ✅ 統計報告: 生成詳細抓取報告

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
import re
from typing import List, Dict, Tuple, Optional, Set
from datetime import datetime

# ============================================================
# 安全配置
# ============================================================

# 台灣座標範圍 (用於驗證)
TAIWAN_LAT_RANGE = (21.5, 26.5)   # 緯度範圍
TAIWAN_LNG_RANGE = (119.5, 122.5) # 經度範圍

# 重試配置
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 2  # 指數退避基數（秒）

# 批次配置
SAVE_BATCH_SIZE = 10  # 每 N 筆儲存一次

# ============================================================


class GooglePlacesFetcher:
    def __init__(self, api_keys_file='api_keys.txt'):
        """初始化抓取器"""
        self.api_keys = self.load_api_keys(api_keys_file)
        self.current_key_index = 0
        self.output_dir = 'restaurant_data'
        self.progress_file = f'{self.output_dir}/progress.json'
        self.seen_place_ids_file = f'{self.output_dir}/seen_place_ids.json'
        
        # 確保輸出目錄存在
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 載入進度
        self.progress = self.load_progress()
        
        # ✅ 去重邏輯：載入已抓取的 place_id
        self.seen_place_ids: Set[str] = self.load_seen_place_ids()
        
        # 統計數據
        self.stats = {
            'total_searched': 0,
            'total_fetched': 0,
            'total_duplicates_skipped': 0,
            'total_invalid_coords': 0,
            'total_validation_failed': 0,
            'total_api_errors': 0,
            'start_time': datetime.now().isoformat(),
            'cities': {}
        }
    
    def parse_taiwan_address(self, address: str) -> Tuple[Optional[str], Optional[str]]:
        """
        從台灣地址中提取縣市和區域
        
        Args:
            address: 完整地址字串，例如 "台北市大安區復興南路一段123號"
        
        Returns:
            (city, district): 縣市和區域的 tuple，如果無法解析則返回 (None, None)
        """
        if not address:
            return None, None
        
        # 台灣縣市列表（包含各種可能的寫法）
        cities = [
            '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
            '基隆市', '新竹市', '嘉義市',
            '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
            '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣',
            # 繁簡體變體
            '臺北市', '臺中市', '臺南市', '臺東縣'
        ]
        
        city = None
        district = None
        
        # 1. 嘗試匹配縣市
        for city_name in cities:
            if city_name in address:
                city = city_name
                # 統一繁體字
                city = city.replace('臺', '台')
                break
        
        if not city:
            return None, None
        
        # 2. 提取區域（在縣市之後，路/街/巷之前的部分）
        city_escaped = re.escape(city)
        pattern = rf'{city_escaped}([\u4e00-\u9fff]+?[區鄉鎮市])'
        match = re.search(pattern, address)
        
        if match:
            district = match.group(1)
        
        return city, district
        
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
    
    # ============================================================
    # ✅ 新增：去重邏輯
    # ============================================================
    
    def load_seen_place_ids(self) -> Set[str]:
        """載入已抓取的 place_id 列表"""
        if os.path.exists(self.seen_place_ids_file):
            with open(self.seen_place_ids_file, 'r') as f:
                data = json.load(f)
                seen = set(data)
                print(f'✓ 載入 {len(seen)} 個已抓取的 place_id')
                return seen
        return set()
    
    def save_seen_place_ids(self):
        """儲存已抓取的 place_id 列表"""
        with open(self.seen_place_ids_file, 'w', encoding='utf-8') as f:
            json.dump(list(self.seen_place_ids), f, ensure_ascii=False)
    
    # ============================================================
    # ✅ 新增：座標驗證
    # ============================================================
    
    def validate_coordinates(self, lat: float, lng: float) -> bool:
        """驗證座標是否在台灣範圍內"""
        return (
            TAIWAN_LAT_RANGE[0] <= lat <= TAIWAN_LAT_RANGE[1] and
            TAIWAN_LNG_RANGE[0] <= lng <= TAIWAN_LNG_RANGE[1]
        )
    
    # ============================================================
    # ✅ 新增：資料驗證
    # ============================================================
    
    def validate_restaurant_data(self, data: Dict) -> Tuple[bool, List[str]]:
        """
        驗證餐廳資料完整性
        
        Returns:
            (is_valid, error_messages)
        """
        errors = []
        
        # 必要欄位
        if not data.get('name'):
            errors.append('缺少餐廳名稱')
        
        if data.get('lat') is None or data.get('lng') is None:
            errors.append('缺少座標')
        else:
            if not self.validate_coordinates(data['lat'], data['lng']):
                errors.append(f"座標超出台灣範圍: ({data['lat']}, {data['lng']})")
        
        # Google 評分範圍驗證
        rating = data.get('google_rating')
        if rating is not None and (rating < 0 or rating > 5):
            errors.append(f'評分超出範圍: {rating}')
        
        # price_range 範圍驗證
        price = data.get('price_range')
        if price is not None and (price < 1 or price > 5):
            errors.append(f'價格範圍超出 1-5: {price}')
        
        return len(errors) == 0, errors
    
    # ============================================================
    # ✅ 新增：重試機制
    # ============================================================
    
    def api_request_with_retry(self, url: str, params: Dict, max_retries: int = MAX_RETRIES) -> Optional[Dict]:
        """帶重試機制的 API 請求"""
        for attempt in range(max_retries):
            try:
                response = requests.get(url, params=params, timeout=30)
                data = response.json()
                
                status = data.get('status')
                
                # 成功狀態
                if status in ['OK', 'ZERO_RESULTS']:
                    return data
                
                # 可重試的錯誤
                if status in ['OVER_QUERY_LIMIT', 'UNKNOWN_ERROR']:
                    wait_time = RETRY_BACKOFF_BASE ** attempt
                    print(f'  ⚠ API 回應 {status}，等待 {wait_time} 秒後重試 ({attempt + 1}/{max_retries})')
                    time.sleep(wait_time)
                    # 切換 API Key
                    params['key'] = self.get_current_api_key()
                    continue
                
                # 不可重試的錯誤
                print(f'  ✗ API 錯誤: {status} - {data.get("error_message", "")}')
                self.stats['total_api_errors'] += 1
                return None
                
            except requests.exceptions.Timeout:
                wait_time = RETRY_BACKOFF_BASE ** attempt
                print(f'  ⚠ 請求超時，等待 {wait_time} 秒後重試 ({attempt + 1}/{max_retries})')
                time.sleep(wait_time)
            except requests.exceptions.RequestException as e:
                wait_time = RETRY_BACKOFF_BASE ** attempt
                print(f'  ⚠ 網路錯誤: {e}，等待 {wait_time} 秒後重試 ({attempt + 1}/{max_retries})')
                time.sleep(wait_time)
        
        self.stats['total_api_errors'] += 1
        return None
    
    # ============================================================
    # ✅ 新增：營業時間解析
    # ============================================================
    
    def parse_opening_hours(self, opening_hours: Optional[Dict]) -> Optional[Dict]:
        """
        解析 Google 營業時間格式
        
        返回格式:
        {
            "monday": { "open": "11:00", "close": "21:00" },
            "tuesday": { "open": "11:00", "close": "21:00" },
            ...
        }
        """
        if not opening_hours:
            return None
        
        periods = opening_hours.get('periods', [])
        if not periods:
            return None
        
        days_map = {
            0: 'sunday',
            1: 'monday', 
            2: 'tuesday',
            3: 'wednesday',
            4: 'thursday',
            5: 'friday',
            6: 'saturday'
        }
        
        result = {}
        
        for period in periods:
            open_info = period.get('open', {})
            close_info = period.get('close', {})
            
            day_num = open_info.get('day')
            if day_num is None:
                continue
            
            day_name = days_map.get(day_num)
            if not day_name:
                continue
            
            open_time = open_info.get('time', '')
            close_time = close_info.get('time', '')
            
            # 格式化時間 (1130 -> 11:30)
            if len(open_time) == 4:
                open_time = f'{open_time[:2]}:{open_time[2:]}'
            if len(close_time) == 4:
                close_time = f'{close_time[:2]}:{close_time[2:]}'
            
            result[day_name] = {
                'open': open_time,
                'close': close_time
            }
        
        return result if result else None
    
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
            data = self.api_request_with_retry(url, params)
            
            if data and data.get('status') == 'OK':
                for place in data.get('results', []):
                    place_id = place['place_id']
                    
                    # ✅ 去重檢查
                    if place_id in self.seen_place_ids:
                        self.stats['total_duplicates_skipped'] += 1
                        continue
                    
                    place_ids.append(place_id)
                    self.stats['total_searched'] += 1
                
                # 檢查是否有下一頁
                next_page_token = data.get('next_page_token')
                if not next_page_token:
                    break
                
                # Google 需要稍等才能使用 next_page_token
                time.sleep(2)
                params['pagetoken'] = next_page_token
                params['key'] = self.get_current_api_key()  # 切換 API Key
                if 'radius' in params:
                    del params['radius']  # next page 不需要 radius
            else:
                break
        
        print(f'  ✓ 搜尋完成: 找到 {len(place_ids)} 間新餐廳 (跳過 {self.stats["total_duplicates_skipped"]} 間重複)')
        return place_ids
    
    def get_place_details(self, place_id: str) -> Optional[Dict]:
        """取得餐廳詳細資訊"""
        api_key = self.get_current_api_key()
        
        url = 'https://maps.googleapis.com/maps/api/place/details/json'
        params = {
            'place_id': place_id,
            # ✅ 擴充欄位：新增 phone、website、opening_hours、url
            'fields': 'name,formatted_address,geometry,rating,user_ratings_total,photos,types,price_level,formatted_phone_number,website,opening_hours,url',
            'key': api_key,
            'language': 'zh-TW'
        }
        
        data = self.api_request_with_retry(url, params)
        
        if data and data.get('status') == 'OK':
            result = data['result']
            
            # 解析地址以提取縣市和區域
            address = result.get('formatted_address', '')
            city, district = self.parse_taiwan_address(address)
            
            # 取得座標
            lat = result.get('geometry', {}).get('location', {}).get('lat')
            lng = result.get('geometry', {}).get('location', {}).get('lng')
            
            # ✅ 座標驗證
            if lat is None or lng is None:
                print(f'    ⚠ 缺少座標，跳過')
                self.stats['total_invalid_coords'] += 1
                return None
            
            if not self.validate_coordinates(lat, lng):
                print(f'    ⚠ 座標超出台灣範圍: ({lat}, {lng})，跳過')
                self.stats['total_invalid_coords'] += 1
                return None
            
            # ✅ 修正 price_range 對應：Google 0-4 → 我們 1-5
            google_price_level = result.get('price_level')
            if google_price_level is not None:
                price_range = google_price_level + 1  # 0→1, 1→2, 2→3, 3→4, 4→5
            else:
                price_range = 2  # 預設中等價位
            
            # ✅ 安全處理照片：只儲存 photo_reference，不儲存含 API Key 的 URL
            photo_references = []
            for photo in result.get('photos', [])[:5]:  # 最多 5 張照片
                photo_ref = photo.get('photo_reference')
                if photo_ref:
                    photo_references.append({
                        'reference': photo_ref,
                        'width': photo.get('width'),
                        'height': photo.get('height')
                    })
            
            # 轉換為我們的資料格式
            restaurant = {
                # ✅ 新增 google_place_id 用於去重
                'google_place_id': place_id,
                'name': result.get('name', ''),
                'address': address,
                'city': city,
                'district': district,
                'lat': lat,
                'lng': lng,
                'google_rating': result.get('rating'),
                'google_reviews_count': result.get('user_ratings_total', 0),
                'price_range': price_range,
                'google_types': result.get('types', []),
                # ✅ 安全：儲存 photo_references 而非含 API Key 的 URL
                'photo_references': photo_references,
                # ✅ 新增欄位
                'phone': result.get('formatted_phone_number'),
                'website': result.get('website'),
                'google_maps_url': result.get('url'),
                'business_hours': self.parse_opening_hours(result.get('opening_hours')),
                # 預設值
                'michelin_stars': 0,
                'has_500_dishes': False,
                'bib_gourmand': False,
            }
            
            # ✅ 資料驗證
            is_valid, errors = self.validate_restaurant_data(restaurant)
            if not is_valid:
                print(f'    ⚠ 資料驗證失敗: {", ".join(errors)}')
                self.stats['total_validation_failed'] += 1
                return None
            
            # 標記為已抓取
            self.seen_place_ids.add(place_id)
            self.stats['total_fetched'] += 1
            
            return restaurant
        else:
            return None
    
    def fetch_city_restaurants(self, city: str, location: tuple):
        """抓取指定城市的所有餐廳"""
        if city in self.progress['cities'] and self.progress['cities'][city].get('completed'):
            print(f'⊙ {city} 已完成，跳過')
            return
        
        print(f'\n{"="*50}')
        print(f'開始抓取 {city}...')
        print(f'{"="*50}')
        
        city_start_time = datetime.now()
        city_stats = {
            'searched': 0,
            'fetched': 0,
            'duplicates_skipped': 0,
            'errors': 0
        }
        
        # 1. 搜尋餐廳 place_ids
        place_ids = self.search_restaurants(city, location)
        city_stats['searched'] = len(place_ids)
        
        # 2. 取得每間餐廳的詳細資訊
        restaurants = []
        for i, place_id in enumerate(place_ids):
            progress_pct = ((i + 1) / len(place_ids)) * 100
            print(f'  處理中 {i+1}/{len(place_ids)} ({progress_pct:.1f}%)...', end='\r')
            
            details = self.get_place_details(place_id)
            if details:
                restaurants.append(details)
                city_stats['fetched'] += 1
            else:
                city_stats['errors'] += 1
            
            # 每 N 筆儲存一次
            if (i + 1) % SAVE_BATCH_SIZE == 0:
                self.save_city_restaurants(city, restaurants)
                self.save_seen_place_ids()
            
            # 延遲避免觸發 rate limit
            time.sleep(0.1)
        
        # 最終儲存
        self.save_city_restaurants(city, restaurants)
        self.save_seen_place_ids()
        
        # 更新進度
        city_end_time = datetime.now()
        duration = (city_end_time - city_start_time).total_seconds()
        
        self.progress['cities'][city] = {
            'completed': True,
            'count': len(restaurants),
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration
        }
        self.progress['completed'] += len(restaurants)
        self.save_progress()
        
        # 更新統計
        self.stats['cities'][city] = city_stats
        
        print(f'\n✓ {city} 完成: {len(restaurants)} 間餐廳 (耗時 {duration:.1f} 秒)')
    
    def save_city_restaurants(self, city: str, restaurants: List[Dict]):
        """儲存城市的餐廳資料"""
        filename = f'{self.output_dir}/{city}_restaurants.json'
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(restaurants, f, ensure_ascii=False, indent=2)
    
    def generate_fetch_report(self):
        """✅ 新增：生成抓取報告"""
        self.stats['end_time'] = datetime.now().isoformat()
        
        # 計算總耗時
        start = datetime.fromisoformat(self.stats['start_time'])
        end = datetime.fromisoformat(self.stats['end_time'])
        self.stats['total_duration_seconds'] = (end - start).total_seconds()
        
        # 計算成功率
        total_attempts = self.stats['total_fetched'] + self.stats['total_invalid_coords'] + self.stats['total_validation_failed']
        if total_attempts > 0:
            self.stats['success_rate'] = round(self.stats['total_fetched'] / total_attempts * 100, 2)
        else:
            self.stats['success_rate'] = 0
        
        # 儲存報告
        report_file = f'{self.output_dir}/fetch_report.json'
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, ensure_ascii=False, indent=2)
        
        # 打印報告摘要
        print(f'\n{"="*50}')
        print('📊 抓取報告')
        print(f'{"="*50}')
        print(f'總搜尋數: {self.stats["total_searched"]}')
        print(f'成功抓取: {self.stats["total_fetched"]}')
        print(f'重複跳過: {self.stats["total_duplicates_skipped"]}')
        print(f'座標無效: {self.stats["total_invalid_coords"]}')
        print(f'驗證失敗: {self.stats["total_validation_failed"]}')
        print(f'API 錯誤: {self.stats["total_api_errors"]}')
        print(f'成功率: {self.stats["success_rate"]}%')
        print(f'總耗時: {self.stats["total_duration_seconds"]:.1f} 秒')
        print(f'\n報告已儲存: {report_file}')
    
    def fetch_all(self):
        """抓取所有城市的餐廳資料"""
        cities = {
            '台北': (25.0330, 121.5654),
            '新北': (25.0120, 121.4650),
            '台中': (24.1477, 120.6736),
            '台南': (22.9997, 120.2270),
            '高雄': (22.6273, 120.3014),
        }
        
        print(f'{"="*50}')
        print('Google Places API 餐廳資料抓取腳本 v2.0 (安全優化版)')
        print(f'{"="*50}')
        print(f'使用 {len(self.api_keys)} 個 API keys')
        print(f'已有 {len(self.seen_place_ids)} 間餐廳在去重列表中')
        print(f'預計抓取約 30,000-40,000 間餐廳')
        print()
        print('安全特性:')
        print('  ✓ 去重邏輯 (google_place_id)')
        print('  ✓ 座標驗證 (台灣範圍)')
        print('  ✓ 資料驗證 (必要欄位)')
        print('  ✓ 重試機制 (指數退避)')
        print('  ✓ 安全照片 (photo_references)')
        print()
        
        for city, location in cities.items():
            try:
                self.fetch_city_restaurants(city, location)
            except KeyboardInterrupt:
                print(f'\n⚠ 使用者中斷，儲存進度...')
                self.save_progress()
                self.save_seen_place_ids()
                self.generate_fetch_report()
                exit(0)
            except Exception as e:
                print(f'\n✗ {city} 發生錯誤: {e}')
                continue
        
        print(f'\n{"="*50}')
        print(f'完成！總共抓取 {self.progress["completed"]} 間餐廳')
        print(f'資料儲存在: {self.output_dir}/')
        print(f'{"="*50}')
        
        # 合併所有資料成單一檔案
        self.merge_all_data()
        
        # ✅ 生成抓取報告
        self.generate_fetch_report()
    
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
    print()
    
    # 檢查 API keys 檔案
    if not os.path.exists('api_keys.txt'):
        print('請建立 api_keys.txt 檔案，每行放一個 Google Places API key')
        print('範例：')
        print('AIzaSyABC123...')
        print('AIzaSyDEF456...')
        exit(1)
    
    fetcher = GooglePlacesFetcher()
    fetcher.fetch_all()
