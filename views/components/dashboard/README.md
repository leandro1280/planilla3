# Componentes del Dashboard

Este directorio contiene los componentes modulares del dashboard principal (`views/pages/dashboard/index.hbs`). Cada componente es responsable de una sección específica del dashboard, lo que facilita el mantenimiento y las modificaciones.

## Estructura de Componentes

### `hero-section.hbs`
- **Propósito**: Sección principal del dashboard con título, descripción y acciones
- **Incluye**:
  - Título principal del dashboard
  - Información del usuario y escuela actual
  - Botones de acción (Actualizar y Estadísticas)
  - Selección de escuela (si no hay escuela seleccionada)

### `quick-actions.hbs`
- **Propósito**: Botones de acceso rápido a las funciones principales
- **Incluye**:
  - Gestionar Estudiantes
  - Calificaciones
  - Reportes
  - Estadísticas (modal)

### `stats-cards.hbs`
- **Propósito**: Tarjetas con estadísticas generales del sistema
- **Incluye**:
  - Cursos Activos
  - Estudiantes Matriculados
  - Profesores Activos
  - Calificaciones Registradas

### `tea-tep-ted-distribution.hbs`
- **Propósito**: Distribución visual de calificaciones TEA/TEP/TED
- **Incluye**:
  - Tarjetas de distribución por categoría
  - Barras de progreso
  - Badges con porcentajes
  - Resumen de rendimiento

### `courses-table.hbs`
- **Propósito**: Tabla de cursos con filtros y estadísticas
- **Incluye**:
  - Filtros por ciclo (Básico/Superior)
  - Tabla con información de cursos
  - Estadísticas TEA/TEP/TED por curso
  - Botones de acción para cada curso

### `stats-modal.hbs`
- **Propósito**: Modal para estadísticas detalladas
- **Incluye**:
  - Filtros de año y cuatrimestre
  - Contenedor para gráficos
  - Botón de carga de estadísticas

### `dashboard-scripts.hbs`
- **Propósito**: Scripts JavaScript específicos del dashboard
- **Incluye**:
  - Filtros de cursos
  - Carga de estadísticas detalladas
  - Renderizado de gráficos con Chart.js
  - Manejo de eventos del modal

## Archivo Principal Simplificado

El archivo `index.hbs` ahora es mucho más limpio y fácil de leer:

```handlebars
{{> components/dashboard/hero-section}}
{{> components/dashboard/quick-actions}}
{{> components/dashboard/stats-cards}}
{{> components/dashboard/tea-tep-ted-distribution}}
{{> components/dashboard/courses-table}}
{{> components/dashboard/stats-modal}}
{{> components/dashboard/dashboard-scripts}}
```

## Ventajas de esta Estructura

1. **Mantenimiento Fácil**: Cada sección está en su propio archivo
2. **Modificaciones Rápidas**: Puedes editar solo la parte que necesitas
3. **Reutilización**: Los componentes pueden usarse en otras páginas
4. **Colaboración**: Diferentes desarrolladores pueden trabajar en diferentes secciones
5. **Debugging**: Es más fácil encontrar y corregir errores
6. **Escalabilidad**: Fácil agregar nuevas secciones o modificar existentes

## Cómo Modificar

### Para cambiar la sección principal:
- Edita `hero-section.hbs`

### Para modificar las acciones rápidas:
- Edita `quick-actions.hbs`

### Para cambiar las estadísticas:
- Edita `stats-cards.hbs` o `tea-tep-ted-distribution.hbs`

### Para modificar la tabla de cursos:
- Edita `courses-table.hbs`

### Para cambiar el modal de estadísticas:
- Edita `stats-modal.hbs`

### Para modificar la funcionalidad JavaScript:
- Edita `dashboard-scripts.hbs`

## Notas Importantes

- Todos los componentes mantienen las variables de Handlebars originales
- Los IDs y clases CSS se mantienen para preservar la funcionalidad
- Los scripts están separados pero mantienen la misma lógica
- La estructura es compatible con el sistema de partials de Handlebars
