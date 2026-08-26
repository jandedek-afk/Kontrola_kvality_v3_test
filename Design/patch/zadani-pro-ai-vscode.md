# Zadání pro AI ve VS Code — nový vzhled karty Záznamy (web i mobil)

> Vlož celý tento soubor jako první zprávu do Claude Code / Copilot Chat ve složce `v3_test`.
>
> **Nejdřív do repa nakopíruj podklady** (ze stažené složky návrhu, viz kapitola 9):
> `design/kk-tokens.css` · `design/readme.md` · `design/ui-kit.html` — AI je má číst,
> do appky se nelinkují. `ui-kit.html` je klikací předloha všech čtyř obrazovek.

---

## 0) Kontext

Aplikace **Kontrola kvality – Foto poznámky (v3 TEST)**, repo `jandedek-afk/Kontrola_kvality_v3_test`,
branch `main`. Celá appka je jeden soubor `index.html` (HTML + CSS + JS inline), bez frameworku a bez
build kroku. Knihovny z CDN: Leaflet, supabase-js, pdf.js, html2canvas + jsPDF (lazy). Úložiště
IndexedDB + Supabase, PWA se service workerem. Platí konvence z `CLAUDE.md` v repu.

**Úkol:** předělat vzhled karty **📁 Záznamy** — hlavně zobrazení jednotlivého záznamu — pro web
i mobil. Dnes je nepřehledná: hodnoty měření jsou textový výpis („5; 8; 7; 5; 5; 7“), foto zabírá
většinu detailu, verdikt se ztrácí a všechny řádky mají stejnou váhu.

## 1) Nesahat na

- IndexedDB a `getAllEntries / updateEntry / deleteEntryFully`, `pushEntry / pullFromCloud`,
  náhrobky `kk_deleted`, serializované čtení IndexedDB, `auth.lock` no-op.
- Schéma DB, RLS, `supabase_setup.sql` (jakoukoli změnu schématu si nejdřív vyžádej).
- Formát ukládání fotek (base64 v `photo` / `afterPhoto`).
- Logiku filtrů (`filterState`, `entryMatchesFilter`, `getFilteredEntries`), export JSON/XLSX,
  PDF protokol, Office formulář (`renderOfficeForm`, `OFFICE_SCHEMA`), History API / tlačítko Zpět.
- Složku `../v2`.

Měníme **jen vykreslování** seznamu a detailu záznamu + tokeny vzhledu.

## 2) Data, se kterými se pracuje

Jeden záznam (`entry`): `id`, `time`, `timeText`, `folder` (`RRRR_MM_DD`), `coords {lat, lon}`,
`photo` (base64), `afterPhoto`, `longNote`, `crossNote` (řetězce hodnot oddělené `;`, hodnota `'x'`
= přesah přes klínek, tj. > 20 mm), `note`, `vyjetaKolej` (bool), `inspectors` (jména oddělená
čárkou), `office` (jsonb, klíče snake_case česky — `id_cev`, `oprava`, `reklamace`, `troxler_*`,
`vyvrt_*`, `rovinatost_verdikt`…), `officeDone` (bool), `synced` (bool).

**Verdikt rovinatosti:** měří se 2 m latí, podélné i příčné hodnoty se počítají dohromady;
**vyhovující = aspoň 75 % hodnot ≤ 10 mm**. Záznam nemá lidské číslo — identita je **datum/čas +
složka**; `id_cev` vzniká teprve v Office části z importovaného PDF.

## 3) Design tokeny (platí pro celou appku)

```
nav / text            #14191D      plocha            #F1F3F4
akce (FUTTEC)         #C2461A      karta             #FFFFFF
vyhovující            #1e7d34   na #e6f4ea           (stávající tokeny appky)
pozor (8–10 mm)       #A8650B   pruh #D69220
nevyhovující          #c62828   na #fde8e8           (stávající tokeny appky)
neodesláno            #8a6d00   na #fff3cd           (stávající .badge-unsynced)
rámeček               #E2E6E9      tlumený text      #8B979F / #A9B4BB
```

