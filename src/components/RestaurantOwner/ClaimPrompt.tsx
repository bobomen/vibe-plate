import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ClaimPrompt() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="border-orange-500/20 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-full flex items-center justify-center">
            <Building2 className="w-10 h-10 text-orange-500" />
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">您還沒有認領餐廳</CardTitle>
            <CardDescription className="text-base">
              立即開始認領流程，解鎖餐廳管理功能
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 步驟說明 */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <span className="text-orange-500">📝</span>
              認領流程（約 5 分鐘）
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-medium">1.</span>
                <span>搜尋並選擇您的餐廳</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-medium">2.</span>
                <span>填寫聯絡資訊</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-medium">3.</span>
                <span>接收並驗證簡訊驗證碼</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-medium">4.</span>
                <span>完成！開始管理您的餐廳</span>
              </div>
            </div>
          </div>

          {/* 功能說明 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">認領後您可以：</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10">
                <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">查看數據分析</p>
                  <p className="text-xs text-muted-foreground">瀏覽量、收藏數、使用者互動</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10">
                <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">更新餐廳資訊</p>
                  <p className="text-xs text-muted-foreground">菜單、營業時間、照片</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10">
                <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">發布優惠活動</p>
                  <p className="text-xs text-muted-foreground">吸引更多顧客上門</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-br from-orange-500/5 to-transparent border border-orange-500/10">
                <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">提升曝光度</p>
                  <p className="text-xs text-muted-foreground">增加平台推薦機會</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA 按鈕 */}
          <div className="pt-4 space-y-3">
            <Button 
              onClick={() => navigate('/app/claim-restaurant')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" 
              size="lg"
            >
              開始認領餐廳
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              免費認領，完成後立即可使用所有管理功能
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
