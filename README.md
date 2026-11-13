# Mis finanzas

App web para llevar el **préstamo familiar**, compras a meses, gastos por quincena, saldos (vales, efectivo, débito), estados de cuenta y ahorro.

- **La página** se publica gratis con **GitHub Pages**. No necesitas servidor.
- **Los datos** se guardan en **Supabase** (base de datos gratis en la nube). Cada persona tiene usuario y contraseña, y sus datos se ven igual en el celular y en la computadora.

```
mis-finanzas/
├── index.html            la página (estructura y estilos)
├── app.js                la lógica de la app
├── config.js             ← aquí pegas los datos de tu proyecto Supabase
├── supabase.sql          ← crea las tablas y las reglas de seguridad
├── manifest.webmanifest  para "instalarla" en el celular
├── icon.svg
└── README.md
```

La configuración se hace **una sola vez** y toma unos 15 minutos.

---

## Paso 1. Crear la base de datos en Supabase (gratis)

1. Entra a https://supabase.com y pulsa **Start your project**. Regístrate (puedes usar tu cuenta de GitHub).
2. Pulsa **New project**:
   - **Name:** `mis-finanzas`
   - **Database Password:** inventa una y guárdala (casi no la vas a usar).
   - **Region:** la más cercana (por ejemplo *East US* o *West US*).
   - Pulsa **Create new project** y espera 1 o 2 minutos.
3. **Crea las tablas:** en el menú izquierdo abre **SQL Editor** y pulsa **New query**. Abre el archivo `supabase.sql` con el Bloc de notas, copia **todo**, pégalo y pulsa **Run**. Debe decir *Success. No rows returned*.
4. **Desactiva la confirmación por correo** (la app usa nombres de usuario, no correos reales):
   - Ve a **Authentication → Sign In / Providers** (en algunas versiones: *Authentication → Providers → Email*).
   - Apaga **Confirm email** y pulsa **Save**.
   - ⚠️ Hazlo **antes** de crear cualquier cuenta.
5. **Copia tus dos claves:**
   - Ve a **Project Settings** (engrane) **→ API** (o pulsa el botón **Connect** arriba).
   - Copia el **Project URL** (algo como `https://abcdefghijk.supabase.co`).
   - Copia la clave **anon public** (o **publishable**, empieza con `eyJ...` o `sb_publishable_...`).
   - ❌ **Nunca** uses la clave `service_role` ni la `secret`.
6. Abre `config.js` con el Bloc de notas y reemplaza los dos textos `PEGA_AQUI_...` por tus valores. Debe quedar así (con tus datos):

   ```js
   window.FINANZAS_CONFIG = {
     supabaseUrl: "https://abcdefghijk.supabase.co",
     supabaseKey: "eyJhbGciOi...."
   };
   ```

   Guarda el archivo.

> **¿Es seguro que la clave quede visible en GitHub?** Sí. La clave *anon/publishable* está hecha para ir en páginas públicas. Lo que protege tus datos son las reglas de seguridad (RLS) de `supabase.sql`: cada cuenta solo puede leer y modificar lo suyo.

---

## Paso 2. Subir la app a GitHub

> GitHub Pages es gratis solo con repositorios **públicos**. Lo que captures en la app vive en Supabase, protegido con tu contraseña. Pero los valores iniciales escritos en `index.html` (monto del préstamo, depósitos, ahorro) sí se ven en el código público.

### Opción A: desde la página de GitHub (sin instalar nada)

1. Entra a https://github.com/new.
2. **Repository name:** `mis-finanzas`. Elige **Public**. No marques "Add a README".
3. Pulsa **Create repository**.
4. Haz clic en **uploading an existing file**.
5. Abre la carpeta `mis-finanzas` en el Explorador de Windows, selecciona **todos** los archivos (`index.html`, `app.js`, `config.js`, `supabase.sql`, `manifest.webmanifest`, `icon.svg`, `README.md`, `.gitignore`) y arrástralos a la página.
   - Si no ves `.gitignore`, actívalo en *Vista → Mostrar → Elementos ocultos* (no es indispensable).
6. Pulsa **Commit changes**.

### Opción B: con Git (más cómodo para actualizar)

```bash
winget install --id Git.Git -e
```

Cierra y abre la terminal. Luego:

```bash
cd C:\Users\RAFA\Documents\APPS\Finanzas\mis-finanzas
```

```bash
git init -b main
```

```bash
git add .
```

```bash
git commit -m "Primera versión de Mis finanzas"
```

```bash
git remote add origin https://github.com/TU_USUARIO/mis-finanzas.git
```

```bash
git push -u origin main
```

Para subir cambios después: `git add .`, `git commit -m "lo que cambiaste"` y `git push`.

---

## Paso 3. Publicar con GitHub Pages

1. En tu repositorio entra a **Settings → Pages**.
2. En **Build and deployment → Source** elige **Deploy from a branch**.
3. En **Branch** elige `main` y la carpeta `/ (root)`. Pulsa **Save**.
4. Espera 1 o 2 minutos y recarga la página. Arriba aparecerá tu enlace:

   **`https://TU_USUARIO.github.io/mis-finanzas/`**

