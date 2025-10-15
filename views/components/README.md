# Componentes del Layout

Este directorio contiene los componentes modulares del layout principal (`main.hbs`). Cada componente es responsable de una parte específica de la interfaz, lo que facilita el mantenimiento y las modificaciones.

## Estructura de Componentes

### `head.hbs`
- **Propósito**: Contiene el `<head>` del HTML con metadatos, títulos y enlaces a CSS
- **Incluye**: 
  - Meta tags
  - Título de la página
  - Bootstrap CSS
  - Bootstrap Icons
  - Chart.js
  - CSS personalizado

### `navbar.hbs`
- **Propósito**: Barra de navegación principal
- **Incluye**:
  - Logo y marca del sistema
  - Menú de navegación principal
  - Menús desplegables para Estudiantes, Calificaciones y Administración
  - Menú de usuario con perfil y logout
  - Selector de escuela (si aplica)

### `main-content.hbs`
- **Propósito**: Contenedor principal del contenido de la página
- **Incluye**:
  - Contenedor de alertas
  - Área donde se renderiza el contenido específico de cada página (`{{{body}}}`)
  - Lógica condicional para usuarios autenticados

### `footer.hbs`
- **Propósito**: Pie de página
- **Incluye**:
  - Copyright y información legal
  - Solo se muestra para usuarios autenticados

### `scripts.hbs`
- **Propósito**: Scripts de JavaScript
- **Incluye**:
  - Bootstrap JS
  - JavaScript personalizado (`app.js`)
  - Scripts específicos de página (si se proporcionan)

## Ventajas de esta Estructura

1. **Modularidad**: Cada componente tiene una responsabilidad específica
2. **Mantenimiento**: Es más fácil modificar una parte específica sin afectar otras
3. **Reutilización**: Los componentes pueden ser reutilizados en otros layouts
4. **Legibilidad**: El código es más fácil de leer y entender
5. **Colaboración**: Diferentes desarrolladores pueden trabajar en diferentes componentes

## Uso

Los componentes se incluyen en `main.hbs` usando la sintaxis de Handlebars:

```handlebars
{{> components/head}}
{{> components/navbar}}
{{> components/main-content}}
{{> components/footer}}
{{> components/scripts}}
```

## Modificaciones

Para modificar cualquier parte del layout:

1. **Navegación**: Edita `navbar.hbs`
2. **Estilos/CSS**: Edita `head.hbs`
3. **Contenido principal**: Edita `main-content.hbs`
4. **Pie de página**: Edita `footer.hbs`
5. **JavaScript**: Edita `scripts.hbs`
