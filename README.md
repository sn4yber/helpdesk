# Help Desk

Mini aplicación para registrar y dar seguimiento a incidencias: inicio de sesión, alta, consulta, actualización de estado y eliminación de tickets.

La base de datos ya existe. Esta aplicación no crea ni modifica el esquema.

## Requisitos

- Node.js 22 o superior
- PostgreSQL con la base `helpdesk` y las tablas `agentes`, `clientes`, `tickets` y `seguimientos`

## Instalación

```bash
npm install
cp .env.example .env
```

Edita `.env`:

- `DATABASE_URL`: conexión a la base `helpdesk`
- `SESSION_SECRET`: una cadena de al menos 16 caracteres

## Uso

Desarrollo:

```bash
npm run dev
```

Abre http://127.0.0.1:4321

Producción:

```bash
npm run build
node dist/server/entry.mjs
```

El servidor de producción escucha en el puerto `4321`, salvo que definas `PORT` y `HOST`. La cookie de sesión lleva `secure` en ese build, así que hace falta HTTPS para que el navegador la guarde. La demo local usa `npm run dev`.

## Acceso de demostración

Si la tabla `agentes` está vacía, el primer arranque crea un agente:

| Campo | Valor |
| --- | --- |
| Nombre | Administrador |
| Usuario | `admin` |
| Contraseña | `123` |

El usuario se guarda en el campo `email`. No es un correo.

## Guion de la demo

1. Entra a `/tickets` sin sesión: redirige a `/login`.
2. Entra con `admin` / `123`. Un dato incorrecto muestra «Usuario o contraseña incorrectos».
3. Crea un ticket con nombre, apellido, dirección y teléfono. El primero queda como `TK-000001`, en proceso.
4. En el detalle, cámbialo a Atendido con una nota. El estado y la línea de tiempo se actualizan.
5. Escálalo. En el listado y en el detalle se lee «Escalado a dependencia superior».
6. Finalízalo. El formulario de cambio desaparece.
7. Prueba el filtro por estado y la búsqueda por código.
8. Cierra sesión. `/tickets` vuelve a pedir inicio de sesión.

La eliminación está disponible en la «Zona de peligro» del detalle. Antes de ejecutarla, la interfaz pide confirmación. Se eliminan el ticket y sus seguimientos; el cliente se conserva.

## Decisiones

Donde el enunciado dejaba margen, se eligió la opción más simple:

- Las cuatro tarjetas cuentan todos los tickets, no solo el resultado del filtro. Cada tarjeta aplica ese estado al filtro.
- Un cliente se reutiliza solo si nombre, apellido y teléfono coinciden exactamente, después de quitar espacios. La comparación distingue mayúsculas y no actualiza la dirección ya guardada.
- La búsqueda no distingue mayúsculas. Busca código, nombre, apellido o nombre completo. `%` y `_` se tratan como texto, no como comodines.
- El valor guardado de un caso escalado es `Escalado`. La interfaz lo muestra como «Escalado a dependencia superior».
- La nota vacía se guarda como `NULL`.
- Los errores de formulario viajan en una cookie temporal para volver a mostrar lo escrito.
- Las fechas se muestran en `America/Bogota`.
- La sesión dura 12 horas. La semilla del administrador corre la primera vez que el proceso atiende una página, para que funcione igual en desarrollo y con `node dist/server/entry.mjs`.
- Todos los campos se recortan, incluida la contraseña.
