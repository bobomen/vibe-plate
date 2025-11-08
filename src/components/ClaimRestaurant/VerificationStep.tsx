import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VerificationForm } from '@/types/claimRestaurant';

const verificationSchema = z.object({
  code: z.string().length(6, { message: '验证码必须是6位数字' }).regex(/^\d+$/, { message: '验证码必须是数字' }),
});

interface VerificationStepProps {
  onSubmit: (code: string) => Promise<boolean>;
  isSubmitting: boolean;
  email: string;
}

export function VerificationStep({ onSubmit, isSubmitting, email }: VerificationStepProps) {
  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  const handleSubmit = async (data: VerificationForm) => {
    const success = await onSubmit(data.code);
    if (!success) {
      form.reset();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-foreground">输入验证码</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>6位验证码</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        inputMode="numeric"
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                      />
                    </FormControl>
                    <FormDescription>
                      验证码已发送至 {email}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? '验证中...' : '验证'}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              没有收到验证码？请检查垃圾邮件文件夹
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
