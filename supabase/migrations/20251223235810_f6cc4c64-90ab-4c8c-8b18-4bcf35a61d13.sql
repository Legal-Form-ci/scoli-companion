-- Enable realtime for orders table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for payments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;