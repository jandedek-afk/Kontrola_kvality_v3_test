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
- **DB sloupce:** `snake_case` (`long_note`, `cross_note`, `time_text`, `photo`); mapování camelCase↔snake_case je v `pushEntry`/`pullFromCloud`.
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
     Jsme stále v testovací verzi → verze nese sufix -test (např. v3.1.0-test). -->

## Důležitá rozhodnutí a omezení
- **Nesahat na `../v2` (produkce) bez výslovného pokynu** — má vlastní repo a nasazuje se zvlášť.
- **Fotka se ukládá jako base64 přímo do sloupce `entries.photo`**, NE do Supabase Storage (upload přes Storage tuhnul na Androidu). Neměnit zpět.
- **Architektura: PC = trvalý archiv, cloud = průběžná schránka.** Kvůli free tieru se mají synchronizované záznamy z cloudu maazat (úklid zatím NENÍ hotový).
- **supabase-js používá no-op `auth.lock`** (Web Locks API tuhlo v PWA). Výchozí zámek nezapínat.
- **Čtení IndexedDB je serializované + jednorázová inicializace** (souběžné transakce tuhnou na Androidu). Zachovat.
- Bez potvrzení nemazat data, neměnit DB schéma ani RLS pravidla.
- Registrace je otevřená; potvrzování e-mailu je v Supabase pro test vypnuté.

## Aktuální stav (v3.2.0-test)
- **Hotovo (základ):** komprese fotek, přihlášení (otevřená registrace), offline-first ukládání, **funkční obousměrná synchronizace (ověřeno na PC i Androidu)**, mapa, složky, service worker „nejdřív síť", fotka v DB.
- **Hotovo (v3.2.0-test):**
  - **Rozhraní s postranním panelem** a kartami (výjezd / office / záznamy / mapa / nastavení); tlačítko Zpět přes History API.
  - **Kontrolní výjezd:** výběr „Kontrolu provádí" (jména jako odznáčky, sbalené za „+"), foto jedním tlačítkem rovnou z kamery (`capture`), rychlé zadávání rovinatosti (mezera/středník/Enter/blur), sekce **Vyjetá kolej** (ano/ne), poznámka. Složka se tvoří automaticky podle data (RRRR_MM_DD).
  - **Office část (náhrada MS Forms):** výběr záznamu → import PDF „Záznam o opravě" (pdf.js: text = identifikace opravy, extrakce vložených fotek = foto po opravě) → ~30 posuzovacích polí s podmíněným zobrazením (Troxler/Vývrt) a automatickým verdiktem rovinatosti. Stav office (hotovo/čeká) je vidět v Záznamech i v detailu.
  - **Nastavení:** správa „Kontrolujících osob" (rozklikávací pole; localStorage `kk_persons`).
- **Office data zatím jen LOKÁLNĚ** (IndexedDB) — do cloudu se neposílají, protože by to chtělo změnu DB schématu (nový sloupec). Až bude potřeba synchronizovat i office mezi zařízeními, přidat jeden JSON sloupec (po domluvě).
- **Ověřit naživo:** extrakce fotek z PDF v Office (jediná část neotestovaná lokálně bez prohlížeče).
- **Next steps:**
  - doimplementovat úklid cloudu (mazat synchronizované řádky → udržet free tier);
  - (volitelně) cloud sync office dat přes JSON sloupec;
  - generování PDF protokolu z kompletního záznamu; souhrn/databáze kontrol;
  - založit produkční Supabase projekt + zapnout potvrzování e-mailu; povýšit v3 do ostrého provozu.