- Rádiusy 5–8 px, **rámečky místo stínů**.
- Čísla (čas, mm, GPS, ID CEV) vždy **monospace**; popisky sekcí 9–10 px, verzálky, `letter-spacing:.11em`.
- Emoji v navigaci zachovat (🚛 🏢 📁 🗺️ ⚙️) — jsou součástí zvyku uživatelů.
- **Nevypisuj tokeny ručně** — v `design/kk-tokens.css` je hotový `:root` blok k vložení místo
  řádku `:root{--brand:#1976d2;--muted:#666;--danger:#ff5252}` (~ř. 21) a pod ním tabulka modrých
  hexů zapsaných natvrdo (`#dbe7f7`, `#cdddf3`, `#f4f8fe`, …) s cílovou proměnnou pro každý.
  Verdiktové hexy `#1e7d34`, `#e6f4ea`, `#c62828`, `#fde8e8`, `#8a6d00`, `#fff3cd` **zůstávají**.
- Mobil: klikací plochy min. 44 px.

## 4) FÁZE 1 — seznam záznamů jako karty

Nahradit tabulku `.zn-table` seznamem karet. Jeden řádek nese: stav (barevný pruh vlevo), náhled
fotky, čas, kdo kontroloval, stav office, **mini graf všech naměřených hodnot** a **max. odchylku**.
Cíl: nevyhovující záznam poznám bez otevření.

`buildEntriesTable / buildEntryRow / entryCellHtml` **nemazat** — zůstanou jako druhý režim
zobrazení (nabídka „Sloupce ▾“ má smysl jen u tabulky).

### 4a) CSS — vlož před `</style>` (~ř. 337)

```css
    /* === Záznamy: seznam karet === */
    .zn-list{display:grid;gap:8px}
    .zn-card{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e3e8ef;
      border-left:3px solid #cfd7dc;border-radius:10px;padding:9px 12px}
    .zn-card.ok{border-left-color:#1e7d34}
    .zn-card.bad{border-left-color:#c62828}
    .zn-card.warn{border-left-color:#d69220}
    .zn-card.none{border-left-color:#cfd7dc;opacity:0.7}
    .zn-card.sel{background:#f7f9fa;border-color:#cdddf3}
    .zn-card:hover{border-color:#cdddf3;background:#fbfdff}
    .zn-open{display:flex;align-items:center;gap:10px;flex:1;min-width:0;cursor:pointer}
    .zn-thumb{width:52px;height:40px;flex:0 0 auto;object-fit:cover;border-radius:5px;
      background:#f4f8fe;border:1px solid #e6eef9}
    .zn-thumb.empty{display:flex;align-items:center;justify-content:center;font-size:1rem;color:#c3cbd1}
    .zn-main{flex:1;min-width:0}
    /* jeden řádek, jméno se zkrátí — karta nesmí zvětšit výšku ani přelézt mini graf */
    .zn-line1{display:flex;align-items:baseline;gap:8px;flex-wrap:nowrap;min-width:0}
    .zn-time{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:600;font-size:0.85rem;color:#14191d;flex:0 0 auto}
    .zn-who{font-size:0.78rem;color:#6c7981;flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .zn-sync{font-size:0.7rem;color:#8a6d00;flex:0 0 auto}
    .zn-line2{font-size:0.74rem;color:#a9b4bb;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .zn-tag{font-size:0.7rem;font-weight:500;padding:2px 6px;border-radius:3px;white-space:nowrap;flex:0 0 auto}
    .zn-tag.office-wait{background:#fdede6;color:#c2461a}
    .zn-tag.office-done{background:#e6f4ea;color:#1e7d34}
    /* mini graf: 1 sloupec = 1 hodnota, mez 10 mm = 50 % výšky, strop 20 mm */
    .zn-spark{display:flex;align-items:flex-end;gap:2px;height:22px;flex:0 0 auto}
    .zn-spark i{display:block;width:3px;min-height:2px;background:#b5c2c9;border-radius:1px}
    .zn-spark i.warn{background:#d69220}
    .zn-spark i.bad{background:#c62828}
    .zn-max{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:0.8rem;font-weight:600;
      width:44px;text-align:right;flex:0 0 auto;color:#3e4a52}
    .zn-max.warn{color:#a8650b}
    .zn-max.bad{color:#c62828}
    .zn-max.none{font-weight:400;color:#a9b4bb}
    .zn-card .entry-pick{flex:0 0 auto;transform:scale(1.2);cursor:pointer;margin:0}
    @media (max-width:640px){
      .zn-spark{display:none}
      .zn-thumb{width:56px;height:56px}
      .zn-card{padding:11px 12px}
    }
```

