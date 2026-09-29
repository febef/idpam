# IdPAM: inventario funcional para la demo

Alcance observado: rama de preparación pública, contenedor local en
`127.0.0.1:3000`, 2026-09-29. Esto distingue un flujo comprobado de código
heredado presente en el repositorio. No acredita aptitud como IAM productivo.

| Flujo | Estado de la demo | Evidencia y límite |
| --- | --- | --- |
| Login con credencial simple | Verificado | Cuenta sintética `demo`; inicio de sesión y contraseña inválida comprobados. Rotación de sesión, store Mongo y rate limit activos. El overlay público conserva una réplica. |
| Inicio | Disponible | Los metadatos se editan inline y las altas de credenciales abren paneles flotantes sin cambiar de página. Las operaciones usan rutas explícitas, no el editor genérico antiguo. |
| Lista de identidades | Disponible | Carga cuatro identidades con sus metadatos; CSS y JS inexistentes retirados de la ruta. |
| Edición de perfiles | Verificada | Alias y email se editan sobre el texto; en las listas de nombres y apellidos se puede agregar, editar o borrar un elemento sin afectar a los demás. Enter guarda y Escape cancela, también desde Inicio. La credencial de acceso inicial no se edita, pero sus metadatos sí. Sesión, token CSRF, tenant por visitante y validación estricta. |
| Roles y permisos | Funciona localmente | Crear, renombrar y borrar roles; crear, editar y quitar permisos; comprobar decisiones de acceso. El borrado de un rol asignado se rechaza. |
| Guía en la app | Retirada | El tutorial experimental se quitó para preservar la interfaz original. Las instrucciones viven en README y documentos del repositorio. |
| API genérica `/lapi` | Retirada del transporte HTTP | GET y POST responden 410. El motor heredado no está auditado; se reemplaza por casos de uso explícitos. |
| Credenciales simples | Funciona localmente | Crear, editar, deshabilitar y borrar; contraseña bcrypt; la cuenta de acceso no se modifica desde el formulario. |
| Tokens temporales | Funciona localmente | Emisión de valor aleatorio mostrado una vez en un panel de Inicio, hash SHA-256 persistido, expiración, login y revocación que invalida la sesión. Al cerrar el panel se borra el valor del DOM. |
| Claves SSH Ed25519 | Funciona localmente | Registro de clave pública, desafío aleatorio, firma verificada y rechazo del replay; helper local para generar y firmar sin enviar la clave privada. Es prueba de posesión en HTTP, no un servidor SSH. |
| LDAP y OAuth/OIDC | Verificado localmente | OpenLDAP 2.6 estable por LDAPS, cuenta bind de sólo lectura, Dex OIDC y cliente IdPAM con código de autorización, PKCE, state y nonce. Login de Ada verificado en navegador. No conecta servicios reales. El release público fija issuer y callback HTTPS exactos. |
| Creación/borrado de identidades | Verificada | Formularios y rutas explícitas; rechazo al borrar identidades con credenciales. Dos sesiones HTTP independientes recibieron tenants separados y no compartieron cambios. |
| Reset | Verificado | Base `idpam_demo` y sesiones en almacenamiento temporal, intervalo configurable y tenants vencidos eliminados. El despliegue declara una réplica y `Recreate`. |
| Accesibilidad y movimiento | Verificada para la demo | Home, Identities, Roles y el formulario pasan axe-core sin infracciones WCAG A/AA detectadas; teclado, foco/Escape, controles de 24 px, 320/1280 px y pausa de movimiento comprobados. No equivale a una certificación externa. |
| Temas claro/oscuro | Fuera de alcance | Se preserva deliberadamente la interfaz histórica y su tema original. La demo incorpora pausa persistente de movimiento y respeta `prefers-reduced-motion`; no presenta un rediseño ni selector de tema. |

## Puerta de publicación

1. Mantener la historia pública saneada y sus espejos GitHub/GitLab sobre el
   mismo commit verificado. Auditar cada cambio nuevo por secretos, licencias y
   datos ajenos; el tag y el repositorio históricos permanecen privados.
2. Confirmar que el release conserva la separación por tenant, store Mongo,
   fijación/expiración de sesiones, CSRF, cabeceras, login y rate limiting.
3. Verificar recursos, límites y rollout Kubernetes; DNS/TLS, probes, reset y
   rollback. Publicar sólo desde CI con imagen auditada e inmutable.
4. Verificar teclado, contraste, móvil, errores y recuperación del flujo
   completo. El artículo puede enlazar el código fuente público, pero debe
   presentar la demo como no disponible hasta que su despliegue represente el
   estado realmente verificado.
5. Confirmar las imágenes fijadas, OIDC HTTPS con hostname/callback exactos y
   certificados gestionados. Agregar una prueba externa del regreso OIDC y de
   fallos cerrados de LDAP antes de declarar la URL lista.
