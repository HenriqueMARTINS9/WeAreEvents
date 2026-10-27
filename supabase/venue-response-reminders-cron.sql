-- Run once after deploying send-venue-response-reminders.
-- Reuses the Vault values created for review follow-ups.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'wearevents-venue-response-reminders';

select cron.schedule(
  'wearevents-venue-response-reminders',
  '10 * * * *',
  $$
  select net.http_post(
    url := (
      select decrypted_secret from vault.decrypted_secrets where name = 'wearevents_project_url'
    ) || '/functions/v1/send-venue-response-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'wearevents_publishable_key'),
      'x-review-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'wearevents_review_cron_secret')
    ),
    body := jsonb_build_object('triggered_at', now())
  ) as request_id;
  $$
);
