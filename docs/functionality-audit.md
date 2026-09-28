# IdPAM: inventario funcional para la demo

Alcance observado: rama `evolucion/demo-preparation`, contenedor local en
`127.0.0.1:3000`, 2026-09-24. Esto distingue un flujo comprobado de código
heredado presente en el repositorio. No acredita aptitud para Internet.

| Flujo | Estado de la demo | Evidencia y límite |
| --- | --- | --- |
| Login con credencial simple | Funciona localmente | Cuenta sintética `demo`; inicio de sesión y contraseña inválida comprobados. Falta rate limiting y sesión apta para múltiples réplicas. |
| Inicio | Disponible | Los metadatos se editan inline y las altas de credenciales abren paneles flotantes sin cambiar de página. Las operaciones usan rutas explícitas, no el editor genérico antiguo. |
| Lista de identidades | Disponible | Carga cuatro identidades con sus metadatos; CSS y JS inexistentes retirados de la ruta. |
| Edición de perfiles | Funciona localmente | Alias y email se editan sobre el texto; en las listas de nombres y apellidos se puede agregar, editar o borrar un elemento sin afectar a los demás. Enter guarda y Escape cancela, también desde Inicio. La credencial de acceso inicial no se edita, pero sus metadatos sí. Sesión, token CSRF y validación estricta; base compartida local y reset periódico. |
| Roles y permisos | Funciona localmente | Crear, renombrar y borrar roles; crear, editar y quitar permisos; comprobar decisiones de acceso. El borrado de un rol asignado se rechaza. |
| Guía en la app | Retirada | El tutorial experimental se quitó para preservar la interfaz original. Las instrucciones viven en README y documentos del repositorio. |
| API genérica `/lapi` | Retirada del transporte HTTP | GET y POST responden 410. El motor heredado no está auditado; se reemplaza por casos de uso explícitos. |
| Credenciales simples | Funciona localmente | Crear, editar, deshabilitar y borrar; contraseña bcrypt; la cuenta de acceso no se modifica desde el formulario. |
| Tokens temporales | Funciona localmente | Emisión de valor aleatorio mostrado una vez en un panel de Inicio, hash SHA-256 persistido, expiración, login y revocación que invalida la sesión. Al cerrar el panel se borra el valor del DOM. |
| Claves SSH Ed25519 | Funciona localmente | Registro de clave pública, desafío aleatorio, firma verificada y rechazo del replay; helper local para generar y firmar sin enviar la clave privada. Es prueba de posesión en HTTP, no un servidor SSH. |
| LDAP y OAuth/OIDC | Funciona localmente | OpenLDAP ficticio por LDAPS, cuenta bind de sólo lectura, Dex OIDC y cliente IdPAM con código de autorización, PKCE, state y nonce. Login de Ada verificado en navegador. No conecta servicios reales. La imagen LDAP es alpha y el issuer usa HTTP de loopback: no apto para Internet. |
| Creación/borrado de identidades | Funciona localmente | Formularios y rutas explícitas; rechazo al borrar identidades con credenciales. Falta aislamiento por visitante y auditoría de concurrencia. |
| Reset | Funciona localmente | Base `idpam_demo` en volumen temporal, intervalo configurable y sesiones invalidadas. Falta estrategia multi-réplica. |
| Temas claro/oscuro | Pendiente | Esta interfaz histórica usa el tema oscuro original; no hay selector visible ni persistencia de tema en la demo actual. |

## Puerta de publicación

1. Aislar las modificaciones de cada visitante; el almacenamiento compartido
   de perfiles de esta demo local no es un contrato público aceptable.
2. Auditar historia Git y archivos heredados por secretos, licencias y datos
   ajenos. Confirmar visibilidad/propiedad del remoto GitHub antes de publicar
   `legacy` o configurar espejo hacia GitLab personal.
3. Reemplazar `MemoryStore`, revisar fijación/expiración de sesiones, CSRF de
   todas las operaciones, cabeceras, login y rate limiting. Hacer pruebas
   negativas de rutas y cambios de roles/credenciales.
4. Definir recurso, límites y rollout Kubernetes; DNS/TLS, probes, reset y
   rollback. Publicar sólo desde CI con imagen auditada e inmutable.
5. Verificar teclado, contraste, móvil, errores y recuperación del flujo
   completo. El post editorial queda borrador hasta que los enlaces y la
   demo representen el estado publicado.
6. Sustituir la imagen OpenLDAP alpha; fijar imágenes por digest y llevar OIDC
   a HTTPS con hostname público, cliente/redirect exactos y certificados
   gestionados. Agregar pruebas automáticas del regreso OIDC y fallos de LDAP.
