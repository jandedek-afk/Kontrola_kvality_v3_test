<!-- Tento soubor popisuje AKTIVNÍ vývojovou verzi v3 (složka v3_test, repo jandedek-afk/Kontrola_kvality_v3_test).
     Ostrá produkce v2 je v sousední složce ../v2 (jiný repo, Hordamen/Kontrola_kvality_v2) a je zmrazená. -->

# CLAUDE.md

## Jak navázat (start zde)
- Otevři ve VS Code **přímo složku `v3_test`** (ne `v2`) — tím se tento CLAUDE.md načte automaticky.
- Celá aplikace je v jednom souboru `index.html` (UI + JS + CSS pohromadě).
- **Testovací adresa (živá):** https://jandedek-afk.github.io/Kontrola_kvality_v3_test/ — funguje na PC, tabletu i mobilu.
- **Lokální náhled:** `python -m http.server 8000 --bind 127.0.0.1` ve složce → http://localhost:8000
- Aktuální verze i **Build značka** jsou vidět v patičce aplikace (např. `v3.2.0-test · Build 2026-07-02·6`). Build značku zvyšuj u každé změny, ať se pozná aktuálnost.
- V panelu je tlačítko **⟳ Aktualizovat aplikaci** = tvrdý update (smaže cache + odregistruje SW + cache-busting reload). Zežloutne, když je stažená nová verze.

## Projekt
- **Kontrola kvality – Foto poznámky (v3)** — PWA pro kontrolu kvality oprav vozovky, se sdílením mezi tabletem (provoz) a počítačem (zpracování). Dvě fáze: **Kontrolní výjezd** (na silnici: fotka, podélné/příčné měření rovinatosti, vyjetá kolej, poznámka, GPS, datum) a **Office** (v kanceláři: doplnění posouzení kvality = náhrada MS Forms + import PDF „Záznam o opravě").
- **Rozhraní:** levý postranní panel s kartami — 🚛 Kontrolní výjezd, 🏢 Office, 📁 Záznamy, 🗺️ Mapa, ⚙️ Nastavení; dole synchronizace, e-mail, odhlášení. Tlačítko Zpět (mobil/prohlížeč) je napojené na History API (popstate) — vrací o krok v appce, nevyskakuje ven.
- **Tech stack:** čisté HTML/CSS/JS bez frameworku a bez build kroku; vše v jednom `index.html`. Knihovny z CDN: Leaflet 1.9.4 (mapa), `@supabase/supabase-js@2` (přihlášení + cloud), **pdf.js 3.11.174 (cdnjs)** pro čtení PDF v Office. Lokální úložiště: IndexedDB. PWA (service worker + manifest).
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
- **DB sloupce:** `snake_case`; mapování camelCase↔snake_case je v `pushEntry`/`pullFromCloud`. Tabulka `entries`: `id, time, time_text, coords, long_note, cross_note, note, folder, photo, photo_path, vyjeta_kolej, inspectors, office (jsonb), after_photo, office_done, owner, created_at`.
- **localStorage klíče:** `kk_persons` (kontrolující osoby), `kk_dnesni_jmena` + `kk_dnesni_kontroloval` (dnešní obsazení výjezdu), `kk_deleted` (náhrobky smazaných záznamů).
- **HTML id:** kebab-case (`login-overlay`, `sync-status`).
- **Komentáře:** krátké řádkové `//` česky.

## Příkazy
- **Lokální vývoj:** `python -m http.server 8000 --bind 127.0.0.1` ve složce → `http://localhost:8000` (localhost = bezpečný kontext, funguje SW/kamera/GPS). Node na tomto stroji není.
- **Nasazení:** `git commit` + `git push` → GitHub Pages → `https://jandedek-afk.github.io/Kontrola_kvality_v3_test/` (naživo do ~1 min).
- **Drobné změny pushuj rovnou** do `main` bez doptávání a bez zvedání verze (uživatel testuje naživo v appce). Verzi zvedej jen u řádného vydání. Před riskantním krokem (mazání dat, změna DB schématu/RLS, sahání na `../v2`) se vždy ptej.
- **Build ani testy nejsou.**

<!-- Vydání aktualizace uživatelům = zvednout verzi NA ČTYŘECH místech zároveň:
     1) CACHE_NAME v service-worker.js,
     2) ?v= v precache URL ./manifest.json v service-worker.js (urlsToCache) – musí se shodovat s bodem 3,
     3) ?v= v manifest odkazu v index.html,
     4) text "Verze aplikace:" v patičce index.html.
     Jsme stále v testovací verzi → verze nese sufix -test (např. v3.1.0-test).
     U DROBNÝCH ladicích změn stačí zvednout jen "Build" značku v patičce (např. Build 2026-07-02·6) – slouží k rozpoznání aktuálnosti, verzi zvedej jen u řádného vydání.
     POZOR na deploy lag: po pushi GitHub Pages publikuje ~1 min a HTML má Cache-Control max-age=600 (10 min) → nová verze se k uživateli nedostane hned. Ověřování naživo NEDĚLAT (uživatel si nepřeje); on si počká / dá ⟳ Aktualizovat. -->