### 4b) JS — vlož za funkci `rovinatostBadgeSmall` (~ř. 1761)

```js
      // Statistika rovinatosti: bere i 'x' (přesah přes klínek, > 20 mm) jako nevyhovující bod.
      function rovinatostStats(longStr, crossStr){
        const raw = String(longStr||'').split(/[;\n]+/).concat(String(crossStr||'').split(/[;\n]+/))
          .map(s=>s.trim()).filter(s=>s!=='');
        const pts = raw.map(s=> /^x$/i.test(s)
            ? {v:20, over:true}
            : {v:parseFloat(s.replace(',','.')), over:false})
          .filter(p=> !isNaN(p.v));
        if(!pts.length) return null;
        const ok = pts.filter(p=> !p.over && p.v<=10).length;
        return {
          pts, ok, total:pts.length,
          pct: Math.round(ok/pts.length*100),
          max: Math.max(...pts.map(p=>p.v)),
          hasOver: pts.some(p=>p.over),
          vyhovuje: ok/pts.length >= 0.75,
        };
      }
      // Mini graf hodnot; mez 10 mm = polovina výšky (22 px), strop 20 mm
      function sparklineHtml(st){
        if(!st) return '';
        const bars = st.pts.map(p=>{
          const h = Math.max(2, Math.round(Math.min(p.v,20)/20*22));
          const cls = p.over || p.v>10 ? 'bad' : (p.v>=8 ? 'warn' : '');
          return `<i class="${cls}" style="height:${h}px"></i>`;
        }).join('');
        return `<span class="zn-spark" aria-hidden="true">${bars}</span>`;
      }
      // Jeden záznam = karta. Hooky ponechány stejné jako v tabulce:
      // data-act="view" (otevřít detail), data-act="menu" (nabídka), .entry-pick (výběr).
      function buildEntryCard(e, withPick){
        const st = rovinatostStats(e.longNote, e.crossNote);
        const stav = !st ? 'none' : (!st.vyhovuje ? 'bad' : (st.max>=8 ? 'warn' : 'ok'));
        const pick = withPick
          ? `<input type="checkbox" class="entry-pick" data-id="${escAttr(e.id)}" ${selectedIds.has(e.id)?'checked':''} aria-label="Vybrat záznam">`
          : '';
        const cas = (e.timeText||'').split(' ').pop() || e.timeText || '';
        const idCev = (e.office && e.office.id_cev) ? e.office.id_cev : '';
        // Na řádku je nejvýš jeden odznáček (office). Stav synchronizace je ⏳ před časem —
        // jinak dlouhé `inspectors` ("J. Novák, M. Dvořák") + dva odznáčky rozbijí úzký sloupec.
        const officeTag = e.officeDone
          ? '<span class="zn-tag office-done">✓ office</span>'
          : '<span class="zn-tag office-wait">⏳ office</span>';
        const syncMark = e.synced ? '' : '<span class="zn-sync" title="neodesláno do cloudu">⏳</span>';
        let popis = idCev || (e.note||'').trim();
        if(!st) popis = 'bez měření rovinatosti';
        else if(!st.vyhovuje) popis = `${st.ok} z ${st.total} hodnot do 10 mm · ${st.pct} %`;
        else if(st.hasOver) popis = 'bod mimo klínek (> 20 mm)';
        const maxTxt = !st ? '—' : (st.hasOver ? '✕&gt;20' : st.max + ' mm');
        const thumb = e.photo
          ? `<img class="zn-thumb" src="${e.photo}" alt="foto" loading="lazy">`
          : '<span class="zn-thumb empty">📷</span>';
        return `<div class="zn-card ${stav}" data-id="${escAttr(e.id)}">
          ${pick}
          <span class="zn-open" data-act="view">
            ${thumb}
            <span class="zn-main">
              <span class="zn-line1">
                ${syncMark}
                <span class="zn-time">${escapeHtml(cas)}</span>
                <span class="zn-who">${escapeHtml(e.inspectors||'')}</span>
                ${officeTag}
              </span>
              <span class="zn-line2">${escapeHtml(popis||'—')}</span>
            </span>
            ${sparklineHtml(st)}
            <span class="zn-max ${stav==='none'?'none':stav==='bad'?'bad':stav==='warn'?'warn':''}">${maxTxt}</span>
          </span>
          <button type="button" class="entry-menu-btn" data-act="menu" aria-label="Akce">⋯</button>
        </div>`;
      }
      function buildEntriesList(entries, withPick){
        if(!entries.length) return '';
        return `<div class="zn-list">${entries.map(e=> buildEntryCard(e, withPick)).join('')}</div>`;
      }
```

