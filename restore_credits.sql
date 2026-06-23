-- Give 1 free credit to anyone who has 0 credits due to the missing trigger
UPDATE public.profiles 
SET credits = 1 
WHERE credits = 0 OR credits IS NULL;

-- Log the transaction for these users so they have a record of it
INSERT INTO public.transactions (user_id, type, amount, description)
SELECT id, 'credit', 1, 'Welcome Bonus: Credit Restored'
FROM public.profiles
WHERE credits = 1 AND id NOT IN (
    SELECT user_id FROM public.transactions WHERE description LIKE 'Welcome Bonus%'
);
