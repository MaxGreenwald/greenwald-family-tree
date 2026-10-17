# Family data changes, Oct 2026

Source of truth: six screenshots of Max's 23andMe family tree, sent Oct 17, 2026.
Names and his added notes were kept as-is, with one exception (Gerrie renamed to Gigi Greenwald at Max's request).
Only links/labels the screenshots clearly show were changed. The snapshot test (`tests/data-snapshot.json`) was regenerated on purpose to match.

| Ref | Screenshot | What it shows |
|-----|------------|---------------|
| S1 | a65bbe2c…png | Cohens (23andMe: Cahners/Connors) family, right half of Charles & Minnie's children |
| S2 | e02a7504…png | Gerald & Gigi, Sidney/Sarah, Eisenberg, Abraham Kapstein → Max Kapstein & Rose, Harold/Sayde/Florence, Joan |
| S3 | 5ae55c12…png | Herschel & Rose, Murray's two marriages, Hugh/Eric kids, Maxine Hoffman & Gerson Barter, Unknown Brothers |
| S4 | 34186040…png | Shapira, Forer, Chaim Tzvi, Boruch & Kella's children and their descendants |
| S5 | 6ea89674…png | Weinhaus, Frank & Leah, Frank & Bertha Ketay, Baruch, Suzanne & Bruce Farkas lines |
| S6 | b111960c…png | Rose Kapstein's children (incl. Charles), Charles & Minnie's children and grandchildren |

## Link changes
- Gerrie → **Gigi Greenwald** (name only; Max's correction).
- Abraham Kapstein & Dora Lieberman → child is **Max Kapstein** (not Sol, not Rose). [S2]
- **Max Kapstein + Rose Kapstein** are a couple; children: Harold, Sophie (Sayde), Florence, Edward, Daniel, Evelyn, Milton, Irving, Sidney, Dorothy, Stevens (Sherwin) Kapstein and **Charles Moses Reeves**. [S2, S6]
- Sol & Fanny → only child Sidney (Harold/Sophie/Florence moved to Max & Rose). [S2]
- Sidney & Sarah → children Sally and Gigi only. Joan moved to Harold Kapstein; Shirley moved to Charles & Minnie. [S2]
- **Joan Kapstein** = child of Harold Kapstein (and an unnamed Eisenberg wife); label "1st cousin twice removed" was right. [S2]
- Shirley Hope Roberts/Reeves → child of Charles & Minnie (her sibling bar runs toward the Reeves children, orange mother's-side line). [S2] *inferred across the screen edge*
- Charles & Minnie's children: + Ruth Olive (Robie), + June (data "Jane"), + Shirley; − Polly (she is Bruce's wife). [S6, S1]
- William & Ann (Joan) → + Pam. Doris + Ellen (23andMe "Edward") Berger → Barbara, Stephen. Ruth Olive + Edward Pasternak → Jane, Kent, Scott. Bruce + Polly → Polly, Charlie. June + Thomas Boyer → Kenneth. Martha + Joseph → Robert, Michael. A.B. + Carmen → Alex, Catherine, John, E. Reeves. Channing: no kids. [S6, S1]
- Andy Reeves no longer parent of Polly/Charlie; Martin Reeves no longer parent of Nell (Ruth) Lauritzen, whose parents are unnamed Cohens descendants. [S6, S1]
- Samuel & Celia Cohens → James, Sue, Lee, Bertha, Ruth, Minnie (Kitty is James's wife). [S1, S3]
- James + Kitty → Norman, Fulton, Channing (23andMe "Charlotte"), Walter. Channing + Hazel ("Harpel") → Peter. Bertha Cohens (+ Winn) → Arthur, Deidree ("Debbie"), Danny. Lee: no kids shown. [S1]
- Herschel & Rose → Murray and **Maxine Hoffman** (added: named in S3; needed to connect the Barters). George Barber (23andMe "Gerson Barter") is Maxine's husband, not Murray's brother. Maxine + George → Bruce, Mark, Jeff Barber. [S3]
- Murray + Eleanor → Rachel, Hugh. Murray + unnamed 2nd wife → Eric (half uncle). Hugh → Emma, Greta, Isabella. Eric → Elana. [S3]
- Unknown Brother (2) → Holocaust Survivor 1 & 2 (moved from Gussie Tolarsky). [S3]
- Pinchas Furer → Keila Furer, Chaim Furer. Chaim Tish → Sonya Kaplan. [S4, S5]
- Samuel Greenwald → Dorothy, Marian. Morris + Belle → Kay, Betty. Bertha Kutep → Nathan. Chaika → Meyer, Sid, Esther. Betty + Donald Siegel → Judith, Connie, Bryan, Lori. Judith + David Monasch → Sara, Elan. Connie + Richard Simon → Eliana, Benjamin. [S4]
- Frank + Leah → Suzanne, Gerald. Frank + Bertha Ketay (not in data) → Baruch. Baruch (+ Ora Enosh, not in data) → Odrea, Esther. Odrea + Amichai → Esther, Tamar, Haim. Esther + Avraham Steinmetz → Tali, Adi, Shiri. [S4, S5]
- Suzanne + Bruce Farkas → David, Alan, Debbie. David + Mary Squires → Jacob, Shaina. Alan → Amanda, Andrew. Debbie + Mona McDonald → Naomi, Jonah. [S5]

## Label changes (to the 23andMe label)
max_kapstein 2ND GREAT-GRANDFATHER; joan_kapstein 1ST COUSIN TWICE REMOVED; polly_r_ga RELATIVE; ruth_robie and jane_r GREAT AUNT/UNCLE; pam_r, charlie_reeves, michael_reeves, e_reeves 1ST COUSIN ONCE REMOVED; channing_c, deidree_w, danny_w 1ST COUSIN TWICE REMOVED.

After these changes, every connected person's computed relationship to Max matches their label.

## People added (Max approved, Oct 17, 2026)
Names and labels exactly as in the screenshots; unnamed spouses skipped.
- **Bertha Ketay** (RELATIVE), Frank Greenwald's partner, Baruch's mother. [S5]
- **Ora Enosh** (RELATIVE), Baruch's partner, mother of Odrea and Esther. [S5]
- **Aimee Weitz** (RELATIVE), Alan Farkas's wife, mother of Amanda and Andrew. [S5]
- **Winn** (RELATIVE), Bertha Cohens's husband, father of Arthur, Deidree (Debbie) and Danny. [S1, S3]
- **Matanya Steinmetz** (HALF 2ND COUSIN), child of Esther Greenwald and Avraham Steinmetz. [S5]
Gender left blank for Winn and Matanya (the screenshots don't say).
