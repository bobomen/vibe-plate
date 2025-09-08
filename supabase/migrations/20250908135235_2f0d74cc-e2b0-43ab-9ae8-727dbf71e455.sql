-- Create subscriptions table for proper subscription management
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT NOT NULL DEFAULT 'basic', -- basic, premium, enterprise
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, pending
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_history table
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT,
  payment_status TEXT NOT NULL, -- completed, pending, failed, refunded
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
FOR UPDATE USING (user_id = auth.uid());

-- RLS policies for payment_history
CREATE POLICY "Users can view own payment history" ON public.payment_history
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment history" ON public.payment_history
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expires_at ON public.subscriptions(expires_at);
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();