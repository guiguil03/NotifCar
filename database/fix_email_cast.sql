-- Corriger le cast de email dans get_user_conversations
drop function if exists public.get_user_conversations(uuid);

create or replace function public.get_user_conversations(user_uuid uuid)
returns table (
  conversation_id uuid,
  vehicle_id uuid,
  status text,
  subject text,
  created_at timestamptz,
  last_message_at timestamptz,
  vehicle_brand text,
  vehicle_model text,
  vehicle_license_plate text,
  other_participant_id uuid,
  other_participant_email text,
  last_message_content text,
  unread_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    c.id as conversation_id,
    c.vehicle_id,
    c.status::text,
    c.subject::text,
    c.created_at,
    c.updated_at as last_message_at,
    v.brand::text as vehicle_brand,
    v.model::text as vehicle_model,
    v.license_plate::text as vehicle_license_plate,
    case 
      when c.owner_id = user_uuid then c.reporter_id
      else c.owner_id
    end as other_participant_id,
    case 
      when c.owner_id = user_uuid then au_reporter.email::text
      else au_owner.email::text
    end as other_participant_email,
    last_msg.content::text as last_message_content,
    coalesce(unread.unread_count, 0) as unread_count
  from public.conversations c
  inner join public.conversation_participants cp on cp.conversation_id = c.id
  inner join public.vehicles v on v.id = c.vehicle_id
  left join auth.users au_owner on au_owner.id = c.owner_id
  left join auth.users au_reporter on au_reporter.id = c.reporter_id
  left join lateral (
    select content
    from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc
    limit 1
  ) last_msg on true
  left join lateral (
    select count(*) as unread_count
    from public.messages m
    where m.conversation_id = c.id
      and m.sender_id != user_uuid
      and m.is_read = false
  ) unread on true
  where cp.user_id = user_uuid
  order by c.updated_at desc;
end;
$$;

grant execute on function public.get_user_conversations(uuid) to authenticated, anon;
