# IdPAM — prueba de concepto recuperada

IdPAM (Identity Provider and Access Manager) es un prototipo histórico de
identidad, credenciales y permisos granulares. Se publica como prueba de
concepto y material de estudio, no como producto terminado ni como solución
recomendada para producción.

La presentación editorial del proyecto está disponible en
[Projects · Domus.land](https://projects.domus.land/es/proyectos/idpam/), con
su [versión en inglés](https://projects.domus.land/en/projects/idpam/).

El contrato verificable y sus límites están en [docs/demo-contract.md](docs/demo-contract.md);
el [inventario funcional](docs/functionality-audit.md) separa lo comprobado de
las funciones históricas aún no habilitadas.
La [guía de la demo local](docs/local-demo-guide.md) propone un recorrido
reproducible sin añadir tutoriales a la interfaz original.
Quienes contribuyan con ayuda de agentes pueden consultar la
[guía pública de contribución y automatización](AGENTS.md), que fija los límites
de producto, seguridad, pruebas y publicación sin exponer la bitácora operativa
del proyecto.

## Ejecutar en este equipo

Requiere Docker Desktop. El script de build crea un contexto temporal porque el
respaldo montado contiene metadatos macOS que Docker no puede leer directamente.
Levanta IdPAM, MongoDB temporal, OpenLDAP de prueba y Dex en la misma red de
Compose. Mongo y LDAP no publican puertos; IdPAM y Dex sólo escuchan en
`127.0.0.1` del equipo.

```bash
bash scripts/build-demo.sh
docker compose -f compose.demo.yaml up -d
```

Abrir [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login) con la cuenta
ficticia `demo` y la clave pública de laboratorio `demo-idpam-only-2026`.
La cuenta de laboratorio tiene rutas explícitas con sesión y CSRF para
administrar identidades, roles, permisos y credenciales ficticias. Se restauró
la interfaz Jade original a pedido del autor y se conectaron sus controles a
esas rutas mediante formularios de aspecto coherente con la UI histórica.
La creación abre un cuadro flotante. En identidades y roles, un clic en un
valor simple permite editarlo sobre el texto: **Enter** guarda, **Escape**
cancela y perder el foco descarta el cambio. En Inicio, la edición y las altas
se hacen sobre la misma página; los cambios compuestos de credenciales usan
los cuadros flotantes originales. La emisión de token muestra el valor una
sola vez en un cuadro de Inicio. Todos los guardados pasan por rutas
explícitas y CSRF.
La credencial de acceso inicial está protegida contra cambios y borrado; las
demás credenciales son descartables. La API genérica histórica responde 410 y
no debe reactivarse sin revisión.
El login admite contraseña, token temporal y prueba de posesión de clave SSH Ed25519.
Para probar esta última sin enviar la clave privada al servidor:

```bash
node scripts/ssh-demo.mjs generate /private/tmp/idpam-demo-key.pem
# Registrar la clave pública mediante la ruta de gestión; copiar su ID.
# En /login generar un desafío para ese ID y copiar el campo message.
node scripts/ssh-demo.mjs sign /private/tmp/idpam-demo-key.pem 'idpam-demo-ssh-v1:DESAFIO'
# Pegar la firma Base64 en /login con el mismo ID.
```

La clave privada se crea sólo en la ruta elegida, con modo 0600, y el helper no
sobrescribe archivos. Eliminá ese archivo cuando termines. No usar esta clave ni la
base para ningún dato real. La app sólo publica localhost y Mongo no publica
puertos al host.

El reset ocurre cada hora por defecto; cambiarlo temporalmente con
`RESET_INTERVAL_SECONDS=600 docker compose -f compose.demo.yaml up -d
--force-recreate app`. Se aceptan intervalos enteros de 60 a 86400 segundos.
Un reset reemplaza los datos de demo e invalida sesiones activas.
Las cuentas LDAP ficticias de Dex son `ada`/`ada-demo-only-2026` y
`grace`/`grace-demo-only-2026`; se autentican por LDAPS con una CA efímera.
El directorio y el almacenamiento de Dex viven en volúmenes temporales del
contenedor. No conectan el Keycloak ni un LDAP real. Dex se abre sólo en
`http://127.0.0.1:5556/dex` para esta prueba local; en Internet el issuer,
TLS y cliente OIDC deberán configurarse explícitamente para el hostname final.

```bash
cd src && npm test
cd .. && RUN_HTTP_TEST=1 node --test test/demo-http.test.mjs
docker compose -f compose.demo.yaml down
```

`down` detiene y elimina sólo los contenedores y redes de esta demo. La base
vive en tmpfs y se pierde al retirar su contenedor.

## Estado de publicación

IdPAM se publica como **PoC recuperada**, no como producto terminado ni como
versión recomendada para producción. El código propio usa Apache-2.0; el archivo
`NOTICE` identifica la tipografía Montserrat y `src/package-lock.json` conserva
las versiones de las dependencias con sus licencias correspondientes.

La historia pública se reconstruye desde hitos verificables con sus fechas
originales, excluyendo secretos, datos reales y la copia antigua de dependencias
que vivía en `src/node_modules-bkp/`. El tag privado `legacy` y el repositorio
histórico se conservan como respaldo, pero no forman parte de los mirrors
públicos. [GitHub](https://github.com/febef/idpam) y
[GitLab](https://gitlab.com/febef.dev/idpam) representan el mismo árbol e
historia saneados.

La receta pública vive en [`deploy/production`](deploy/production). Mantiene una
sola instancia descartable con IdPAM, MongoDB, OpenLDAP estable y Dex; sólo
IdPAM y Dex reciben tráfico del borde. Cada navegador obtiene un tenant y una
sesión independientes, persistidos en MongoDB temporal, con CSRF, rotación de
sesión y límites de intentos y mutaciones. Las imágenes propias y las imágenes
base están fijadas y el pipeline genera SBOM, analiza vulnerabilidades y
secretos y publica únicamente tags semánticos aprobados.

El contrato sigue siendo el de una **PoC pública**, no el de un IAM productivo:
usa identidades sintéticas, restablece el estado, opera con una réplica y no
acepta datos reales. La publicación sólo se considera completa cuando CI,
GitOps, DNS/TLS, el retorno OIDC y las pruebas HTTP externas verifican el mismo
release. El formulario de gestión tiene CSRF y la API genérica histórica está
cerrada, pero eso no convierte al prototipo en un producto de seguridad.
