# Patch: karta Záznamy → nový seznam (varianta 2a)

Cíl: nahradit tabulku `.zn-table` seznamem karet s mini-grafem měření, max. odchylkou a stavem
office/synchronizace. Data, IndexedDB, Supabase, filtry ani `wireEntriesTable` se nemění.

Soubor: `index.html` (repo `jandedek-afk/Kontrola_kvality_v3_test`, branch `main`).
Vše je čisté HTML/CSS/JS — žádný build krok, jen vložit a uložit.

---

## 1) CSS — vlož před `</style>` (řádek ~337)

```css
    /* === Záznamy: seznam karet (varianta 2a) === */
    .zn-list{display:grid;gap:8px}
    .zn-card{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e3e8ef;
      border-left:3px solid #cfd7dc;border-radius:10px;padding:9px 12px}
    .zn-card.ok{border-left-color:#1e7d34}
    .zn-card.bad{border-left-color:#c62828}
    .zn-card.warn{border-left-color:#d69220}
    .zn-card.none{border-left-color:#cfd7dc;opacity:0.7}
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
    .zn-tag{font-size:0.7rem;font-weight:500;padding:2px 6px;border-radius:3px;white-space:nowrap}
    .zn-tag.office-wait{background:#fdede6;color:#c2461a}
    .zn-tag.office-done{background:#e6f4ea;color:#1e7d34}

    /* mini graf měření: 1 sloupec = 1 hodnota, výška = odchylka, mez 10 mm = 50 % výšky */
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

## 2) JS — vlož za funkci `rovinatostBadgeSmall` (řádek ~1761)

```js
      // Statistika rovinatosti: bere i 'x' (přesah přes klínek, > 20 mm) jako nevyhovující bod.
      // POZOR: parseRovinatostVals() hodnotu 'x' zahodí (filtr !isNaN), takže verdikt v appce
      // dnes bod nad 20 mm nepočítá. Tato funkce to počítá správně.
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
        // jinak dlouhé `inspectors` ("J. Novák, M. Dvořák") + dva odznáčky rozbijí 292px sloupec.
        const officeTag = e.officeDone
          ? '<span class="zn-tag office-done">✓ office</span>'
          : '<span class="zn-tag office-wait">⏳ office</span>';
        const syncMark = e.synced ? '' : '<span class="zn-sync" title="neodesláno do cloudu">⏳</span>';
        // druhý řádek: ID CEV / poznámka / proč nevyhovuje
        let popis = idCev || (e.note||'').trim();
        if(st && !st.vyhovuje) popis = `${st.ok} z ${st.total} hodnot do 10 mm · ${st.pct} %`;
        else if(!st) popis = 'bez měření rovinatosti';
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

## 3) Dva řádky k záměně

| Řádek (přibl.) | Bylo | Bude |
|---|---|---|
| 1797, ve `wireEntriesTable` | `ev.target.closest('tr[data-id]')` | `ev.target.closest('[data-id]')` |
| 1824, v `renderFilteredResults` | `buildEntriesTable(shown, true)` | `buildEntriesList(shown, true)` |
| 2197, v `renderFoldersAndEntries` | `buildEntriesTable(entriesInFolder, true)` | `buildEntriesList(entriesInFolder, true)` |

`buildEntriesTable` / `buildEntryRow` / `entryCellHtml` **nemazat** — zůstanou pro režim tabulky
(nabídka „Sloupce ▾“ má smysl jen u ní).

Ověřit jednu věc: ve `wireEntriesTable` musí být `data-act="view"` obsloužené jako otevření detailu
(volání `openEntry`/viewer). Pokud se tam jmenuje jinak, přepiš `data-act="view"` v `buildEntryCard`.

## 4) Oprava výpočtu verdiktu (doporučeno, samostatně)

`parseRovinatostVals` zahazuje `'x'` (tlačítko ✕ >20), takže bod nad 20 mm se do verdiktu vůbec
nezapočítá — komentář v kódu přitom říká, že se počítá jako nevyhovující. Minimální oprava:

```js
      function parseRovinatostVals(str){
        if(!str) return [];
        return String(str).split(/[;\n]+/).map(s=>s.trim()).filter(s=>s!=='')
          .map(s=> /^x$/i.test(s) ? 20.0001 : parseFloat(s.replace(',', '.')))   // 'x' = přesah přes klínek
          .filter(v=>!isNaN(v));
      }
```

Dotkne se `rovinatostBadge`, `rovinatostBadgeSmall`, `rovinatostVerdiktText`, `rovinatostSplnuje`
i PDF protokolu — tzn. i dřívějších záznamů s `x`. Před nasazením potvrdit, že to je zamýšlené
chování (bod > 20 mm = nevyhovující bod).

## 5) Po nasazení

Zvednout **Build** značku v patičce `index.html` (dle CLAUDE.md), commit + push do `main`.
Verzi nezvedat — jde o ladicí změnu UI.
