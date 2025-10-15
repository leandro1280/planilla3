# Guía de Componentes Modulares

## 📁 Estructura Creada

He dividido tu archivo `dashboard/index.hbs` (que tenía 554 líneas) en componentes más pequeños y manejables. Aunque no pudimos usar partials de Handlebars debido a problemas de configuración, creé una estructura de archivos que te permite copiar y pegar fácilmente las secciones que necesites modificar.

## 🗂️ Archivos Creados

### En `views/components/dashboard/`:

1. **`hero-section.hbs`** - Sección principal del dashboard
2. **`quick-actions.hbs`** - Botones de acciones rápidas
3. **`stats-cards.hbs`** - Tarjetas de estadísticas generales
4. **`tea-tep-ted-distribution.hbs`** - Distribución de calificaciones TEA/TEP/TED
5. **`courses-table.hbs`** - Tabla de cursos con filtros
6. **`stats-modal.hbs`** - Modal de estadísticas detalladas
7. **`dashboard-scripts.hbs`** - Scripts JavaScript del dashboard
8. **`README.md`** - Documentación detallada de cada componente

## 🎯 Cómo Usar los Componentes

### Para Modificar una Sección Específica:

1. **Abre el archivo del componente** que quieres modificar en `views/components/dashboard/`
2. **Haz tus cambios** en ese archivo
3. **Copia el contenido** del archivo modificado
4. **Pega el contenido** en la sección correspondiente de `views/pages/dashboard/index.hbs`

### Ejemplo Práctico:

Si quieres modificar las tarjetas de estadísticas:

1. Edita `views/components/dashboard/stats-cards.hbs`
2. Copia todo el contenido
3. Ve a `views/pages/dashboard/index.hbs`
4. Busca la sección `<!-- Estadísticas Generales -->` (líneas 106-174)
5. Reemplaza esa sección con el contenido copiado

## 📋 Mapeo de Secciones

| Componente | Líneas en index.hbs | Descripción |
|------------|-------------------|-------------|
| `hero-section.hbs` | 1-57 | Título, descripción y selección de escuela |
| `quick-actions.hbs` | 59-104 | Botones de acceso rápido |
| `stats-cards.hbs` | 106-174 | Tarjetas de estadísticas |
| `tea-tep-ted-distribution.hbs` | 176-249 | Distribución TEA/TEP/TED |
| `courses-table.hbs` | 251-331 | Tabla de cursos |
| `stats-modal.hbs` | 333-376 | Modal de estadísticas |
| `dashboard-scripts.hbs` | 378-550 | Scripts JavaScript |

## ✅ Ventajas de esta Estructura

1. **Fácil de Modificar**: Cada sección está en su propio archivo
2. **Mantenimiento Simple**: No necesitas buscar en un archivo de 554 líneas
3. **Reutilización**: Puedes usar los componentes en otras páginas
4. **Colaboración**: Diferentes personas pueden trabajar en diferentes secciones
5. **Debugging**: Es más fácil encontrar y corregir errores
6. **Escalabilidad**: Fácil agregar nuevas secciones

## 🔧 Cómo Agregar Nuevas Secciones

1. Crea un nuevo archivo en `views/components/dashboard/`
2. Escribe el HTML de tu nueva sección
3. Copia el contenido al lugar apropiado en `index.hbs`
4. Documenta la nueva sección en el README

## 📝 Notas Importantes

- **Mantén las variables de Handlebars**: `{{user}}`, `{{school}}`, `{{stats}}`, etc.
- **Preserva los IDs y clases CSS**: Para que la funcionalidad JavaScript siga funcionando
- **Guarda los archivos originales**: Como respaldo antes de hacer cambios grandes
- **Prueba después de cada cambio**: Para asegurar que todo funciona correctamente

## 🚀 Próximos Pasos

1. **Explora los componentes** en `views/components/dashboard/`
2. **Haz modificaciones** en los archivos individuales
3. **Copia y pega** los cambios al archivo principal
4. **Prueba la funcionalidad** después de cada modificación

¡Ahora tienes una estructura mucho más manejable para trabajar con tu dashboard!