### 4c) Tři řádky k záměně

| Řádek (přibl.) | Bylo | Bude |
|---|---|---|
| 1797, ve `wireEntriesTable` | `ev.target.closest('tr[data-id]')` | `ev.target.closest('[data-id]')` |
| 1824, v `renderFilteredResults` | `buildEntriesTable(shown, true)` | `buildEntriesList(shown, true)` |
| 2197, v `renderFoldersAndEntries` | `buildEntriesTable(entriesInFolder, true)` | `buildEntriesList(entriesInFolder, true)` |

Ověř, že `wireEntriesTable` obsluhuje `data-act="view"` jako otevření detailu. Pokud se hodnota
jmenuje jinak, uprav ji v `buildEntryCard` — nikoli naopak.

## 5) FÁZE 2 — detail jednotlivého záznamu (jádro úkolu)

Dnes se detail otevírá v `#viewer` přes celou obrazovku jako svislý výpis „label : hodnota“
s velkou fotkou. Nově:

- **Web ≥ 1200 px:** tři panely vedle sebe — *seznam (292 px) | detail (pružný) | pravý panel (284 px)*.
  Klik na kartu vykreslí detail do prostředního panelu, `#viewer` se neotevírá. Vybraná karta má
  `.sel` a oranžový levý pruh.
- **Web < 1200 px a mobil:** detail zůstává v `#viewer` na celou obrazovku, jen s novým obsahem
  (stejné bloky pod sebou). Tlačítko Zpět / History API zachovat.

Vytáhni vykreslení detailu do jedné funkce `buildEntryDetailHtml(entry)` a používej ji na obou
místech; pravý panel jako `buildEntrySideHtml(entry)`.

### 5a) Hlavička detailu (jeden řádek, `background:#fff`, `border-bottom:1px solid #E2E6E9`)

1. `timeText` monospace 16 px + chip se složkou (`2026_07_28`, monospace 10,5 px na `#F0F3F4`).
2. Pod tím 11,5 px `#8B979F`: `inspectors` · `id_cev` nebo `bez ID CEV (doplní Office)`.
3. Verdikt jako pilulka: `vyhovující` (`#e6f4ea`/`#1e7d34`) / `nevyhovující` (`#fde8e8`/`#c62828`) /
   `nezměřeno` (šedá).
4. Dva číselné bloky: **„X z Y hodnot ≤ 10 mm“** + procenta a poznámka `· mez 75 %`;
   **„max. odchylka“** `8 / 10 mm` (barva podle pásma; `✕ > 20` když je bod mimo klínek).
5. Vpravo primární akce: `Doplnit v Office` (oranžová) když `!officeDone`, jinak `📄 Protokol (PDF)`.
   Za ní `⋯` s destruktivními a vzácnými akcemi (přesun do složky, smazat) — mazání **nikdy**
   nedávej jako samostatné velké tlačítko.

### 5b) Tělo detailu

- **Vlevo sloupec 206 px:** foto *při kontrole* (`photo`) s popiskem v levém dolním rohu, klik =
  fullscreen (stávající chování). Pod ním `afterPhoto`, nebo přerušovaný placeholder
  „foto po opravě — doplní Office“.
- **Vpravo karta měření** (bílá, `border:1px solid #E2E6E9`, radius 6, padding 13/16):
  - Nadpis `Příčné měření` + tlumeně `2 m lať · N hodnot`, vpravo `| mez 10 mm`.
  - Jedna hodnota = vodorovný pruh: kolejnice `#F0F3F4` výšky 8 px, výplň
    `width = min(v,20)/20*100 %` (tj. **10 mm = 50 %**), svislá ryska mezí na 50 %
    (`1px #D3B0AA`), vpravo hodnota monospace 11 px v pevné šířce 40 px.
    Barvy výplně: `> 10 mm` nebo `'x'` → `#c62828`; `8–10` → `#D69220`; jinak `#8FA6B2`;
    nula → 2px `#CFD7DC`. Hodnota `'x'` = plný pruh s popiskem `✕ > 20 mm`.
  - Oddělovač 1 px, pak stejným způsobem `Podélné měření`.
  - Nikde nevypisuj původní řetězec „5; 8; 7; …“ jako hlavní obsah; smí být jen v titulku (tooltipu).
