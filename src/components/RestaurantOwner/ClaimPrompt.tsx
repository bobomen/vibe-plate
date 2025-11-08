import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle } from 'lucide-react';

export function ClaimPrompt() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">欢迎使用餐厅管理后台</CardTitle>
          <CardDescription>
            认领您的餐厅，开始管理和优化您的线上形象
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              认领餐厅后，您将能够：
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">更新餐厅信息</p>
                  <p className="text-xs text-muted-foreground">完善餐厅资料和照片</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">查看数据分析</p>
                  <p className="text-xs text-muted-foreground">了解餐厅表现和用户行为</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">设置优惠活动</p>
                  <p className="text-xs text-muted-foreground">创建优惠券吸引顾客</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">提升曝光度</p>
                  <p className="text-xs text-muted-foreground">增加餐厅在平台的展示</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button asChild className="w-full" size="lg">
              <a href="/claim-restaurant">开始认领餐厅</a>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              认领流程简单快速，仅需几分钟即可完成
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
