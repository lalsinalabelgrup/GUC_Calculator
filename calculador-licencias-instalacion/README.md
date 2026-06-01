# Calculador de licencias de instalación

Proyecto web estático para calcular el coste total de una instalación a partir
de una lista configurable de items y precios.

La aplicación carga los datos desde `data/items.json`, muestra cada item con su
precio unitario, permite introducir cantidades y recalcula automáticamente los
subtotales y el total general.

## Ejecutar en local

Como la aplicación usa `fetch` para cargar un JSON local, conviene servir la
carpeta con un servidor estático.

Con Python:

```bash
python -m http.server 8000
```

Después abre:

```text
http://localhost:8000
```

También puedes usar cualquier servidor estático equivalente, como la extensión
Live Server de VS Code.

## Modificar los items

Edita el fichero `data/items.json`.

Cada item debe tener como mínimo esta estructura:

```json
{
  "id": "licencia-ejemplo",
  "nombre": "Licencia ejemplo",
  "descripcion": "Licencia necesaria para la gestión de usuarios concurrentes.",
  "partida": "Licencias",
  "precio": 25.5
}
```

Puedes añadir, quitar o cambiar items sin tocar el HTML, CSS ni JavaScript. La
aplicación agrupa automáticamente los items por `partida` y genera una pestaña
por cada partida encontrada.

El campo `id` se usa para mantener la cantidad seleccionada aunque cambies de
pestaña. Debe ser único para cada item.

La estructura está pensada para poder ampliar cada item con nuevos campos como
`categoria`, `unidad` u `observaciones` si más adelante necesitas mostrarlos en
la ficha del item.

## Publicar en GitHub Pages

1. Sube este proyecto a un repositorio de GitHub.
2. Entra en `Settings` > `Pages`.
3. En `Build and deployment`, selecciona `Deploy from a branch`.
4. Elige la rama principal, normalmente `main`, y la carpeta raíz `/`.
5. Guarda los cambios.

GitHub publicará la página en una URL similar a:

```text
https://tu-usuario.github.io/calculador-licencias-instalacion/
```
