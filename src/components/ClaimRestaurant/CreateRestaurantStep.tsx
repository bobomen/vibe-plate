import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, MapPin, Mail, Phone, Globe, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CreateRestaurantForm } from '@/types/claimRestaurant';

const createRestaurantSchema = z.object({
  name: z.string().min(2, { message: '餐厅名称至少需要2个字符' }).max(100),
  address: z.string().min(5, { message: '地址至少需要5个字符' }).max(200),
  phone: z.string().min(10, { message: '请输入有效的电话号码' }),
  email: z.string().email({ message: '请输入有效的电子邮箱' }),
  city: z.string().optional(),
  district: z.string().optional(),
  cuisine_type: z.string().optional(),
  website: z.string().url({ message: '请输入有效的网址' }).optional().or(z.literal('')),
  menu_url: z.string().url({ message: '请输入有效的网址' }).optional().or(z.literal('')),
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
          <CardTitle className="text-foreground">创建新餐厅</CardTitle>
          <CardDescription>请填写您的餐厅信息</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>餐厅名称 *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} placeholder="餐厅名称" className="pl-10" />
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
                      <FormLabel>区域</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="例：信义区" />
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
                      <Input {...field} placeholder="例：意大利菜、日本料理" />
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
                    <FormLabel>电话号码 *</FormLabel>
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
                    <FormLabel>电子邮箱 *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="your@email.com" className="pl-10" />
                      </div>
                    </FormControl>
                    <FormDescription>验证码将发送到此邮箱</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>网站</FormLabel>
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
                    <FormLabel>菜单链接</FormLabel>
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
                  {isSubmitting ? '创建中...' : '创建并发送验证码'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