5. Ábrelo, pulsa **Crear cuenta** y empieza a usarla.
6. **En el celular:** abre el enlace y elige *Agregar a la pantalla de inicio* (en iPhone, desde Compartir; en Android, desde el menú ⋮).

Cada vez que subas cambios a GitHub, la página se actualiza sola en 1 o 2 minutos.

---

## Paso 4 (opcional). Cerrar el registro

Cuando tu familia ya tenga sus cuentas, evita que extraños se registren: en Supabase ve a **Authentication → Sign In / Providers**, apaga **Allow new users to sign up** y guarda. La app ocultará el botón "Crear cuenta".

---

## Coach financiero

La pestaña **Coach** revisa tus datos y te dice qué atender, sin inteligencia artificial y sin enviar tus datos a ningún lado:

- **Salud financiera (0 a 100):** combina pagos al día, gasto de la quincena, peso de tus deudas frente a tu ingreso y ahorro.
- **Alertas:** pagos atrasados del préstamo o de compras a meses, estados de cuenta por vencer o vencidos, saldos en negativo, plan del mes que no cuadra.
- **Avisos:** si a tu ritmo actual te vas a pasar de la quincena (y cuánto puedes gastar al día), si una categoría subió frente al mes pasado, si tu ahorro del mes va atrasado.
- **Ideas:** cuánto te falta para tu meta de ahorro y en cuántos meses llegas, tu colchón para emergencias (meta: 3 meses de gastos).

## Apariencia

En **Cuenta → Apariencia** puedes elegir modo **automático, claro u oscuro**, una de 6 paletas (Café y olivo, Vino tinto, Bosque, Mar de Cortés, Lavanda, Grafito) o tus **propios colores**. Se guarda en tu cuenta y se aplica en todos tus dispositivos.

## Compartir en vivo

Puedes mandar a otra persona un enlace para que vea, desde su celular y **sin crear cuenta**, el estado de:

- el **préstamo familiar**,
- cualquier **deuda** (compras a meses),
- las cuentas de **vales, efectivo o débito** (saldo y movimientos).

Cómo se usa:

1. Toca **Compartir en vivo** (debajo de la tarjeta de pagos, en cada deuda o en cada cuenta).
2. Toca **Crear enlace** y luego **Copiar** o **Enviar por WhatsApp**.
3. Quien lo abra verá la tarjeta de pagos o el saldo, y los cambios **en el momento** en que los hagas (marca "En vivo").
4. Para cortar el acceso: **Compartir en vivo → Dejar de compartir**. El enlace deja de funcionar para todos.

Lo que debes saber:

- Es **solo lectura**: no pueden modificar nada. Las notas de los pagos nunca se comparten.
- Cualquiera que tenga el enlace puede verlo; compártelo solo con quien quieras.
- Para que funcione, **ejecuta de nuevo `supabase.sql`** (agrega la tabla de enlaces).
- El tiempo real usa *Supabase Realtime* (incluido en el plan gratis). Si no está disponible, la página revisa cambios cada 5 segundos por su cuenta. Si ves "Actualización automática" en lugar de "En vivo", revisa en Supabase **Project Settings → Realtime** que esté permitido el acceso público a canales (*Allow public access*).
## Administración (desde Supabase → SQL Editor)

| Acción | Escribe y pulsa Run |
|---|---|
| Ver las cuentas | `select * from private.usuarios();` |
| Que `mama` vea y edite el préstamo de `rafa` | `select private.hacer_invitado('mama', 'rafa');` |
| Quitarle ese permiso | `select private.quitar_invitado('mama');` |
| Restablecer una contraseña olvidada | `select private.restablecer_password('rafa', 'NuevaClave123');` |

Para el invitado: primero crea su cuenta desde la app y después ejecuta `hacer_invitado`. Cuando vuelva a entrar verá solo el préstamo y la pestaña Cuenta.

## Respaldos

- **Desde la app:** pestaña **Cuenta → Descargar respaldo** baja un archivo `.json` con todos tus datos. **Restaurar desde archivo** lo vuelve a cargar. Hazlo una vez al mes y guárdalo en tu Drive. **No subas esos archivos a GitHub.**
- Supabase guarda tus datos en una base de datos Postgres. En el plan gratis **no hay respaldos automáticos descargables**; por eso conviene el respaldo mensual desde la app.

## Cosas que debes saber del plan gratis de Supabase

- Es gratis para siempre con 500 MB de base de datos (esta app usa unos pocos KB por persona).
- Si **nadie usa la app en 7 días**, Supabase "pausa" el proyecto. Tus datos **no se pierden**: entra a supabase.com, abre el proyecto y pulsa **Restore**. Si la usas seguido, no pasa.

## Probarla en tu computadora

La app necesita abrirse desde una dirección web, no con doble clic en el archivo. En la carpeta del proyecto:

```bash
python -m http.server 8000
```

Abre http://localhost:8000. Usa la misma base de datos de Supabase que la versión publicada.

## Problemas comunes

