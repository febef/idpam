# IdPAM — demo local en preparación

IdPAM es un prototipo histórico de identidad y permisos. El tag local `legacy`
conserva el estado anterior; la evolución ocurre en `evolucion/demo-preparation`.
El contrato verificable y sus límites están en [docs/demo-contract.md](docs/demo-contract.md).

## Ejecutar en este equipo

Requiere Docker Desktop. El script de build crea un contexto temporal porque el
respaldo montado contiene metadatos macOS que Docker no puede leer directamente.

```bash
bash scripts/build-demo.sh
docker compose -f compose.demo.yaml up -d
```

Abrir [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login) con la cuenta
ficticia `demo` y la clave pública de laboratorio `demo-idpam-only-2026`.
La cuenta sólo tiene permiso de lectura sobre identidades de ejemplo; no usar
esa clave ni esa base para ningún dato real. La app sólo publica localhost y
Mongo no publica puertos al host.

El reset ocurre cada hora por defecto; cambiarlo temporalmente con
`RESET_INTERVAL_SECONDS=600 docker compose -f compose.demo.yaml up -d
--force-recreate app`. Se aceptan intervalos enteros de 60 a 86400 segundos.
Un reset reemplaza los datos de demo e invalida sesiones activas.

```bash
cd src && npm test
docker compose -f ../compose.demo.yaml down
```

`down` detiene y elimina sólo los contenedores y redes de esta demo. La base
vive en tmpfs y se pierde al retirar su contenedor.

## Estado de publicación

Esta es una demo **local**, no una versión segura para Internet. Antes de abrir
el repositorio o publicar una URL faltan la revisión del historial y secretos,
la auditoría de funciones y mutaciones de la API, protección CSRF, sesiones
compartidas y una pasada de pruebas/UI. No crear mirrors públicos ni mover
remotos hasta cerrar esas puertas. El remoto GitHub configurado apunta a
`febef/IdpAm`, pero su accesibilidad y visibilidad no se confirmaron desde
esta sesión; GitLab aún no está configurado como remoto.
