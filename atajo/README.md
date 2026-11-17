# Atajo de iPhone "Gasto"

- `Gasto.shortcut`: atajo firmado (formato AEA1, modo "anyone") listo para importar en iPhone. La app lo abre desde **Más → Cuenta → Atajo de iPhone → Activar atajo en este iPhone**.
- `Gasto.xml`: el mismo atajo sin firmar (plist XML), validado con el validador de [Shortcuts Playground](https://github.com/viticci/shortcuts-playground-plugin).
- `generar_atajo.py`: genera `Gasto.xml` (`python3 generar_atajo.py Gasto.xml`).

No contiene ninguna llave: al importarlo, el iPhone pregunta "Pega tu llave". Solo incluye la dirección del proyecto de Supabase y la clave pública (`sb_publishable_…`), que ya son públicas en `config.js`.

## Volver a firmarlo (sin Mac)

```bash
curl --fail --form 'file=@Gasto.xml;filename=Gasto.shortcut' --output Gasto.shortcut https://sign.shortcuty.app/api/v1/sign
```

Shortcuty es un servicio de terceros: recibe el archivo completo. No firmes por ahí atajos con llaves o datos personales.