| Mensaje | Solución |
|---|---|
| "Falta configurar la base de datos" | Revisa que `config.js` tenga tu URL y tu clave, y que ya lo hayas subido a GitHub. |
| "Supabase pide confirmar el correo" | Apaga **Confirm email** (paso 1.4). Si una cuenta quedó a medias, bórrala en **Authentication → Users** y créala de nuevo. |
| "Sin conexión con la nube" | Revisa tu internet o si el proyecto está pausado (ver arriba). Tus cambios se guardan en el dispositivo y se suben solos al reconectar. |
| La página de GitHub muestra 404 | Espera 2 minutos después de activar Pages y revisa que la rama sea `main` y la carpeta `/ (root)`. |

---

## Novedades (versión 45)

- Las cuentas nuevas empiezan vacías (sin préstamo y con montos en $0). La cuenta *rafa* conserva sus valores iniciales.

## Versión 44

- Los temas también cambian el fondo de la app.
- Se quitó la sección Débito: en **Gastos de la quincena** eliges si la compra fue con crédito o débito (los dos cuentan para el límite).
- Las cuentas nuevas eligen sus métodos de pago (vales, efectivo, crédito, débito; al menos uno) y la app muestra solo esas secciones. Se puede cambiar en **Cuenta → Métodos de pago**. La cuenta *rafa* y las que ya existían conservan los cuatro.

## Versión 43

- **Coach financiero** con puntaje de salud y consejos con tus datos.
- **Apariencia:** modo claro/oscuro, 6 paletas y colores propios.
- Préstamo mejor adaptado a celular (incluye arreglo para iPhone).

## Versión 39

- **Compartir en vivo:** enlaces de solo lectura para el préstamo, las deudas y las cuentas, con actualización en tiempo real.

## Versión 38 — pasada de diseño

Hecha con las skills *frontend-design* (Anthropic), *review-animations* (Emil Kowalski) y *web-design-guidelines* (Vercel).

- **Tarjeta de pagos:** el préstamo ahora se ve como una tarjeta de abonos con un círculo por pago (olivo con ✓ si está pagado, vino si está atrasado, medio lleno si es parcial). Arriba, en grande, lo que te falta pagar.
- Los resúmenes ya no son tarjetas sueltas: van en una sola franja.
- Animaciones más cortas y con propósito: los círculos aparecen al entrar y el que acabas de pagar se marca como un sello; cambiar de pestaña es un fundido rápido. Se quitaron las animaciones repetitivas (entradas escalonadas, logo flotante, tarjetas que se levantan).
- Detalles: encabezados de tabla sin mayúsculas, textos sin separadores con punto medio, enlace para saltar al contenido, mejor respuesta al toque en el celular.

## Versión 37 — segunda revisión

Revisión hecha con las guías de *security-review* (Sentry), *supabase-postgres-best-practices* (Supabase) y *accessibility* (WCAG 2.2), encontradas con la skill *find-skills*.

- Seguridad: los datos de la nube y de los archivos de respaldo se limpian antes de mostrarse; el código pasó a `app.js` y la página ya no permite scripts incrustados (CSP más estricta).
- Base de datos: funciones auxiliares y de administración movidas a un esquema privado que la API no expone; índice en `shares.owner_id`; los datos guardados deben ser un objeto válido. **Si ya ejecutaste supabase.sql antes, vuelve a ejecutarlo.**
- Accesibilidad: mejor contraste en textos tenues; todos los campos tienen nombre para lectores de pantalla; las secciones se abren y cierran con teclado; los mensajes de error se anuncian; en el celular la barra inferior ya no tapa el campo donde escribes.

## Versión 36

- Préstamo: 10 pagos de $5,000 (total $50,000).
- Sombras cálidas en tarjetas y botones, que se elevan al pasar el mouse.
- Animaciones suaves: las secciones aparecen escalonadas al cambiar de pestaña, los montos cuentan hacia arriba, las barras de avance se llenan y las gráficas giran al aparecer. Se desactivan solas si tu celular tiene activado *reducir movimiento*.

### Versión 35

- Diseño nuevo tipo libreta: tonos crema, café, verde olivo y vino; saludo con tu nombre y la fecha; menú inferior con íconos en el celular; modo oscuro en tonos café.
- Ícono nuevo para la pantalla de inicio.

- Funciona **sin servidor**: GitHub Pages + Supabase.
- Pestaña **Cuenta**: cambiar contraseña (cierra las sesiones de otros dispositivos), descargar o restaurar un respaldo, y eliminar la cuenta.
- Invitados: ven el préstamo del dueño y saben de quién es.
- El préstamo calcula el número de pagos según el monto y la mensualidad (ya no está fijo en 9).
- Corregido: las notas con `&`, `<` o comillas se dañaban al guardar.
- Confirmación antes de quitar gastos, ingresos, ahorros o estados de cuenta.
- Indicador de "Guardado en la nube" con la hora, y reintento automático al recuperar internet.
- Se puede instalar en la pantalla de inicio del celular.
- Los valores iniciales son los de tu préstamo y tus depósitos (app personal).
