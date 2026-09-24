# IdPAM: contrato de la demo local

Esta rama rescata IdPAM como laboratorio personal. `legacy` conserva el último
commit anterior a la evolución. El código histórico no acredita seguridad ni
funcionamiento actuales. La primera meta es una demo **local**, con datos
ficticios y sin servicios, credenciales o redes de otras organizaciones.

## Resultado observable

1. Un operador puede iniciar una instancia aislada y reproducible, sin editar
   código para configurar host, puerto o credenciales.
2. El sembrado crea exactamente un usuario ficticio, un rol de demo y permisos
   limitados. Repetirlo no duplica identidades ni amplía permisos.
3. El usuario puede iniciar sesión, acceder a un recurso autorizado y recibir
   rechazo para otro recurso o verbo. La comprobación del destino es obligatoria
   incluso para el verbo `execute` y funciones `#...`. La interfaz indica que
   la cuenta de demo es de sólo lectura y no muestra controles de edición.
4. El restablecimiento configurable borra **sólo** la base de demo, vuelve a
   sembrarla y deja inválidas las sesiones anteriores. Nunca acepta un URI de
   una base externa o de producción.
5. El almacenamiento es descartable. En MongoDB Community, un volumen tmpfs
   mantiene los archivos de WiredTiger en RAM; no usa el motor `inMemory` de
   Enterprise. El límite de memoria y el intervalo de reset son explícitos.

## Límites antes de exponerla

- No se reutilizan contraseñas ni identidades reales, ni se versionan secretos.
- No se publica la imagen, el tag, la rama ni una ruta HTTP hasta revisar
  autorización, sesiones, CSRF, dependencias, historial, licencia y
  aislamiento de red. Una demostración pública de identidad requiere pruebas
  negativas de acceso y un mecanismo que falle cerrado.
- El `docker-compose.yml` y `Dockerfile` heredados no son la receta de demo:
  contienen privilegios, rutas y configuración antigua ajena a este contrato.

## Diseño de implementación

- La política de autorización es una función pura; HTTP y MongoDB sólo le
  entregan el sujeto, el verbo, el destino y los permisos.
- El reset/seed es un caso de uso idempotente con un adaptador de persistencia
  restringido a la base de demo. En esta fase local, un temporizador del mismo
  proceso ejecuta el reset cada `RESET_INTERVAL_SECONDS` (3600 por defecto,
  mínimo 60, máximo 86400) e invalida sus sesiones. Para un despliegue
  multi-réplica se sustituirá por un job externo y un store de sesiones común.
- La fase inicial verifica política y arranque local; la integración con Mongo,
  UI y reset se prueba por separado. No se declara la demo lista por pasar una
  prueba unitaria.

Referencias: [MongoDB Community vs. `inMemory`](https://www.mongodb.com/docs/v8.0/core/inmemory/),
[volúmenes temporales de Kubernetes](https://kubernetes.io/docs/concepts/storage/volumes/),
[sesiones Express](https://expressjs.com/en/resources/middleware/session/),
[compatibilidad Mongoose/MongoDB](https://mongoosejs.com/docs/8.x/docs/compatibility.html),
[compatibilidad de bcrypt con Node](https://github.com/kelektiv/node.bcrypt.js/#version-compatibility).
