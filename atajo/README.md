# Atajo de iPhone "Gasto"

- **Enlace de iCloud** (el que usa la app en `config.js` → `atajoUrl`): https://www.icloud.com/shortcuts/0a4a7fa84c254325a6791847e1f294b6. El iPhone no instala un `.shortcut` abierto desde una página web (se queda en blanco), por eso la app usa este enlace.
- `Gasto.shortcut`: atajo firmado (formato AEA1, modo "anyone"). Sirve para instalarlo a mano (Safari → Descargar → abrir) y para generar un enlace de iCloud nuevo si cambia el atajo.
- `Gasto.xml`: el mismo atajo sin firmar (plist XML), validado con el validador de [Shortcuts Playground](https://github.com/viticci/shortcuts-playground-plugin).
- `generar_atajo.py`: genera `Gasto.xml` (`python3 generar_atajo.py Gasto.xml`).

No contiene ninguna llave ni preguntas de importación (en iOS 27 el botón "Agregar atajo" se atoraba con ellas). La primera vez que se corre pide la llave, propone el portapapeles y la guarda en iCloud Drive/Atajos/mis-finanzas-llave.txt; las siguientes veces la lee de ahí. Si el servidor responde que la llave no sirve, el atajo borra ese archivo solo y la próxima vez la vuelve a pedir. También puedes borrarlo a mano para cambiarla. Solo incluye la dirección del proyecto de Supabase y la clave pública (`sb_publishable_…`), que ya son públicas en `config.js`.

## Volver a firmarlo (sin Mac)

```bash
curl --fail --form 'file=@Gasto.xml;filename=Gasto.shortcut' --output Gasto.shortcut https://sign.shortcuty.app/api/v1/sign
```

Shortcuty es un servicio de terceros: recibe el archivo completo. No firmes por ahí atajos con llaves o datos personales.