- **Pásek pod tím** (bílá karta rozdělená svislými linkami, 4 pole): `Vyjetá kolej` (Ano/Ne),
  `Poznámka z výjezdu` (`note`), `Synchronizace` (`✓ čas` / `⏳ neodesláno`), `Office část`
  (`✓ hotovo` / `⏳ čeká`).

### 5c) Pravý panel (284 px, jen ≥ 1200 px)

1. **Mapa** 214 px vysoká — použij existující Leaflet, jednu instanci na složku/filtr, s body
   obarvenými podle verdiktu; aktivní záznam větší s oranžovým kroužkem. Když `coords` chybí,
   místo mapy tlumená plocha „bez polohy“.
2. **GPS** — `lat, lon` monospace + tlačítko `Upravit` (napojit na stávající přesun kontrolního bodu).
3. **Dokumenty** — řádky s ikonou: `Záznam o opravě (PDF)` (z `office.repairPdf`, jinak „nenahráno“),
   `Protokol z měření` (jinak „lze až po Office části“), `Foto při kontrole` s velikostí v MB.

### 5d) Mobilní detail

Stejné bloky, pod sebou, v tomto pořadí: hlavička (čas + složka + `⋯`) → **pruh s verdiktem
a max. hodnotou** hned pod hlavičkou → karta měření (příčné a podélné, klidně přes přepínač) →
fotky → pásek polí → dole přilepená lišta s primární akcí a stavem synchronizace.
Grafy měření musí být čitelné bez scrollování — přednost má příčné měření.

### 5e) Navigace na mobilu

Přidej **spodní lištu s pěti kartami** (🚛 Výjezd · 🏢 Office · 📁 Záznamy · 🗺️ Mapa · ⚙️ Nastavení)
pro šířky ≤ 640 px; drawer s ☰ ponech pro tablety a jako fallback. Aktivní karta oranžově
(`#C2461A`), výška položky ≥ 44 px, respektuj `env(safe-area-inset-bottom)`.
Na šířkách ≥ 1000 px ukaž **vodorovnou navigaci v tmavé liště** (`#14191D`) trvale, aby se kvůli
přepnutí karty nemusel otevírat drawer; vpravo v liště stav synchronizace, `⟳ Aktualizovat`
a e-mail uživatele.

## 6) Oprava výpočtu verdiktu (samostatný commit)

Tlačítko `✕ >20` ukládá hodnotu jako `'x'`, ale `parseRovinatostVals` ji zahodí filtrem `!isNaN`.
Bod nad 20 mm se tedy do verdiktu **nezapočítá** — komentář v kódu přitom tvrdí, že se počítá jako
nevyhovující. Oprava:

```js
      function parseRovinatostVals(str){
        if(!str) return [];
        return String(str).split(/[;\n]+/).map(s=>s.trim()).filter(s=>s!=='')
          .map(s=> /^x$/i.test(s) ? 20.0001 : parseFloat(s.replace(',', '.')))   // 'x' = přesah přes klínek
          .filter(v=>!isNaN(v));
      }
```

Dotkne se `rovinatostBadge`, `rovinatostBadgeSmall`, `rovinatostVerdiktText`, `rovinatostSplnuje`
i PDF protokolu, **včetně starších záznamů**. Proto zvlášť a jako poslední commit, ať se dá vrátit.

## 7) Co musí platit na konci

- Seznam: nevyhovující záznam poznám bez otevření; karta má jednu výšku i při dvou jménech
  v `inspectors` a odznáčku office (jméno se zkracuje výpustkou, nic nepřelézá mini graf).
- Detail: verdikt, procento a max. odchylka jsou vidět bez scrollování; hodnoty měření nikde nejsou
  jen výpis čísel; foto nezabírá víc než ~⅓ šířky detailu.
- Filtry, hledání, řazení, stránkování, hromadný výběr, export JSON/XLSX, PDF protokol, Office
  formulář, mapa a synchronizace fungují stejně jako předtím.
