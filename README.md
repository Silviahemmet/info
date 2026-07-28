# Silviahemmet TV-information

En statisk informationsskärm för Silviahemmet med:

- aktuell tid, datum och finlandssvensk namnsdag
- väder i Helsingfors
- femdagarsprognos med animerade vädersymboler
- nyheter från Svenska Yle
- dagens citat

## Användning

Öppna `index.html` i en webbläsare. Skärmen är anpassad för en 16:9-TV och
uppdaterar informationen automatiskt.

Internetanslutning krävs för väder, prognos, namnsdag och nyhetsflöde.

## Publicera med GitHub Pages

1. Skapa ett nytt repository på GitHub.
2. Ladda upp samtliga filer från denna mapp till repositoryts rot.
3. Öppna **Settings → Pages**.
4. Välj **Deploy from a branch**.
5. Välj branchen `main` och mappen `/ (root)`.
6. Klicka på **Save**.

GitHub visar därefter adressen till den publicerade informationsskärmen.

## Filer

- `index.html` – layout, utseende och animationer
- `compat.js` – datahämtning och stöd för äldre TV-webbläsare
- bildfilerna – byggnad, logotyp och vädersymboler

