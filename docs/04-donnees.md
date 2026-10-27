# 04 — Données : schéma Supabase (Postgres)

Ce schéma est un **point de départ** pour l'étape 3 de la feuille de route. Claude Code doit le relire, le corriger si besoin et le livrer sous forme de migrations SQL dans `supabase/migrations/`. Noms de tables et colonnes en anglais.

## Vue d'ensemble

```
profiles ─┬─ garments ─┬─ wears
          │            ├─ outfit_items ── outfits
          │            └─ swap_listings ── swaps ─┬─ swap_messages
          │                                       └─ reviews
          ├─ credit_ledger (lié à swaps)
          ├─ circle_members ── circles
          ├─ purchase_candidates
          └─ reports
credit_rates (barème par catégorie)
```

## Types énumérés

```sql
create type garment_category as enum ('tee','long','pants','dress','shoes','outerwear','other');
create type garment_status   as enum ('active','donated','sold','swapped_out','archived');
create type garment_source   as enum ('manual','purchase','swap');
create type wear_source      as enum ('outfit_confirmed','manual','mirror');
create type outfit_status    as enum ('proposed','validated','dismissed');
create type item_condition   as enum ('new_with_tag','very_good','good','fair');
create type listing_status   as enum ('open','reserved','completed','cancelled','expired');
create type swap_status      as enum ('reserved','scheduled','completed','cancelled','no_show','refused');
create type ledger_reason    as enum ('hold','release','spend','earn','bonus','adjustment');
create type circle_kind      as enum ('city','private');
```

## Tables

```sql
-- Profil lié à auth.users
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  city text,
  neighborhood text,
  size_top text,
  size_bottom text,
  shoe_size text,
  is_adult boolean not null default false,      -- case cochée à l'inscription
  dormancy_days int not null default 180,
  created_at timestamptz not null default now()
);

create table garments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  name text not null,
  category garment_category not null,
  color text,
  size text,
  brand text,
  photo_path text,                              -- chemin dans le bucket privé "garments"
  source garment_source not null default 'manual',
  origin_garment_id uuid references garments,   -- pièce d'origine si reçue par échange
  acquired_at date not null default current_date,
  last_worn_at date,
  laundry_until date,
  status garment_status not null default 'active',
  created_at timestamptz not null default now()
);

create table wears (
  id uuid primary key default gen_random_uuid(),
  garment_id uuid not null references garments on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  worn_on date not null,
  source wear_source not null,
  unique (garment_id, worn_on)
);

create table outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  day date not null,
  orphan_garment_id uuid references garments,
  status outfit_status not null default 'proposed',
  confirmed_at timestamptz,
  unique (user_id, day)
);

create table outfit_items (
  outfit_id uuid references outfits on delete cascade,
  garment_id uuid references garments on delete cascade,
  primary key (outfit_id, garment_id)
);

-- Achats détectés (simulés dans le MVP)
create table purchase_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null,
  category garment_category not null,
  color text,
  source_label text,                            -- ex. « E-mail de confirmation »
  detected_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','added','ignored'))
);

-- Communauté
create table circles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind circle_kind not null,
  city text,
  invite_code text unique,
  created_by uuid references profiles,
  created_at timestamptz not null default now()
);

create table circle_members (
  circle_id uuid references circles on delete cascade,
  user_id uuid references profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table credit_rates (
  category garment_category primary key,
  credits int not null check (credits > 0)
);
insert into credit_rates values
  ('tee',1),('other',1),('pants',2),('dress',2),('shoes',2),('long',2),('outerwear',3);

create table swap_listings (
  id uuid primary key default gen_random_uuid(),
  garment_id uuid not null references garments on delete cascade,
  owner_id uuid not null references profiles on delete cascade,
  credits int not null,                         -- recopié depuis credit_rates à la création
  condition item_condition not null,
  note text,
  circle_id uuid references circles,            -- null = visible dans la ville
  city text not null,
  status listing_status not null default 'open',
  created_at timestamptz not null default now()
);
create unique index one_open_listing_per_garment
  on swap_listings (garment_id) where status in ('open','reserved');

create table swaps (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references swap_listings,
  giver_id uuid not null references profiles,
  receiver_id uuid not null references profiles,
  credits int not null,
  status swap_status not null default 'reserved',
  meeting_place text,
  meeting_at timestamptz,
  handover_code text not null default encode(extensions.gen_random_bytes(6),'hex'), -- contenu du QR code (pgcrypto)
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '72 hours',
  completed_at timestamptz,
  check (giver_id <> receiver_id)
);

create table swap_messages (
  id uuid primary key default gen_random_uuid(),
  swap_id uuid not null references swaps on delete cascade,
  sender_id uuid not null references profiles,
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz not null default now()
);

create table reviews (
  swap_id uuid references swaps on delete cascade,
  author_id uuid references profiles,
  target_id uuid not null references profiles,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  primary key (swap_id, author_id)
);

-- Registre des crédits : le solde est la somme de "amount"
create table credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles on delete cascade,
  amount int not null,                          -- négatif pour hold et spend
  reason ledger_reason not null,
  swap_id uuid references swaps,
  created_at timestamptz not null default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles,
  target_type text not null check (target_type in ('profile','listing','message')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewed','closed')),
  created_at timestamptz not null default now()
);

create table blocks (
  blocker_id uuid references profiles on delete cascade,
  blocked_id uuid references profiles on delete cascade,
  primary key (blocker_id, blocked_id)
);
```