## Důležitá rozhodnutí a omezení
- **Nesahat na `../v2` (produkce) bez výslovného pokynu** — má vlastní repo a nasazuje se zvlášť.
- **Fotka se ukládá jako base64 přímo do sloupce `entries.photo`**, NE do Supabase Storage (upload přes Storage tuhnul na Androidu). Neměnit zpět.
- **Architektura: PC = trvalý archiv, cloud = průběžná schránka.** Kvůli free tieru se mají synchronizované záznamy z cloudu maazat (úklid zatím NENÍ hotový). Odhad kapacity free tier (500 MB DB): výjezd s 1 fotkou ~0,3–0,5 MB (≈1000–1500 zázn.), kompletní s foto po opravě/vývrt ~0,8–1,5 MB (≈350–600 zázn.).
- **Foto po opravě i foto vývrtu jsou taky base64** (v `after_photo` / v `office`) → cloud se plní rychleji, počítat s tím u úklidu.
- **Mazání záznamu maže i v cloudu + zapisuje „náhrobek"** (`localStorage kk_deleted`), aby se smazané z cloudu nevracely (`deleteEntryFully` / `deleteFromCloud`); `pullFromCloud` náhrobky přeskakuje. Bez toho se smazané záznamy vracely.
- **`pullFromCloud` i AKTUALIZUJE existující záznamy** (kvůli office z jiného zařízení); lokální nesynchronizovaná změna (`synced:false`) má přednost.
- **GPS je neblokující** — záznam se uloží hned (`coords:null`) a poloha se doplní na pozadí (`fetchCoordsBackground`).
- **supabase-js používá no-op `auth.lock`** (Web Locks API tuhlo v PWA). Výchozí zámek nezapínat.
- **Čtení IndexedDB je serializované + jednorázová inicializace** (souběžné transakce tuhnou na Androidu). Zachovat.
- Bez potvrzení nemazat data, neměnit DB schéma ani RLS pravidla.
- Registrace je otevřená; potvrzování e-mailu je v Supabase pro test vypnuté.

## Aktuální stav (v3.2.0-test, Build ·6)
- **Hotovo (základ):** komprese fotek, přihlášení (otevřená registrace), offline-first ukládání, **funkční obousměrná synchronizace (ověřeno na PC i Androidu)**, mapa, složky, service worker „nejdřív síť", fotka v DB.
- **Rozhraní:** postranní panel je **rozbalovací drawer na všech šířkách** (i na PC), ovládaný **fixním hamburgerem** (☰) vlevo nahoře; obsah je centrovaný (max 1200 px), footer přilepený dole (flex column). Karty: výjezd / office / záznamy / mapa / nastavení. Tlačítko Zpět přes History API (zavře detail → office formulář → přepne kartu). Ověřeno, že se seznam v Office na mobilu nesekává.
- **Kontrolní výjezd:**
  - „**Kontrolu provádí**" = sbalený výběr jmen (chipy + „+", zdroj osob = Nastavení / localStorage `kk_persons`).
  - „**Foto opravy**" = jedno tlačítko rovnou kamera (`capture`), info „i" (foto z odstupu, okolí min. 2 m).
  - **Rovinatost:** rychlé zadávání (mezera/středník/Enter/blur), auto verdikt.
  - **Vyjetá kolej** (ano/ne), poznámka. Složka automaticky podle data (RRRR_MM_DD).
  - **Uložení:** neblokující GPS, pojistka proti dvojkliku (zamčené tlačítko „Ukládám…").
- **Office část (náhrada MS Forms):** výběr záznamu → **import PDF „Záznam o opravě"** (pdf.js, **dvousloupcové čtení** podle X, chybějící ID → `N/A`; PDF se uloží jako dokumentace do `office.repairPdf`) → identifikace + foto po opravě + **auto-doplnění reklamace** z „Typ záruka" (ANO→poskytnuta, NE/Bez záruky→neposkytnuta) → ~30 posuzovacích polí (Troxler/Vývrt podmíněně, auto verdikt rovinatosti). Fotky **po opravě (vlevo) / při kontrole (vpravo)** vedle sebe, klik = fullscreen. **Plovoucí přesouvatelné okno** s fotkou (přepínač po opravě/při kontrole, primárně při kontrole; klik = fullscreen; znovuotevření tlačítkem). Stav office (✓/⏳) v Záznamech i detailu.
- **Office data SE SYNCHRONIZUJÍ do cloudu** (migrace sloupců `office/after_photo/vyjeta_kolej/inspectors/office_done` **byla spuštěna** v Supabase). `pushEntry` má pojistku pro starou DB (uloží aspoň základní pole).
- **Nastavení:** správa „Kontrolujících osob" (rozklikávací pole).
- **Next steps:**
  - **úklid cloudu** (mazat synchronizované řádky → udržet free tier) — stále nehotové, priorita;
  - generování PDF protokolu z kompletního záznamu; souhrn/databáze kontrol (odloženo);
  - založit produkční Supabase projekt + zapnout potvrzování e-mailu; povýšit v3 do ostrého provozu.
