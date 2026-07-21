# Návrh: přehledná DB + Záznamy + export (v3_test)

Tento soubor je zadání/prompt pro AI asistenta ve VS Code (Copilot Chat / Claude), který v repu `v3_test` implementuje hledatelnost záznamů a export. Vychází z aktuálního schématu v `supabase_setup.sql` a konvencí v `CLAUDE.md`.

## 0) Princip

`office` (jsonb) zůstává **zdroj pravdy** – neměnit způsob ukládání z appky. Klíčová pole pro filtrování/export se z něj jen **odvodí** do generovaných sloupců (Postgres `GENERATED ALWAYS AS ... STORED`), takže appka nemusí nikde dvakrát zapisovat totéž a nic se nemůže rozejít.

## 1) DB – nové sloupce a indexy (do `supabase_setup.sql`)

Doplnit migraci (bezpečné pustit opakovaně, `add column if not exists`):

```sql
-- Odvozené sloupce z office jsonb – jen pro filtrování/export/report, appka je nezapisuje přímo
alter table public.entries
  add column if not exists repair_id text
    generated always as (office->>'repairId') stored,
  add column if not exists oprava_vyhovujici boolean
    generated always as ((office->>'opravaVyhovujici')::boolean) stored,
  add column if not exists reklamace text
    generated always as (office->>'reklamace') stored,
  add column if not exists byl_vyvrt boolean
    generated always as ((office->>'bylVyvrt')::boolean) stored,
  add column if not exists byl_troxler boolean
    generated always as ((office->>'bylTroxler')::boolean) stored;

-- Fulltextové hledání (poznámky, jména, složka)
alter table public.entries
  add column if not exists search_vector tsvector
    generated always as (
      to_tsvector('simple',
        coalesce(note,'') || ' ' || coalesce(long_note,'') || ' ' ||
        coalesce(cross_note,'') || ' ' || coalesce(inspectors,'') || ' ' ||
        coalesce(folder,'') || ' ' || coalesce(office->>'repairId','')
      )
    ) stored;

create index if not exists entries_search_idx on public.entries using gin (search_vector);
create index if not exists entries_time_idx on public.entries (time desc);
create index if not exists entries_folder_idx on public.entries (folder);
create index if not exists entries_office_done_idx on public.entries (office_done);
create index if not exists entries_owner_idx on public.entries (owner);
```

> Poznámka: přesné názvy klíčů v `office` (`repairId`, `opravaVyhovujici`, `reklamace`, `bylVyvrt`, `bylTroxler`) je nutné ověřit v `index.html` podle toho, jak appka `office` objekt skládá – přizpůsobit generovaným výrazům výše.

## 2) UI – karta "Záznamy"

Nad seznam přidat lištu:

- **Hledání** – textové pole, dotaz proti `search_vector` (`.textSearch('search_vector', query, {type:'websearch', config:'simple'})` v supabase-js), nebo lokálně přes IndexedDB filtrem stringu při offline.
- **Filtry** – rozsah dat (od/do), složka (select), kontrolující (multiselect z `kk_persons`), stav office (vše/hotovo/čeká), oprava vyhovující (vše/ano/ne), reklamace (vše/ano/ne).
- **Řazení** – nejnovější / nejstarší / podle složky.
- **Stránkování** – `.range(from, to)` po např. 50 záznamech, nebo infinite scroll při scrollu na konec seznamu.
- **Hromadný výběr** – checkbox u řádku + "Vybrat vše (filtrované)" → hromadný export nebo smazání vybraných.

Zachovat stávající vizuál (karty/seznam, ✓/⏳ badge stavu office), jen nad něj přidat filtrovací lištu a stránkování.

## 3) Export

Rozšířit `exportBtn` na dropdown/menu s volbami, exportuje se vždy **aktuálně vyfiltrovaná množina** (ne vždy vše):

- **JSON** – zachovat (dnešní chování, plná data pro zálohu/re-import).
- **CSV/XLSX** – nový, přes SheetJS z CDN (`https://cdnjs.cloudflare.com/ajax/libs/xlsx/...`), žádný build krok potřeba. Funkce `exportToXlsx(entries)`:
  - vyrobí plochou tabulku – běžné sloupce 1:1, `office` jsonb rozbalit do samostatných sloupců (klíč → název sloupce), `coords` na `lat`/`lon`, fotky **vynechat** (base64 by XLSX nafouklo) a nahradit sloupcem `ma_fotku` (ano/ne).
  - `XLSX.utils.json_to_sheet(rows)` → `XLSX.writeFile(wb, "kontrolakvality_${dateStr}.xlsx")`.
- **PDF protokol** – jeden záznam = jedno tlačítko v detailu (mimo hromadný export), pdf.js/jiná knihovna z CDN, vzor layoutu podle `Protokol_VZOR` listu ve stávajícím xlsm.

## 4) Pořadí implementace (kroky pro AI asistenta)

1. `supabase_setup.sql` – doplnit generované sloupce + indexy z bodu 1, ověřit názvy klíčů v `office` proti `index.html`.
2. `index.html` – karta Záznamy: přidat filtrovací lištu (hledání, datum, složka, kontrolující, stav) a stránkování/infinite scroll nad stávající seznam.
3. `index.html` – hromadný výběr řádků + hromadné akce (export vybraných, smazat vybrané – přes `deleteEntryFully`).
4. `index.html` – `exportBtn` → menu (JSON / CSV-XLSX), doplnit `exportToXlsx()` s rozbalením `office`, načíst SheetJS z CDN.
5. Zvýšit Build značku v patičce (dle `CLAUDE.md`), commit + push.
6. (Později, samostatně) PDF protokol jednotlivého záznamu.

Postupovat po krocích, po každém ověřit v `python -m http.server 8000` lokálně. Před úpravou `supabase_setup.sql` a před hromadným mazáním se ptát (dle `CLAUDE.md` pravidel).
