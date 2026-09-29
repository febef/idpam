# IdPAM: contrato de la demo recuperada

Esta rama rescata IdPAM como laboratorio personal. `legacy` conserva el último
commit anterior a la evolución. El código histórico no acredita seguridad ni
funcionamiento actuales. La primera meta es una demo **local**, con datos
ficticios y sin servicios, credenciales o redes de otras organizaciones.

## Resultado observable

1. Un operador puede iniciar una instancia aislada y reproducible, sin editar
   código para configurar host, puerto o credenciales.
2. El sembrado crea una cuenta ficticia de acceso, un rol de demo y tres
   perfiles sintéticos editables. Repetirlo restablece el mismo conjunto y no
   amplía permisos.
3. El usuario puede iniciar sesión, acceder a un recurso autorizado y recibir
   rechazo para otro recurso o verbo. La comprobación del destino es obligatoria
   incluso para el verbo `execute` y funciones `#...`. La API genérica heredada
   ya no se expone por HTTP; rutas explícitas permiten administrar identidades,
   roles, permisos, credenciales simples, tokens y claves SSH ficticias.
   Requieren sesión administrativa y token CSRF; el login SSH usa un desafío
   de un solo uso. El login federado usa Dex, que valida contra OpenLDAP
   ficticio por LDAPS; IdPAM verifica el retorno OIDC y lo vincula a una
   identidad local sin recibir la contraseña del directorio.
4. El restablecimiento configurable borra **sólo** la base de demo, vuelve a
   sembrarla y deja inválidas las sesiones anteriores. Nunca acepta un URI de
   una base externa o de producción.
5. El almacenamiento es descartable. En MongoDB Community, un volumen tmpfs
   mantiene los archivos de WiredTiger en RAM; no usa el motor `inMemory` de
   Enterprise. El límite de memoria y el intervalo de reset son explícitos.
6. La interfaz histórica mantiene la creación en cuadros flotantes. Los
   campos escalares de perfiles, roles y permisos se editan sobre el texto:
   clic o Enter para comenzar, Enter para guardar, Escape o pérdida de foco
   para cancelar. El guardado usa las rutas explícitas con CSRF y validación,
   nunca la API genérica `/lapi`. Los formularios completos siguen disponibles
   para cambios compuestos, como la contraseña y los roles de una credencial.
   El atajo de edición del panel de Inicio activa el campo inline en la misma
   página, sin navegar a Identidades. Las altas de credenciales desde Inicio
   abren el panel flotante ahí mismo; al cerrar, cancelar o guardar se permanece
   en Inicio. La emisión de token muestra su valor una sola vez en un segundo
   panel de la misma página. Las operaciones siguen pasando por las mismas
   rutas protegidas.
   Ningún botón adicional de perfil debe imponer un formulario grande. Los
   formularios necesarios conservan el panel translúcido compacto y el cierre
   «x» de la interfaz `legacy`, sin alterar las rutas seguras.
   En las listas `names` y `lastNames` de Inicio, `(+)` agrega un valor y la
   `x` de un elemento elimina sólo ese elemento. Ninguna de esas acciones
   reemplaza accidentalmente el primer valor ni cambia la otra lista. Un
   valor vacío o demasiado largo se rechaza al agregarlo; cancelar deja los
   datos intactos. Tocar un valor edita ese elemento, sin alterar sus vecinos.
   La edición desde el formulario escalar también conserva los siguientes
   elementos de la lista.
   `nickName` sigue siendo obligatorio.

## Límites de la exposición pública

- No se reutilizan contraseñas ni identidades reales, ni se versionan secretos.
- La ruta pública sólo usa imágenes que pasaron pruebas, SBOM y análisis de
  vulnerabilidades y secretos. Autorización, sesiones, CSRF, dependencias,
  historial, licencia, aislamiento por visitante y aislamiento de red forman
  parte del gate verificable; cualquier fallo debe cerrar el acceso.
- El `docker-compose.yml` y `Dockerfile` heredados no son la receta de demo:
  contienen privilegios, rutas y configuración antigua ajena a este contrato.
- Cada sesión recibe un tenant sintético propio. Las consultas y escrituras
  quedan acotadas por ese tenant y las pruebas HTTP verifican que dos visitantes
  no comparten cambios. El reset y la expiración eliminan únicamente estado de
  demo; no sustituyen esa separación.

## Diseño de implementación

- La política de autorización es una función pura; HTTP y MongoDB sólo le
  entregan el sujeto, el verbo, el destino y los permisos.
- El reset/seed es un caso de uso idempotente con un adaptador de persistencia
  restringido a la base de demo. Un temporizador del mismo proceso ejecuta el
  reset cada `RESET_INTERVAL_SECONDS` (3600 por defecto, mínimo 60, máximo
  86400). Las sesiones usan MongoDB y expiran junto con su tenant. El overlay
  público declara una réplica y estrategia `Recreate`; escalarlo exigiría
  separar el lifecycle en un job coordinado.
- La fase inicial verifica política y arranque local; la integración con Mongo,
  UI y reset se prueba por separado. No se declara la demo lista por pasar una
  prueba unitaria.
- En Compose, `openid-client` permite HTTP sólo para el issuer de loopback de
  Dex. El overlay Kubernetes fija el issuer y callback HTTPS exactos, usa
  loopback únicamente entre contenedores del mismo Pod y sirve un OpenLDAP
  estable y mínimo construido desde una base fijada por digest.

Referencias: [MongoDB Community vs. `inMemory`](https://www.mongodb.com/docs/v8.0/core/inmemory/),
[volúmenes temporales de Kubernetes](https://kubernetes.io/docs/concepts/storage/volumes/),
[sesiones Express](https://expressjs.com/en/resources/middleware/session/),
[compatibilidad Mongoose/MongoDB](https://mongoosejs.com/docs/8.x/docs/compatibility.html),
[compatibilidad de bcrypt con Node](https://github.com/kelektiv/node.bcrypt.js/#version-compatibility).

La edición acotada sigue las recomendaciones de [OWASP para tokens CSRF en
sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
y usa `save()` para validar documentos completos según la
[guía de Mongoose 8](https://mongoosejs.com/docs/8.x/docs/documents.html).
