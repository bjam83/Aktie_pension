alter function public.enforce_max_persons() set search_path = public;
alter function public.set_updated_at() set search_path = public;
revoke execute on function public.handle_new_user() from anon, authenticated;
