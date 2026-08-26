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
- **Kontrola kvality (v3)** — PWA pro kontrolu kvality oprav vozovky, se sdílením mezi tabletem (provoz) a počítačem (zpracování). Dvě fáze: **Kontrolní výjezd** (na silnici: fotka, podélné/příčné měření rovinatosti, vyjetá kolej, poznámka, GPS, datum) a **Office** (v kanceláři: doplnění posouzení kvality = náhrada MS Forms + import PDF „Záznam o opravě").
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

## Vzhled (design tokeny) — platí od Build 45
- **Zdroj pravdy je `Design/patch/kk-tokens.css`**; obsah jeho `:root` bloku je vložený v `index.html` (~ř. 21). Zadání celého redesignu je `Design/patch/zadani-pro-ai-vscode.md`.
- **Nepiš barvy natvrdo** — používej tokeny: `--ink-*`, `--line-*`, `--surface-*`, `--orange-*`, `--ok-*/--bad-*/--warn-*/--wait-*`, `--fs-*`, `--sp-*`, `--r-*`, `--viz-*`. Legacy `--brand` / `--muted` / `--danger` zůstávají jako aliasy (brand = oranžová FUTTEC `#C2461A`).
- Karty v obsahu: **1px rámeček + radius 8 px, žádný stín** (stín jen u overlayů — menu, dialog, drawer, plovoucí foto).
- Čísla (čas, mm, GPS, ID CEV) v `var(--font-num)`; popisky sekcí 9–10 px verzálkami s `letter-spacing:var(--ls-caps)`.
- **Zobrazení rovinatosti má jednu pravdu:** mez 10 mm, strop stupnice 20 mm, vyhovující = ≥ 75 % hodnot ≤ 10 mm (JS konstanty `MM_LIMIT`, `MM_CEIL`, `MM_SHARE`). Pruh: 10 mm = 50 % šířky. Barvy: > 10 mm nebo `x` červená, 8–10 mm oranžová, jinak `--viz-neutral`.
- Ve složce `Design/` je **jen `patch/`** (`kk-tokens.css`, `README.md`, `zadani-pro-ai-vscode.md`, `zaznamy-patch.md`). Podklady `design/readme.md` a **klikací předloha `design/ui-kit.html`**, na které se zadání odkazuje (kap. 9), **v repu nikdy nebyly** — rozměry a rozvržení se bralo z textu zadání. Nehledej je.
- Past při případném novém kopírování tokenů: `kk-tokens.css` má **v úvodním komentáři starý řádek `:root{--brand:#1976d2;…}`**. Ber až **druhý** výskyt `:root{`, jinak se do `index.html` zatáhne i konec komentáře s `*/` a CSS parser zahodí celý token blok (stalo se v Buildu 45, opraveno v 46).

## Příkazy
- **Lokální vývoj:** `python -m http.server 8000 --bind 127.0.0.1` ve složce → `http://localhost:8000` (localhost = bezpečný kontext, funguje SW/kamera/GPS). Node na tomto stroji není.
- **Nasazení:** `git commit` + `git push` → GitHub Pages → `https://jandedek-afk.github.io/Kontrola_kvality_v3_test/` (naživo do ~1 min).
- **Drobné změny pushuj rovnou** do `main` bez doptávání a bez zvedání verze (uživatel testuje naživo v appce). Verzi zvedej jen u řádného vydání. Před riskantním krokem (mazání dat, změna DB schématu/RLS, sahání na `../v2`) se vždy ptej.
- **Build ani testy nejsou.** Vzhled se dá ověřit i bez ručního klikání: `python -m http.server` + headless Chrome
  (`"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --screenshot=out.png --window-size=1440,1000 URL`),
  a pomocná stránka ve stejné složce, která `index.html` načte do `<iframe>` a volá jeho funkce (`buildEntryDetailHtml`, `rovinatostStats`, …) — stejný origin, takže na ně parent dosáhne.
  **Pozor:** v headless se init appky zasekne / skončí na `sb.auth.getSession()` (Supabase je nedostupné) → appka pak sama zobrazí přihlášení a **listenery navěšené po tom awaitu nefungují**.
  V pomocné stránce se to obejde `w.showLogin = ()=>{}` a `w.getAllEntries = ()=> Promise.resolve(testovaciData)`. **Zadávání hodnot, ukládání a synchronizaci takhle ověřit nelze** — to jen naživo.
  Pomocné stránky do repa necommituj (jsou ve scratchpadu session).

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

## Aktuální stav (v3.2.0-test, Build 49)
- **Název appky = jen „Kontrola kvality"** (bez „Foto poznámky") — title, manifest `name`/`short_name`, apple-title, patička (Build 43).
- **Hotovo (základ):** komprese fotek, přihlášení (otevřená registrace), offline-first ukládání, **funkční obousměrná synchronizace (ověřeno na PC i Androidu)**, mapa, složky, service worker „nejdřív síť", fotka v DB.
- **Navigace (Build 47):** na **≥1000 px trvalá tmavá vodorovná lišta** `.topnav` (`#14191D`) — 5 karet, vpravo stav synchronizace, ⟳ Aktualizovat a e-mail; plovoucí ☰ je tam skrytý. Na **≤640 px spodní lišta karet** `.botnav` (aktivní oranžově, ≥44 px, `safe-area`). Drawer `.sidebar` s ☰ zůstává pro tablety a jako fallback (nese Synchronizovat / Odhlásit). Stav synchronizace, tlačítko aktualizace a e-mail jsou na dvou místech → adresují se **třídou** (`.sync-state`, `.update-btn`, `.user-email`), ne `id`. Karty přepíná jakýkoli `.nav-item[data-view]`. Tlačítko Zpět přes History API (fullscreen fotka → detail → office formulář → přepne kartu).
- **Záznamy (Build 42, 46):** seznam jsou **karty** (`buildEntriesList`/`buildEntryCard`) — barevný pruh podle verdiktu, náhled, čas, jména, stav office, mini graf hodnot, max. odchylka. `buildEntriesTable` zůstává jako druhý režim (nabídka „Sloupce ▾"). Na **≥1200 px tři panely** `.zn-panes` (seznam 292 px | detail | pravý panel 284 px), pod tím se detail otevírá v `#viewer` na celou obrazovku. Detail vykresluje **jedna sada funkcí pro obě místa**: `buildEntryDetailHtml` (hlavička s verdiktem a max. odchylkou, pruhy měření, fotky, pásek polí), `buildEntrySideHtml(entry, withMap)` (mapa s body podle verdiktu + úprava GPS tažením, GPS, dokumenty), `buildEntryBarHtml` (přilepená lišta na mobilu), akce přes `wireEntryDetail`. Fullscreen fotka je `#img-full`. Mazání **jen v nabídce ⋯**, nikdy jako velké tlačítko.
- **Kontrolní výjezd:**
  - „**Kontrolu provádí**" = sbalený výběr jmen (chipy + „+", zdroj osob = Nastavení / localStorage `kk_persons`).
  - „**Foto opravy**" = jedno tlačítko rovnou kamera (`capture`), info „i" (foto z odstupu, okolí min. 2 m).
  - **Rovinatost:** rychlé zadávání (mezera/středník/Enter/blur), **živý verdikt** pod sekcí (pilulka + „X z Y do 10 mm · Z % · mez 75 %") přepočítaný při každé změně; `✕ >20` ukládá `x` (chip „✕ > 20 mm").
  - **Vyjetá kolej** (ano/ne), poznámka. Složka automaticky podle data (RRRR_MM_DD).
  - **Uložení:** neblokující GPS, pojistka proti dvojkliku (zamčené tlačítko „Ukládám…"); na mobilu je „Uložit záznam" **přilepená lišta dole** nad spodní navigací.
- **Office část (náhrada MS Forms):** výběr záznamu → **nahoře „📍 Poloha opravy": souřadnice + mini Leaflet mapa s markerem + odkaz na Google Maps** (`initOfficeMap`, instance v `officeMapInstance`, `invalidateSize` po vykreslení) kvůli identifikaci opravy a dohledání správného PDF (Build 44) → **import PDF „Záznam o opravě"** (pdf.js, **dvousloupcové čtení** podle X, chybějící ID → `N/A`; PDF se uloží jako dokumentace do `office.repairPdf`) → identifikace + foto po opravě + **auto-doplnění reklamace** z „Typ záruka" (ANO→poskytnuta, NE/Bez záruky→neposkytnuta) → ~30 posuzovacích polí (Troxler/Vývrt podmíněně, auto verdikt rovinatosti). Fotky **po opravě (vlevo) / při kontrole (vpravo)** vedle sebe, klik = fullscreen. **Plovoucí přesouvatelné okno** s fotkou (přepínač po opravě/při kontrole, primárně při kontrole; klik = fullscreen; znovuotevření tlačítkem). Stav office (✓/⏳) v Záznamech i detailu. **Rozvržení (Build 48–49):** výběr záznamu i seznam čekajících používá **stejné karty jako Záznamy**; ve formuláři jsou na ≥1200 px **tři kolonky** `.of-panes` (čekající záznamy | formulář | 300 px měření z výjezdu a fotky), pod 1200 px pod sebou s měřením nad formulářem. V hlavičce formuláře je průběh **„vyplněno X z Y polí"** (`officeProgressCounts` počítá z `OFFICE_SCHEMA`, podmíněná pole jen když se týkají). Vybraná možnost přepínače má oranžový rámeček.
- **Office data SE SYNCHRONIZUJÍ do cloudu** (migrace sloupců `office/after_photo/vyjeta_kolej/inspectors/office_done` **byla spuštěna** v Supabase). `pushEntry` má pojistku pro starou DB (uloží aspoň základní pole).
- **Nastavení:** správa „Kontrolujících osob" (rozklikávací pole).
- **Next steps:**
  - **úklid cloudu** (mazat synchronizované řádky → udržet free tier) — stále nehotové, **priorita**; viz „Plánované práce" níže;
  - **SQL migrace odvozených sloupců + indexů** (server-side filtr/report) — odloženo, viz „Plánované práce" níže;
  - založit produkční Supabase projekt + zapnout potvrzování e-mailu; povýšit v3 do ostrého provozu.
  - **redesign podle `Design/patch/` je hotový** (tokeny, karty, detail, navigace, výjezd, office); kapitola 6 zadání (`x` ve verdiktu) byla hotová už z Buildu 13.

## Plánované práce (do budoucna – NENÍ hotové)
Poznámky z domluvy s uživatelem (2026-07-15), ať se na to nezapomene:

### 1) Úklid cloudu (priorita – reálně šetří kapacitu)
- **Problém:** free tier Supabase = 500 MB DB; místo žerou hlavně **base64 fotky a PDF** (`photo` ~0,3–0,5 MB, `after_photo` + `office.repairs[].pdf` ~1–2 MB/záznam). Architektura je **PC = trvalý archiv, cloud = průběžná schránka** → synchronizované řádky se z cloudu mají mazat, ale úklid **není hotový**.
- **Směr řešení (návrh):** po úspěšném stažení na „archivní" zařízení (PC) mazat staré synchronizované řádky z cloudu; ohlídat náhrobky (`kk_deleted`), ať se přes `pullFromCloud` nevrátí; nemazat rozpracované (`synced:false`).
- Pozor na scénář, kdy záznam ještě nestáhla všechna zařízení – nemazat předčasně.

### 2) SQL migrace – odvozené sloupce + indexy (odloženo, ne kvůli kapacitě)
- **Co:** v Supabase přidat do `public.entries` sloupce `GENERATED ALWAYS AS (...) STORED` odvozené z `office` (jsonb zůstává zdroj pravdy, appka nic nezapisuje dvakrát) + indexy (GIN fulltext, btree na time/folder/office_done/owner). Bezpečné pouštět opakovaně (`add column if not exists`).
- **Kapacita:** přírůstek zanedbatelný (~2–3 kB/záznam vs. ~0,3–2 MB fotky) → **nevyžaduje větší tier**. Kapacitu řeší bod 1, ne tohle.
- **K čemu:** rychlé filtrování/hledání a reporty **přímo nad cloudovou DB** (mimo appku). **Teď netřeba** – filtrování i export XLSX/JSON běží lokálně v appce (Build 15).
- **DŮLEŽITÉ – klíče v `office` jsou snake_case česky, ne camelCase z původního plánu.** Mapování a výrazy (ověřeno v index.html `OFFICE_SCHEMA`):
  - `repair_id` ← `office->>'id_cev'` (text)
  - `reklamace` ← `office->>'reklamace'` (text: `'Záruka byla poskytnuta'` / `'…nebyla…'`)
  - `byl_troxler` ← `(office->>'troxler_pouzit') = 'Ano'` (**ne `::boolean`** – hodnota je `'Ano'`/`'Ne'`)
  - `byl_vyvrt` ← `(office->>'vyvrt_proveden') = 'Ano'`
  - „oprava vyhovující" **nemá přímé pole** – vynecháno (příp. odvodit z `troxler_vyhovuje` / `rovinatost_verdikt`, zvlášť dořešit)
  - fulltext `search_vector` z: `note, long_note, cross_note, inspectors, folder, office->>'id_cev'`
- **Před spuštěním migrace / změnou DB schématu se vždy ptát** (viz pravidla výše).

### 3) PDF protokol jednotlivého záznamu — HOTOVO (Build 20)
- Tlačítko **„📄 Protokol (PDF)"** v office formuláři → `generateProtocolPdf` (html2canvas + jsPDF z CDN, lazy). Renderuje offscreen HTML (`buildProtocolHtml`) → obrázek → A4 PDF (raster, kvůli českým znakům). Layout dle vzoru `Protokol_kontrola_kvality_*` (hlavička FUTTEC, ID/Oprava, Kontrolu provedl/Datum/Stáří opravy, foto po opravě + při kontrole, vizuální posouzení 2 sloupce, měřená rovinatost + verdikt limitů, Troxler/vývrt řádky, Poznámky, patička).
- Mapování: `id_cev, oprava, kontrolu_provedl, datum_kontroly, textura, zhutneni, vizual_rovinatost, trhliny, okoli_aktualni, okoli_realizace, troxler_*, vyvrt_*`, měření z `entry.longNote/crossNote`, foto `entry.afterPhoto` + `entry.photo`. „Stáří opravy" = měsíce od data ukončení (z textu `oprava`) do `datum_kontroly` (`repairAgeText`).
- Možné vylepšení: vektorové PDF (embed TTF fontu s diakritikou) místo rasteru; skutečné logo místo textového „FUTTEC".
