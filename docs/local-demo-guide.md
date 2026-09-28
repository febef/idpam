# Recorrer IdPAM en local

Esta guía acompaña la demo de laboratorio descrita en el [README](../README.md)
y el [contrato](demo-contract.md). Usa exclusivamente datos ficticios. La UI
conserva las tarjetas flotantes y las plantillas Jade históricas; los pasos de
aprendizaje viven aquí, fuera de la aplicación.

## Antes de empezar

Ejecutá el build y el Compose indicados en el README. Abrí
`http://127.0.0.1:3000/login` y entrá con el usuario sintético `demo` y la clave
de laboratorio documentada allí. No reutilices estas credenciales en otro
entorno. Si el reset periódico ocurre durante el recorrido, volvé a entrar:
los cambios y las sesiones se descartan intencionalmente.

## Un recorrido corto

1. **Inicio.** Revisá la tarjeta `metadata` y las credenciales del usuario de
   prueba. Tocá un valor editable, cambiá el texto y presioná **Enter** para
   guardar o **Escape** para cancelar. El botón `(+)` abre un cuadro compacto
   sobre la misma página; no debería enviarte a `Identities`.
2. **Identities.** Abrí el perfil ficticio Ada, Grace o Lin y editá un dato
   simple directamente sobre el texto. Creá otra identidad con `(+)`; luego
   agregale una credencial de prueba desde su tarjeta. La cuenta inicial
   permanece protegida contra cambios de su credencial de acceso.
3. **Roles.** Creá un rol de prueba, añadí un permiso con destino y verbo
   explícitos y usá `check access` para comparar una operación permitida con
   otra denegada. Un rol asignado a una credencial no se puede borrar hasta
   retirar esa referencia.
4. **Métodos de acceso.** En `Login`, `Other methods` ofrece token temporal,
   prueba de posesión SSH Ed25519 y el flujo Dex/OIDC sobre LDAP ficticio.
   El token se muestra una sola vez al crearlo; no lo guardes como secreto
   real. La prueba SSH usa el helper del README, que mantiene la clave privada
   fuera del servidor. Dex sólo autentica contra el directorio descartable
   incluido en este Compose.

## Qué demuestra y qué no

Esta demo permite observar el modelo identidad → credencial → rol → permiso y
ejercitar los controles principales del prototipo recuperado. Sus rutas de
gestión actuales son explícitas y requieren sesión y CSRF; la API genérica
histórica `/lapi` responde 410. Eso no certifica una auditoría integral.

La base de prueba se comparte entre quienes usan esta instancia local y se
restaura periódicamente. No publiques el Compose tal cual ni introduzcas datos
personales o claves reales. Las condiciones pendientes para código y demo
públicos están en el [inventario funcional](functionality-audit.md).
