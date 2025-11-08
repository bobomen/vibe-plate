import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SearchedRestaurant, ContactInfoForm } from '@/types/claimRestaurant';

const contactInfoSchema = z.object({
  email: z.string().email({ message: '請輸入有效的電子郵箱' }),
  phone: z.string().min(10, { message: '請輸入有效的電話號碼' }),
});

interface ContactInfoStepProps {
  restaurant: SearchedRestaurant;
  onSubmit: (data: ContactInfoForm) => Promise<boolean>;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ContactInfoStep({ restaurant, onSubmit, onBack, isSubmitting }: ContactInfoStepProps) {
  const form = useForm<ContactInfoForm>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: {
      email: '',
      phone: restaurant.phone || '',
    },
  });

  const handleSubmit = async (data: ContactInfoForm) => {
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
          <CardTitle className="text-foreground">認領餐廳</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-foreground">{restaurant.name}</h3>
            <p className="text-sm text-muted-foreground">{restaurant.address}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>電子郵箱</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="email" placeholder="your@email.com" className="pl-10" />
                      </div>
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
                    <FormLabel>電話號碼</FormLabel>
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

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? '發送中...' : '發送驗證碼'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
