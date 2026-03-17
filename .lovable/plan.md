

## Plan: Resetear contraseña de super admin a "1234"

Mismo procedimiento que la vez anterior:

1. **Crear Edge Function temporal** `supabase/functions/password-reset-temp/index.ts` con `verify_jwt = false`, protegida por clave secreta
2. **Actualizar `supabase/config.toml`** para registrar la función
3. **Desplegar y ejecutar** el reseteo para el usuario `bc7f6941-a3f6-48c3-b5cd-b5734806231d` con contraseña `1234`
4. **Eliminar la función temporal** por seguridad

### Resultado

Podrás iniciar sesión con:
- **DNI:** 21325214
- **Contraseña:** 1234

Se te pedirá cambiar la contraseña al iniciar sesión.