- Tlačítko Zpět (Android / prohlížeč) zavře detail, ne appku.
- Žádná nová závislost, žádný build krok, žádné volání navíc do Supabase.
- Funguje offline (SW cache) a na Androidu v PWA.

## 9) Podklady z design systému

| Soubor v repu (nový) | Co v něm je | Jak ho použít |
|---|---|---|
| `design/kk-tokens.css` | sloučený `:root` — barvy, typografie, mezery, tvary, pravidla měření | vlož obsah do `<style>` v `index.html` místo starého `:root`; soubor v repu zůstane jako dokumentace |
| `design/readme.md` | pravidla vzhledu a textů (čeština jako norma, ikonografie, stavy, foto jako doklad) | čti před psaním nových obrazovek |
| `design/ui-kit.html` | klikací předloha: Záznamy web, Záznamy mobil, Výjezd mobil, Office web | otevři v prohlížeči a měř z ní rozměry; **nekopíruj z ní React** — appka je bez frameworku |

`ui-kit.html` je React + Babel z CDN jen proto, aby se dal proklikat. Do appky se z něj přenáší
**rozvržení, rozměry, barvy a texty**, ne kód.

## 10) FÁZE 4 — Výjezd a Office (až po fázích 1–3)

Stejné tokeny, žádná změna logiky ani `OFFICE_SCHEMA`.

**🚛 Kontrolní výjezd (mobil je hlavní):**
- Sekce jako bílé karty s rámečkem: 👷 Kontrolu provádí · 📷 Foto opravy · 📐 Rovinatost [mm] ·
  🛞 Vyjetá kolej · 📝 Poznámka. Modrý podklad `.measure-group` (`#f4f8fe`) nahraď bílou kartou.
- Zadané hodnoty zůstávají jako pilulky; `✕ >20` červeně s popiskem `✕ > 20 mm`.
- Pod sekcí rovinatosti **živý verdikt** — pilulka + „X z Y do 10 mm · Z % · mez 75 %“, přepočítaná
  při každém přidání hodnoty (dnes se verdikt objeví až po uložení).
- Vysvětlivka „i“ zůstává, text: „Měří se 2 m latí. Vyhovující = aspoň 75 % hodnot do 10 mm.
  Nerovnost přes 20 mm zadej ✕ >20 — počítá se jako nevyhovující bod.“
- `Uložit záznam` jako přilepená lišta dole, výška 44 px, plná šířka.

**🏢 Office:**
- Dvě kolonky ≥ 1200 px: vlevo formulář (PDF + posuzovací pole), vpravo 300 px měření z výjezdu
  (stejné pruhy jako v detailu) a fotky *po opravě* / *při kontrole* vedle sebe.
- Vlevo od formuláře seznam **čekajících záznamů** (stejné karty jako v Záznamech, filtr
  `!officeDone`) — dnes se záznam vybírá jinde a není vidět, kolik práce zbývá.
- Posuzovací pole: přepínače jako celé řádky s rámečkem, vybraná možnost oranžový rámeček
  + `var(--orange-050)`. Možnosti neskracuj — jsou to formulace z normy.
- V hlavičce průběh „vyplněno X z Y polí“ (počítej z `OFFICE_SCHEMA`, ne natvrdo).
- Pod 1200 px kolonky pod sebou, měření nad formulářem.

## 8) Postup práce

1. Fáze 1 → ověř lokálně (`python -m http.server 8000 --bind 127.0.0.1`) na PC i v mobilním
   zobrazení DevTools → commit `Záznamy: seznam jako karty s mini grafem měření`.
2. Fáze 2 → ověř, commit `Záznamy: detail v panelu (web) a nový detail na mobilu`.
3. Fáze 3 (tokeny + navigace) → ověř, commit `Vzhled: tmavá navigace, tokeny, spodní lišta na mobilu`.
4. Fáze 4 (Výjezd, Office podle kapitoly 10) → ověř, commit `Vzhled: výjezd a office na nové tokeny`.
5. Oprava verdiktu z bodu 6 → samostatný commit.
6. V patičce `index.html` zvedni **Build** značku (verzi nezvedej — jde o ladicí změny UI),
   `git push` do `main`.

Postupuj po fázích a po každé se zastav, ať se dá výsledek prohlédnout. Když něco v zadání
nesedí s kódem, řekni to a navrhni řešení — needituj naslepo.
