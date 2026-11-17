# Atajo de iPhone "Gasto"

- **Enlace de iCloud** (el que usa la app en `config.js` → `atajoUrl`): https://www.icloud.com/shortcuts/0a4a7fa84c254325a6791847e1f294b6. El iPhone no instala un `.shortcut` abierto desde una página web (se queda en blanco), por eso la app usa este enlace.
- `Gasto.shortcut`: atajo firmado (formato AEA1, modo "anyone"). Sirve para instalarlo a mano (Safari → Descargar → abrir) y para generar un enlace de iCloud nuevo si cambia el atajo.
- `Gasto.xml`: el mismo atajo sin firmar (plist XML), validado con el validador de [Shortcuts Playground](https://github.com/viticci/shortcuts-playground-plugin).
- `generar_atajo.py`: genera `Gasto.xml` (`python3 generar_atajo.py Gasto.xml`).

No contiene ninguna llave: al importarlo, el iPhone pregunta "Pega tu llave". Solo incluye la dirección del proyecto de Supabase y la clave pública (`sb_publishable_…`), que ya son públicas en `config.js`.

## Volver a firmarlo (sin Mac)

```bash
curl --fail --form 'file=@Gasto.xml;filename=Gasto.shortcut' --output Gasto.shortcut https://sign.shortcuty.app/api/v1/sign
```

Shortcuty es un servicio de terceros: recibe el archivo completo. No firmes por ahí atajos con llaves o datos personales.
