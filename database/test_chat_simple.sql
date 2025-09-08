-- Script simple pour tester le chat
-- Exécuter ce script dans Supabase pour créer les fonctions nécessaires

-- 1) Fonction pour créer/récupérer une conversation
drop function if exists public.get_or_create_conversation_with_participants_v5(uuid, uuid, uuid, text);

create or replace function public.get_or_create_conversation_with_participants_v5(
  p_vehicle_id uuid,
  p_owner_id uuid,
  p_reporter_id uuid,
  p_subject text default 'Problème signalé via QR Code'
)
returns table (
  conv_id uuid,
  conv_vehicle_id uuid,
  conv_owner_id uuid,
  conv_reporter_id uuid,
  conv_status text,
  conv_subject text,
  conv_created_at timestamptz,
  conv_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conv_id uuid;
  v_created_at timestamptz;
  v_updated_at timestamptz;
begin
  -- Tenter de trouver une conversation existante
  select id, created_at, updated_at
  into v_conv_id, v_created_at, v_updated_at
  from public.conversations
  where vehicle_id = p_vehicle_id
    and reporter_id = p_reporter_id
  limit 1;

  if v_conv_id is null then
    -- Si aucune conversation n'existe, en créer une nouvelle
    insert into public.conversations (vehicle_id, owner_id, reporter_id, subject)
    values (p_vehicle_id, p_owner_id, p_reporter_id, coalesce(p_subject, 'Problème signalé via QR Code'))
    returning id, created_at, updated_at into v_conv_id, v_created_at, v_updated_at;
  end if;

  -- Insérer les participants (idempotent)
  insert into public.conversation_participants (conversation_id, user_id, role)
  values (v_conv_id, p_owner_id, 'owner')
  on conflict (conversation_id, user_id) do nothing;

  insert into public.conversation_participants (conversation_id, user_id, role)
  values (v_conv_id, p_reporter_id, 'reporter')
  on conflict (conversation_id, user_id) do nothing;

  -- Retourner la conversation (existante ou nouvelle)
  return query
  select
    c.id as conv_id,
    c.vehicle_id as conv_vehicle_id,
    c.owner_id as conv_owner_id,
    c.reporter_id as conv_reporter_id,
    c.status::text as conv_status,
    c.subject::text as conv_subject,
    c.created_at as conv_created_at,
    c.updated_at as conv_updated_at
  from public.conversations c
  where c.id = v_conv_id
  limit 1;
end;
$$;

-- 2) Fonction pour envoyer un message
drop function if exists public.send_message_if_participant(uuid, uuid, text, text);

create or replace function public.send_message_if_participant(
  p_conversation_id uuid,
  p_sender_id uuid,
  p_content text,
  p_message_type text default 'text'
)
returns table (
  msg_id uuid,
  msg_conversation_id uuid,
  msg_sender_id uuid,
  msg_content text,
  msg_message_type text,
  msg_metadata jsonb,
  msg_is_read boolean,
  msg_created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_msg_id uuid;
begin
  if not exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id and cp.user_id = p_sender_id
  ) then
    raise exception 'sender is not a participant of the conversation';
  end if;

  insert into public.messages (conversation_id, sender_id, content, message_type)
  values (p_conversation_id, p_sender_id, p_content, coalesce(p_message_type, 'text'))
  returning id into v_msg_id;

  return query
  select m.id,
         m.conversation_id,
         m.sender_id,
         m.content,
         (m.message_type)::text,
         m.metadata,
         m.is_read,
         m.created_at
  from public.messages m
  where m.id = v_msg_id
  limit 1;
end;
$$;

-- 3) Fonction pour récupérer les conversations
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

-- 4) Droits d'exécution
grant execute on function public.get_or_create_conversation_with_participants_v5(uuid, uuid, uuid, text) to authenticated, anon;
grant execute on function public.send_message_if_participant(uuid, uuid, text, text) to authenticated, anon;
grant execute on function public.get_user_conversations(uuid) to authenticated, anon;
