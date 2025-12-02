import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, MapPin, Mail, Phone, Globe, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CUISINE_OPTIONS } from '@/config/cuisineTypes';
import type { CreateRestaurantForm } from '@/types/claimRestaurant';

const createRestaurantSchema = z.object({
  name: z.string().min(2, { message: '餐廳名稱至少需要2個字符' }).max(100),
  address: z.string().min(5, { message: '地址至少需要5個字符' }).max(200),
  phone: z.string().min(10, { message: '請輸入有效的電話號碼' }),
  email: z.string().email({ message: '請輸入有效的電子郵箱' }),
  city: z.string().optional(),
  district: z.string().optional(),
  cuisine_type: z.string().optional(),
  website: z.string().url({ message: '請輸入有效的網址' }).optional().or(z.literal('')),
  menu_url: z.string().url({ message: '請輸入有效的網址' }).optional().or(z.literal('')),
});

interface CreateRestaurantStepProps {
  onSubmit: (data: CreateRestaurantForm) => Promise<boolean>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function CreateRestaurantStep({ onSubmit, onBack, isSubmitting }: CreateRestaurantStepProps) {
  const form = useForm<CreateRestaurantForm>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      email: '',
      city: '',
      district: '',
      cuisine_type: '',
      website: '',
      menu_url: '',
    },
  });

  const handleSubmit = async (data: CreateRestaurantForm) => {
    const success = await onSubmit(data);
    if (!success) {
      // Error handling is done in the hook
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        返回
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">創建新餐廳</CardTitle>
          <CardDescription>請填寫您的餐廳資訊</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>餐廳名稱 *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} placeholder="餐廳名稱" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>地址 *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} placeholder="完整地址" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>城市</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例：台北市" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>區域</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例：信義區" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cuisine_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>菜系</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="請選擇料理類型" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {CUISINE_OPTIONS.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              <span className="flex items-center gap-2">
                                <span>{option.icon}</span>
                                <span>{option.label}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電話號碼 *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="tel" placeholder="0912345678" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電子郵箱 *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="your@email.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormDescription>驗證碼將發送到此郵箱</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>網站</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="url" placeholder="https://..." className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="menu_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>菜單連結</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Menu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="url" placeholder="https://..." className="pl-10" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '創建中...' : '創建並發送驗證碼'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
