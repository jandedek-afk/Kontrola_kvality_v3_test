<!-- Tento soubor popisuje AKTIVNÍ vývojovou verzi v3 (složka v3_test, repo jandedek-afk/Kontrola_kvality_v3_test).
     Ostrá produkce v2 je v sousední složce ../v2 (jiný repo, Hordamen/Kontrola_kvality_v2) a je zmrazená. -->

# CLAUDE.md

## Jak navázat (start zde)
- Otevři ve VS Code **přímo složku `v3_test`** (ne `v2`) — tím se tento CLAUDE.md načte automaticky.
- Celá aplikace je v jednom souboru `index.html` (UI + JS + CSS pohromadě).
- **Testovací adresa (živá):** https://jandedek-afk.github.io/Kontrola_kvality_v3_test/ — funguje na PC, tabletu i mobilu.
- **Lokální náhled:** `python -m http.server 8000 --bind 127.0.0.1` ve složce → http://localhost:8000
- Aktuální číslo verze je vidět v patičce aplikace.

## Projekt
- **Kontrola kvality – Foto poznámky (v3)** — terénní PWA pro záznamy kontroly kvality: fotka + podélné/příčné měření + poznámka + GPS + datum, se sdílením mezi tabletem (provoz) a počítačem (zpracování).
- **Tech stack:** čisté HTML/CSS/JS bez frameworku a bez build kroku; vše v jednom `index.html`. Knihovny z CDN: Leaflet 1.9.4 (mapa), `@supabase/supabase-js@2` (přihlášení + cloud). Lokální úložiště: IndexedDB. PWA (service worker + manifest).
- **Cloud:** Supabase (Postgres + Auth), projekt ref `wkqqjladzvelnvwcstok`.
- **Bez Node/npm** — statický web hostovaný na GitHub Pages.

## Struktura projektu
- `index.html` — celá aplikace (UI + veškerý JS i CSS inline).
- `service-worker.js` — PWA cache / offline (nejdřív síť pro app shell, Supabase mimo cache).
- `manifest.json` — PWA manifest (ikona, název, standalone).
- `icon192.png`, `icon512.png`, `icon2.png` — logo a ikony (generované z předlohy).
- `supabase_setup.sql` — schéma DB, RLS pravidla a úložiště (spustit v Supabase SQL Editoru).
- `../v2/` — zmrazená ostrá verze (jiný repozitář).

## Konvence kódu
- Jednosouborová appka — `<script>`/`<style>` inline v `index.html`.
- **Jazyk:** UI texty i komentáře česky.
- **JS:** `camelCase` pro proměnné/funkce (`longNote`, `getAllEntries`, `pushEntry`).
- **DB sloupce:** `snake_case` (`long_note`, `cross_note`, `time_text`, `photo`); mapování camelCase↔snake_case je v `pushEntry`/`pullFromCloud`.
- **HTML id:** kebab-case (`login-overlay`, `sync-status`).
- **Komentáře:** krátké řádkové `//` česky.

## Příkazy
- **Lokální vývoj:** `python -m http.server 8000 --bind 127.0.0.1` ve složce → `http://localhost:8000` (localhost = bezpečný kontext, funguje SW/kamera/GPS). Node na tomto stroji není.
- **Nasazení:** `git commit` + `git push` → GitHub Pages → `https://jandedek-afk.github.io/Kontrola_kvality_v3_test/` (naživo do ~1 min).
- **Drobné změny pushuj rovnou** do `main` bez doptávání a bez zvedání verze (uživatel testuje naživo v appce). Verzi zvedej jen u řádného vydání. Před riskantním krokem (mazání dat, změna DB schématu/RLS, sahání na `../v2`) se vždy ptej.
- **Build ani testy nejsou.**

<!-- Vydání aktualizace uživatelům = zvednout verzi NA TŘECH místech zároveň:
     CACHE_NAME v service-worker.js, ?v= v manifest odkazu v index.html, a text "Verze aplikace:" v patičce. -->

## Důležitá rozhodnutí a omezení
- **Nesahat na `../v2` (produkce) bez výslovného pokynu** — má vlastní repo a nasazuje se zvlášť.
- **Fotka se ukládá jako base64 přímo do sloupce `entries.photo`**, NE do Supabase Storage (upload přes Storage tuhnul na Androidu). Neměnit zpět.
- **Architektura: PC = trvalý archiv, cloud = průběžná schránka.** Kvůli free tieru se mají synchronizované záznamy z cloudu maazat (úklid zatím NENÍ hotový).
- **supabase-js používá no-op `auth.lock`** (Web Locks API tuhlo v PWA). Výchozí zámek nezapínat.
- **Čtení IndexedDB je serializované + jednorázová inicializace** (souběžné transakce tuhnou na Androidu). Zachovat.
- Bez potvrzení nemazat data, neměnit DB schéma ani RLS pravidla.
- Registrace je otevřená; potvrzování e-mailu je v Supabase pro test vypnuté.

## Aktuální stav
- **Hotovo:** komprese fotek, přihlášení (otevřená registrace), offline-first ukládání, **funkční obousměrná synchronizace (ověřeno na PC i Androidu)**, mapa, složky, nové logo, service worker „nejdřív síť", fotka v DB. Diagnostický `dbg()` výpis odstraněn (v3.0.8-test).
- **Next steps:**
  - doimplementovat úklid cloudu (mazat synchronizované řádky → udržet free tier);
  - založit produkční Supabase projekt + zapnout potvrzování e-mailu;
  - povýšit v3 do ostrého provozu (nová složka/repo).
