# Analisi importabilità moduli Odoo `odoo_ded`

> Repo: `C:\Users\andre\cyberfolk\odoo_ded`
> Obiettivo: capire le feature di ogni modulo e come replicarle (target: stack non-Odoo, es. `ttrpg-core`).
> Stato: **STEP 1 — giro sommario + tabella**. Attendo indicazione su quali moduli approfondire.

## Dipendenze esterne (moduli `cf_*` di utility)

I moduli `odoo_ded` dipendono da utility che vivono in **`C:\Users\andre\cyberfolk\odoo_utility`**.
`web_hierarchy` è invece core Odoo (commentato in `cf_ded_base`, non usato).

| Modulo                  | App? | Tipo         | Usato da             | Modelli                               | Feature in sintesi                                                                                 |
|-------------------------|------|--------------|----------------------|---------------------------------------|----------------------------------------------------------------------------------------------------|
| **cf_o2m_expand_popup** | ❌    | UI pura (JS) | cf_hex_base          | —                                     | Widget `o2m_expand_popup`: bottone "Expand" che apre a schermo intero i popup dei record one2many. |
| **cf_m2m_tags_link**    | ❌    | UI pura (JS) | cf_hex_base          | —                                     | Estende `many2many_tags`: rende cliccabile il badge per aprire il record collegato.                |
| **cf_multiple_image**   | ❌    | UI pura (JS) | cf_hex_ded           | —                                     | Widget `MultipleImage`: visualizza in serie le immagini di un campo many2many su `ir.attachment`.  |
| **cf_data_handler**     | ✅    | Backend dati | cf_hex_ded_data_base | base, data_handler(+custom), ir_model | Gestione batch dati: import/export, handler custom. Infrastruttura di seeding.                     |

> **Nota replica:** i 3 widget UI (`o2m_expand_popup`, `m2m_tags_link`, `multiple_image`) sono
> patch al widget engine di Odoo — fuori da Odoo **non hanno equivalente da portare**, le funzionalità
> si ricreano nativamente nello stack target. `cf_data_handler` invece è logica di import/export
> potenzialmente rilevante se serve il seeding dei dati.

## Tabella moduli

| Modulo                        | App? | Categoria  | Dipende da                                    | Modelli principali                                                                                                                      | Feature in sintesi                                                                                                                                   |
|-------------------------------|------|------------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| **cf_ded_base**               | ✅    | D&D        | base, web                                     | artifact, biome (+structure), creature (+type/tag/faction/roster/encounter), lore_item, point_of_interest, quest, settlement, encounter | Modelli base D&D: bestiario, fazioni, PoI, quest, insediamenti, artefatti, lore. Report roster creature.                                             |
| **cf_ded_campaign**           | ❌    | Map        | cf_ded_base                                   | campaign, campaign_pg, campaign_session(+_pg), res_partner                                                                              | Gestione campagne: PG, sessioni, collegamento a partner. Widget `FieldPxWidget` (JS).                                                                |
| **cf_ded_spell**              | ❌    | D&D        | cf_ded_base                                   | spell, spell_list                                                                                                                       | Incantesimi + liste incantesimi. Report stampa lista spell.                                                                                          |
| **cf_ded_narrative**          | ❌    | D&D        | cf_ded_base                                   | narrative_relation (+mixin), estende creature/faction/poi/quest/artifact/lore                                                           | Relazioni narrative tra record (grafo di relazioni). Mixin `_mixin_narrative_entity`.                                                                |
| **cf_hex_base**               | ✅    | Map        | cf_o2m_expand_popup, cf_m2m_tags_link         | hex_hex, hex_quad, hex_map, hex_group, hex_mixin                                                                                        | Hex map base: mappe, quadranti, esagoni. Filtri app.                                                                                                 |
| **cf_hex_base_v1**            | ❌    | Map        | cf_hex_base                                   | hex_hex, hex_quad, hex_map, hex_mixin                                                                                                   | Tipologia hex V1 + dati (`data/hex.xml`). `post_init_hook`.                                                                                          |
| **cf_hex_base_v2**            | ❌    | Map        | cf_hex_base                                   | hex_hex, hex_quad, hex_map, hex_mixin                                                                                                   | Tipologia hex V2. `post_init_hook`.                                                                                                                  |
| **cf_hex_base_v3**            | ❌    | Map        | cf_hex_base                                   | hex_hex, hex_map, hex_mixin                                                                                                             | Tipologia hex V3 (no quad). `post_init_hook`.                                                                                                        |
| **cf_hex_ded**                | ❌    | Map        | cf_hex_base, cf_ded_base, cf_multiple_image   | estende hex_hex + artifact/biome/creature/faction/poi/quest/settlement/encounter                                                        | "Hex-Script": collega lore/biomi/creature al singolo esagono. Ponte tra D&D base e hex map.                                                          |
| **cf_hex_ded_client**         | ✅    | Map (17.0) | cf_hex_ded, cf_hex_base_v1, cf_hex_base_v2    | asset_tile, hex_asset_tile, hex_hex, hex_map, hex_quad, biome                                                                           | **Frontend OWL ricco**: interfaccia mappa interattiva (`ViewMapClient`), widget `QuadWidget`, modello `asset_tile` (immagini su hex). Tanto JS/SCSS. |
| **cf_hex_ded_data_base**      | ❌    | Map        | base+hex+ded+campaign+client, cf_data_handler | asset_tile, creature_faction, hex_hex                                                                                                   | Caricamento dati (demo.xml) per popolare i record. `post_init_hook`.                                                                                 |
| **cf_hex_ded_data_finimondo** | ❌    | Map        | cf_hex_ded_data_base                          | — (solo post_init_hook)                                                                                                                 | Dataset specifico "Finimondo". Solo dati via hook.                                                                                                   |

## Cartella `deprecated/`

Script utility sciolti (non moduli): `import_creature_csv.py`, `mixin_img_from_path.py`, `mixin_import_csv.py`, `odoo_to_json.py`.

## Raggruppamento logico (per replica)

1. **Dominio D&D puro** → `cf_ded_base`, `cf_ded_spell`, `cf_ded_narrative` (dati + logica, poca UI Odoo-specifica)
2. **Campagne** → `cf_ded_campaign`
3. **Hex map (engine)** → `cf_hex_base` + varianti `v1/v2/v3`
4. **Hex map (dominio D&D)** → `cf_hex_ded`
5. **Client interattivo (UI complessa)** → `cf_hex_ded_client` ← qui sta il grosso del lavoro frontend
6. **Dati/seed** → `cf_hex_ded_data_base`, `cf_hex_ded_data_finimondo`

---

## Prossimo step

Dimmi **quali moduli guardare** e quali **skippare**. Per quelli scelti approfondisco:
campi dei modelli, logica Python, viste/widget JS → e proposta concreta di replica.
