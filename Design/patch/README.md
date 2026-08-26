# Nasazení do aplikace — postup

Tři soubory, čtyři fáze. Vše ručně kontrolovatelné, žádná nová závislost.

## Co nakopírovat do repa

Ve `v3_test` vytvoř složku `design/` a dej do ní:

| Z tohoto projektu | Do repa jako |
|---|---|
| `patch/kk-tokens.css` | `design/kk-tokens.css` |
| `readme.md` | `design/readme.md` |
| `ui_kits/kontrola-kvality/index.html` | `design/ui-kit.html` |
| `assets/FT-LOGO-nove1.png` | už v repu je (`FT-LOGO-nove1.png`) |

`design/` je jen dokumentace — do `index.html` se nelinkuje, jen se z ní kopírují hodnoty.
V `ui-kit.html` je potřeba internet (React + Babel z CDN); appka samotná zůstává offline.

## Fáze

1. **Tokeny** — obsah `design/kk-tokens.css` vlož místo `:root{--brand:#1976d2;…}` (~ř. 21)
   a projdi tabulku modrých hexů na konci souboru. ~30 minut, vizuálně se změní celá appka.
2. **Seznam záznamů jako karty** — hotový patch v `zaznamy-patch.md`: CSS blok, tři funkce,
   tři řádky k záměně. ~15 minut.
3. **Detail záznamu** — tři panely na webu, nový detail na mobilu, spodní lišta karet.
   Není napsané jako patch; zadání je v `zadani-pro-ai-vscode.md`, kapitola 5.
4. **Výjezd a Office** — `zadani-pro-ai-vscode.md`, kapitola 10.

Pak zvlášť **opravu verdiktu** (`zadani-pro-ai-vscode.md`, kapitola 6) — mění výsledky
i u starých záznamů, ať se dá vrátit samostatným revertem.

## Jak to zadat AI ve VS Code

Otevři složku `v3_test`, spusť Claude Code (nebo Copilot Chat) a jako první zprávu vlož
**celý obsah `zadani-pro-ai-vscode.md`**. Zadání samo říká, co nesmí měnit (IndexedDB,
Supabase, filtry, PDF, `OFFICE_SCHEMA`, History API) a že se má po každé fázi zastavit.

Ověřuj lokálně: `python -m http.server 8000 --bind 127.0.0.1`, pak v DevTools i mobilní
zobrazení. Nakonec zvedni **Build** značku v patičce a `git push` do `main`.
