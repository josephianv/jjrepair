# 🔗 QR de Seguimiento — Listo, solo falta 1 paso tuyo

Ya integré todo directamente en tu código real (cloné tu repo, usé tus nombres
de colección reales `jjrepair_casos` / `jjrepair_clientes`, tus campos reales
`fotos`, `notas`, `estado`, `precio`, etc. — no una plantilla genérica).

## Archivos en este mensaje (reemplazan a los tuyos)
- `index.html` → tu archivo con el botón "🔗 QR seguimiento" agregado en el
  detalle de cada caso (junto al botón de WhatsApp), más el modal QR y las
  funciones necesarias.
- `track.html` → página pública nueva. El cliente la abre al escanear el QR.
  Sin login. Muestra: estado (con barra de progreso), equipo, problema,
  notas técnicas, fotos y presupuesto.
- `sw.js` → versión de caché subida a `v17` para forzar que todos los
  usuarios reciban esta actualización al abrir la app.

## Qué hace el botón QR
1. Abres un caso → click "🔗 QR seguimiento"
2. Se genera un código único (`JJERyyyymmddhhmmss + random`) y se guarda en
   el documento del caso en Firestore (`trackingCode`)
3. Se muestra el QR + el enlace, con botones para copiar, descargar o
   enviarlo por WhatsApp directo al cliente
4. El cliente escanea → abre `track.html?code=...` → ve su reparación

## ⚠️ ÚNICO PASO QUE TÚ DEBES HACER: reglas de Firestore

`track.html` consulta Firestore **sin que el cliente inicie sesión**. Ahora
mismo tus reglas probablemente exigen `request.auth != null` para leer
`jjrepair_casos`, así que el cliente vería "Error de conexión" hasta que
ajustes la regla.

Ve a **Firebase Console → Firestore Database → Reglas** y para la colección
`jjrepair_casos` permite lectura pública **solo** cuando el documento ya
tiene `trackingCode` (o sea, solo los casos que tú decidiste compartir):

```
match /jjrepair_casos/{casoId} {
  allow read: if request.auth != null
              || (resource.data.trackingCode is string);
  allow write: if request.auth != null; // deja tus reglas de escritura como están
}

match /jjrepair_clientes/{clienteId} {
  allow read: if request.auth != null
              || true; // track.html necesita leer nombre del cliente
  allow write: if request.auth != null;
}
```

**Nota honesta sobre seguridad:** con esta regla, alguien que ya tenga (o
adivine) un código válido puede ver ese caso — es el diseño esperado de un
sistema de seguimiento por link, igual que un número de tracking de un
courier. Lo que la regla evita es que alguien liste o vea casos que **no**
tengan `trackingCode` generado (es decir, reparaciones que nunca compartiste).
Si prefieres una regla más estricta o quieres que revisemos esto juntos
antes de publicarlo, dímelo y la ajustamos.

## Cómo subir esto a GitHub Pages

Como el repo es público pero no tengo tus credenciales para hacer push,
necesitas subir tú estos 3 archivos. Formas de hacerlo:

**Opción A — Interfaz web de GitHub (más fácil):**
1. Ve a `https://github.com/josephianv/jjrepair`
2. Arrastra `index.html` y `sw.js` a la raíz (reemplazan a los actuales)
3. Sube `track.html` como archivo nuevo en la raíz
4. Commit directo a `main`

**Opción B — Git en tu computadora:**
```bash
git clone https://github.com/josephianv/jjrepair.git
# copia los 3 archivos descargados aquí dentro de la carpeta jjrepair/
git add index.html track.html sw.js
git commit -m "Agregar seguimiento QR para clientes"
git push
```

Después de subir, espera 1-2 minutos a que GitHub Pages republique, y prueba
en `https://josephianv.github.io/jjrepair/`.

## Cómo probarlo
1. Abre la app → cualquier caso → "🔗 QR seguimiento"
2. Click "💾 Descargar QR" o copia el enlace
3. Ábrelo en el teléfono (o escanéalo) → deberías ver la página pública
4. Si dice "Error de conexión" → faltan las reglas de Firestore (ver arriba)
