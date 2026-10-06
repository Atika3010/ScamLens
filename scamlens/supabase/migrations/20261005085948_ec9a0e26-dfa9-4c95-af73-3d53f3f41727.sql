CREATE TABLE public.scam_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verdict text NOT NULL,
  risk_score int NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'Other',
  channel text NOT NULL DEFAULT 'SMS',
  city text NOT NULL DEFAULT 'Unknown',
  language text NOT NULL DEFAULT 'English',
  headline text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scam_checks TO anon, authenticated;
GRANT ALL ON public.scam_checks TO service_role;
ALTER TABLE public.scam_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read anonymised checks" ON public.scam_checks FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.scam_checks (verdict, risk_score, category, channel, city, language, headline, created_at) VALUES
('Scam',96,'KYC / Bank update','SMS','Mumbai','Hinglish','Fake SBI KYC link asking for OTP', now()-interval '20 minutes'),
('Scam',92,'UPI collect request','UPI','Delhi','Hindi','Collect request disguised as refund', now()-interval '45 minutes'),
('Scam',89,'Job / Task offer','WhatsApp','Bengaluru','English','Part-time YouTube like-task job', now()-interval '1 hour'),
('Suspicious',64,'Delivery / Courier','SMS','Hyderabad','English','Parcel held, pay ₹25 redelivery fee', now()-interval '2 hours'),
('Scam',94,'Electricity bill','SMS','Pune','Hinglish','Power will be cut tonight, call officer', now()-interval '3 hours'),
('Scam',90,'KYC / Bank update','SMS','Kolkata','English','PAN not linked, account blocked', now()-interval '4 hours'),
('Safe',8,'Genuine alert','SMS','Chennai','English','Real bank debit alert', now()-interval '5 hours'),
('Scam',97,'Digital arrest','WhatsApp','Delhi','Hindi','Fake CBI officer video call', now()-interval '6 hours'),
('Scam',88,'UPI collect request','UPI','Jaipur','Hinglish','Lottery win, approve ₹1 to receive', now()-interval '7 hours'),
('Suspicious',58,'Investment','WhatsApp','Ahmedabad','English','Stock tips group promising 300%', now()-interval '9 hours'),
('Scam',91,'Job / Task offer','Telegram','Mumbai','Hinglish','Rate hotels, earn ₹5000 daily', now()-interval '11 hours'),
('Scam',85,'Delivery / Courier','SMS','Lucknow','Hindi','FedEx parcel with drugs, call now', now()-interval '13 hours'),
('Scam',93,'Electricity bill','SMS','Bengaluru','English','BESCOM disconnection notice', now()-interval '15 hours'),
('Suspicious',55,'Loan offer','SMS','Patna','Hindi','Instant loan, no documents', now()-interval '18 hours'),
('Scam',95,'Digital arrest','Call','Hyderabad','English','Customs officer demands fine', now()-interval '22 hours'),
('Scam',87,'KYC / Bank update','SMS','Chennai','English','HDFC reward points expiring', now()-interval '1 day'),
('Safe',12,'Genuine alert','SMS','Pune','English','Real OTP from Swiggy', now()-interval '1 day 3 hours'),
('Scam',90,'Investment','WhatsApp','Kolkata','Hinglish','Crypto doubling scheme', now()-interval '1 day 6 hours');