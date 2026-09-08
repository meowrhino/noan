# El dominio noancittadino.com

**Estado a 8 de septiembre de 2026:** el dominio funciona, está pagado y **no ha caducado**.
Lo que está roto es a dónde apunta. Mientras tanto la web se sirve en
<https://meowrhino.github.io/noan/>, y es ahí donde la enlaza meowrhino.studio.

---

## Resumen en dos líneas

Wix, que es el registrador del dominio, le cambió los nameservers a los suyos de parking
y con eso se perdieron los registros DNS que llevaban a GitHub Pages. **No hay que
volver a comprar nada**: hay que entrar en la cuenta de Wix y volver a apuntarlo.

---

## Qué dice el whois (y qué no dice)

```
Domain Name: NOANCITTADINO.COM
Registrar: Wix.com Ltd.
Creation Date:      2024-08-19
Registry Expiry Date: 2027-08-19      ← pagado hasta dentro de 11 meses
Updated Date:       2026-08-23
Domain Status: clientTransferProhibited
Domain Status: clientUpdateProhibited
Name Server: DNS1.PARASTORAGE.COM
Name Server: DNS2.PARASTORAGE.COM
DNSSEC: unsigned
```

Cómo se lee:

- **`Registry Expiry Date: 2027-08-19`** — el dominio está pagado hasta agosto de 2027.
  No está libre ni se va a liberar. Si alguien esperase a que caducara para comprarlo,
  la fecha más temprana posible sería **noviembre de 2027**: caducidad + ~30 días de
  gracia + 30 días de redención + 5 días de `pendingDelete`. No es el camino.
- **`clientTransferProhibited` / `clientUpdateProhibited`** — es el candado normal que
  todos los registradores ponen por defecto para evitar robos de dominio. No es una
  sanción. Se quita desde el panel de Wix.
- **`DNS1/DNS2.PARASTORAGE.COM`** — aquí está el problema. `parastorage.com` es la
  infraestructura de Wix. Estos nameservers no tienen los registros que llevan a
  GitHub Pages, así que el dominio resuelve a una IP de Wix (`199.15.163.139`) en vez
  de a la web.

## Qué pasó

| fecha | qué |
|---|---|
| 2026-08-22 | El dominio estaba en `clientHold` (Wix lo había sacado del DNS). Los nameservers eran `ns8/ns9.wixdns.net` y **sí** tenían los registros A correctos hacia GitHub Pages. |
| 2026-08-23 | Wix levantó el `clientHold` — pero a la vez **reseteó los nameservers** a `dns1/dns2.parastorage.com`. Al cambiar de nameservers se perdió la zona DNS entera, registros A incluidos. |
| 2026-09-08 | Sigue igual. El candado de transferencia está puesto y el dominio apunta a Wix. |

La causa original del `clientHold` suele ser la verificación ICANN del email del
registrante sin completar. Eso ya está resuelto; lo que queda es el DNS.

## Cómo arreglarlo

Las tres opciones necesitan lo mismo: **acceso a la cuenta de Wix del cliente**. No hay
forma de hacerlo desde fuera.

### Opción A — Restaurar los registros en Wix (lo más rápido, gratis)

En Wix → dominio → gestionar DNS, añadir:

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   meowrhino.github.io
```

**Vivo en 5 minutos – 2 horas** (lo que tarde en propagar el TTL).

### Opción B — Mover el DNS a Cloudflare sin transferir el dominio

1. Añadir `noancittadino.com` a la cuenta de Cloudflare del cliente.
2. Cloudflare da dos nameservers.
3. Pegarlos en Wix, sustituyendo los de parastorage.

**1–24 horas.** Gratis, y a partir de ahí el DNS se gestiona desde Cloudflare, que es
mucho más cómodo. El dominio sigue siendo de Wix a efectos de facturación.

### Opción C — Transferir el dominio a Cloudflare

Es una **transferencia**, no una compra:

1. En Wix, quitar el candado (`clientTransferProhibited`).
2. Pedir el código de autorización (EPP / auth code).
3. Iniciar la transferencia en Cloudflare con ese código.

**1–7 días** desde que se tiene el código. Renueva el dominio +1 año (~10 €).

## Importante: no basta con el DNS

Ahora mismo GitHub Pages **no tiene configurado ningún dominio personalizado** para
este repo:

```
$ gh api repos/meowrhino/noan/pages
{"status":"built","cname":null,"html_url":"https://meowrhino.github.io/noan/", ...}
```

`"cname": null`. Así que, además de arreglar el DNS, hay que ir a
**Settings → Pages → Custom domain**, escribir `noancittadino.com` y guardar. Eso crea
un archivo `CNAME` en la raíz del repo (no lo borres) y activa el certificado HTTPS.

Orden recomendado: primero el DNS, esperar a que propague, y después el dominio
personalizado en Pages — si se hace al revés, GitHub falla la verificación y hay que
reintentarlo.

## Cuando funcione, hay que deshacer dos cosas en meowrhino.studio

En el repo `meowrhino/becasDigMeow`:

1. **`data.json`** — el proyecto `noan cittadino` apunta ahora a
   `https://meowrhino.github.io/noan/` y lleva un `urlLabel` para que la tarjeta no
   muestre la URL cruda. Devolver a `"url": "https://noancittadino.com"` y borrar el
   `urlLabel`.
2. **`archive-data.json`** — la entrada de `noan cittadino` tenía dos enlaces, `repo` y
   `web`. Se quitó el `web` porque estaba muerto. Devolver
   `{ "label": "web", "url": "https://noancittadino.com" }`.

Y de paso, en `proyectos-seo.json`, los `title` de es/en/cat volvieron a decir
`noan cittadino` en vez de `noancittadino.com`. Si se recupera el dominio, se puede
revertir.

Después, `npm run build` en ese repo.

## Cómo comprobar si ya está

```bash
whois noancittadino.com | grep -i "name server"
dig +short noancittadino.com A
curl -sI https://noancittadino.com | head -1
```

Está bien cuando los nameservers ya no son de parastorage, los `A` son las cuatro IP
`185.199.10x.153` y el `curl` devuelve un `200`.