## Vues utiles

```sql
create view credit_balances as
  select user_id, coalesce(sum(amount),0)::int as balance
  from credit_ledger group by user_id;

-- Ce que voit la bourse : seulement les champs publics
create view public_listings as
  select l.id, l.credits, l.condition, l.note, l.city, l.circle_id, l.created_at,
         g.name, g.category, g.color, g.size, g.brand, g.photo_path,
         p.display_name, p.neighborhood, l.owner_id
  from swap_listings l
  join garments g on g.id = l.garment_id
  join profiles p on p.id = l.owner_id
  where l.status = 'open';
```

## Règles d'accès (RLS) — principes

Activer RLS sur **toutes** les tables.

| Table | Lecture | Écriture |
|---|---|---|
| profiles | soi-même ; champs publics des autres via une vue | soi-même |
| garments, wears, outfits, outfit_items, purchase_candidates | propriétaire uniquement | propriétaire uniquement |
| swap_listings | propriétaire ; annonces `open` pour les membres connectés de la même ville ou du même cercle, adultes, non bloqués | propriétaire (création, annulation) |
| swaps, swap_messages | les deux membres de l'échange | **uniquement via les fonctions RPC** ; messages : les deux membres |
| reviews | tout membre connecté | auteur, une fois l'échange `completed` |
| credit_ledger | soi-même | **personne côté client** : seulement les fonctions RPC (`security definer`) |
| credit_rates | tout le monde | personne côté client |
| circles, circle_members | membres du cercle | créateur ; rejoindre via RPC avec le code |
| reports, blocks | auteur | auteur |

## Fonctions serveur (RPC)

Toutes en `security definer`, avec `set search_path = public`, vérifiant `auth.uid()`. Chacune dans une transaction.

- `reserve_listing(listing_id)` : vérifie que l'utilisateur est adulte, n'est pas le propriétaire, n'est pas bloqué, a moins de 3 échanges en cours et un solde suffisant. Crée le `swap`, insère `hold` (−crédits), passe l'annonce à `reserved`.
- `schedule_swap(swap_id, place, at)` : un des deux membres fixe le rendez-vous ; statut `scheduled`.
- `complete_swap(swap_id, handover_code)` : appelée par le receveur avec le code du QR. Insère `release` (+N) et `spend` (−N) pour le receveur, `earn` (+N) pour le donneur ; passe la pièce du donneur en `swapped_out` ; crée la copie dans le dressing du receveur (`source = 'swap'`, `origin_garment_id`) en copiant aussi la photo dans son dossier ; passe l'annonce à `completed`.
- `cancel_swap(swap_id)` : insère `release` (+N) pour le receveur, remet l'annonce à `open`.
- `report_no_show(swap_id)` : comme une annulation, et compte l'absence.
- `expire_swaps()` : appelée par une tâche planifiée (pg_cron) ; annule les réservations dépassées.
- `join_circle(invite_code)`.

## Stockage des photos

- Bucket **privé** `garments`, chemin `{user_id}/{garment_id}.jpg`.
- Affichage par URL signées à durée courte.
- Photos d'annonces : URL signées délivrées seulement pour les annonces visibles par le membre.
- Redimensionner côté client avant envoi (largeur max. 1200 px, JPEG ou WebP).

## Données d'exemple

Fournir `supabase/seed.sql` avec 2 ou 3 comptes de démonstration, une vingtaine de pièces chacun (reprendre celles du prototype), quelques annonces ouvertes et un échange terminé. Tout est marqué comme exemple.
