-- Run this file once in the Supabase SQL editor after deploying
-- send-review-followups and creating the REVIEW_CRON_SECRET function secret.
-- Replace the two CHANGE_ME values before executing this file.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://dspmhbplupxzubrglafa.supabase.co',
  'wearevents_project_url'
)
where not exists (
  select 1 from vault.decrypted_secrets where name = 'wearevents_project_url'
);

select vault.create_secret(
  'CHANGE_ME_USE_THE_SAME_VALUE_AS_REVIEW_CRON_SECRET',
  'wearevents_review_cron_secret'
)
where not exists (
  select 1 from vault.decrypted_secrets where name = 'wearevents_review_cron_secret'
);

select vault.create_secret(
  'CHANGE_ME_USE_YOUR_SUPABASE_PUBLISHABLE_KEY',
  'wearevents_publishable_key'
)
where not exists (
  select 1 from vault.decrypted_secrets where name = 'wearevents_publishable_key'
);

select cron.unschedule(jobid)
from cron.job
where jobname = 'wearevents-review-followups';

select cron.schedule(
  'wearevents-review-followups',
  '15 11 * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret
      from vault.decrypted_secrets
      where name = 'wearevents_project_url'
    ) || '/functions/v1/send-review-followups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'wearevents_publishable_key'
      ),
      'x-review-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'wearevents_review_cron_secret'
      )
    ),
    body := jsonb_build_object('triggered_at', now())
  ) as request_id;
  $$
);
