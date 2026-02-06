

## 餐廳業者後台模擬數據實作方案

### 目標
在成效總覽頁面加入模擬數據模式，讓你可以：
1. 測試所有 UI 組件的顯示效果
2. 不需要真實數據也能看到完整儀表板
3. 開發環境自動啟用，生產環境完全禁用

---

### 第一部分：建立模擬數據生成器

**新建檔案：`src/utils/mockRestaurantOwnerData.ts`**

包含以下模擬數據生成函數：
- `generateMockOwnerData()` - 模擬餐廳業者身份
- `generateMockRestaurantStats()` - 模擬基礎統計（曝光、點擊等）
- `generateMockExposureMetrics()` - 模擬曝光指標（競爭力、效率評分）
- `generateMockTrendData(days)` - 生成指定天數的趨勢數據

數據特點：
- 有一定隨機性（每次刷新略有不同）
- 數據邏輯合理（如 CTR 在 10-20% 之間）
- 趨勢有自然波動（週末較高、平日較低）

---

### 第二部分：建立開發模式開關

**修改檔案：`src/config/featureFlags.ts`**

新增功能開關：
```typescript
export const ENABLE_MOCK_DATA = 
  import.meta.env.DEV && 
  import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
```

安全機制：
- 只在開發環境（DEV）啟用
- 需要額外設置環境變數才會開啟
- 生產環境完全不會編譯這段代碼

---

### 第三部分：修改相關 Hooks

**修改檔案：`src/hooks/useRestaurantOwner.ts`**

邏輯：
```typescript
if (ENABLE_MOCK_DATA) {
  return generateMockOwnerData();
}
// 否則正常查詢資料庫
```

**修改檔案：`src/hooks/useRestaurantExposureMetrics.ts`**

邏輯：
```typescript
if (ENABLE_MOCK_DATA) {
  return { data: generateMockExposureMetrics(), isLoading: false };
}
```

**修改檔案：`src/hooks/useRestaurantTrend.ts`**

邏輯：
```typescript
if (ENABLE_MOCK_DATA) {
  return { data: generateMockTrendData(daysBack), isLoading: false };
}
```

---

### 第四部分：修改 Overview 頁面

**修改檔案：`src/pages/RestaurantOwner/Overview.tsx`**

變更：
1. 模擬模式時跳過 RPC 查詢
2. 顯示「模擬數據模式」提示 banner
3. 使用模擬數據填充所有卡片

新增 UI 元素：
```
┌─────────────────────────────────────────┐
│ ⚠️ 模擬數據模式 - 僅供開發測試使用      │
└─────────────────────────────────────────┘
```

---

### 模擬數據預覽

**基礎統計卡片：**
| 指標 | 模擬值 |
|------|--------|
| 總曝光次數 | 1,250 |
| 詳細頁瀏覽 | 187 (CTR 15%) |
| 收藏次數 | 42 (收藏率 3.4%) |
| 區域排名 | #7 |

**競爭力指數：**
| 指標 | 模擬值 |
|------|--------|
| 區域排名 | 7 / 156 (前 5%) |
| 菜系排名 | 3 / 42 (前 8%) |

**效率評分：**
| 維度 | 分數 |
|------|------|
| 曝光表現 | 21/25 |
| 互動表現 | 18/25 |
| 收藏表現 | 22/25 |
| 品質表現 | 16/25 |
| **總分** | **77/100** |

**趨勢圖表：**
- 30 天數據點
- 週末數據略高
- 有自然波動（±20%）

---

### 使用方式

**啟用模擬數據：**
1. 在 `.env` 或 `.env.local` 中設置：
   ```
   VITE_ENABLE_MOCK_DATA=true
   ```
2. 重新啟動開發伺服器
3. 訪問 `/app/restaurant-owner-v2/overview`

**關閉模擬數據：**
- 刪除或設為 `false`：`VITE_ENABLE_MOCK_DATA=false`
- 或直接刪除該環境變數

---

### 安全保障

1. **雙重檢查**：`import.meta.env.DEV` + `VITE_ENABLE_MOCK_DATA`
2. **生產環境禁用**：Vite 會在 build 時移除 DEV 相關代碼
3. **視覺提示**：模擬模式有明顯 banner
4. **不影響真實數據**：純前端模擬，不修改資料庫

---

### 預計工作量
- 新建模擬數據生成器：~30 分鐘
- 修改 3 個 hooks：~20 分鐘
- 修改 Overview 頁面：~15 分鐘
- 測試驗證：~15 分鐘

**總計：約 1.5 小時**

