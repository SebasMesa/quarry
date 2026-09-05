   # 🛰️ Guía Explicativa: Conexión de QuarryV2 a la Base de Datos (Supabase)

¡Bienvenido! Este documento fue creado especialmente para ti. Aquí te explicamos paso a paso y con palabras sencillas cómo conectamos la aplicación **QuarryV2** a tu base de datos en la nube (**Supabase**). No necesitas conocimientos de programación para entenderlo.

---

## 💡 1. ¿Qué es Supabase y por qué lo usamos?

Imagina que **QuarryV2** es una consola de juego en tu pantalla y **Supabase** es un archivador gigante en internet (la nube). 
- Antes, la aplicación guardaba los datos en la memoria temporal del navegador (como una partida no guardada).
- Ahora, con **Supabase**, cada contrato sellado, cada racha diaria y cada nivel alcanzado se guardan en internet de forma permanente y segura.

---

## 🔑 2. Las Llaves de Acceso (`.env.local`)

Para que la aplicación sepa a dónde enviar la información, necesita dos llaves que están guardadas en tu archivo `.env.local`:
1. **`VITE_SUPABASE_URL`**: La dirección de tu base de datos en internet.
2. **`VITE_SUPABASE_ANON_KEY`**: La llave de seguridad que autoriza a la app a leer y escribir datos.

### 🧹 Ajuste de limpieza que realizamos:
Detectamos que la dirección tenía un texto extra al final (`/rest/v1/`). La librería de Supabase añade esa parte de forma automática, por lo que limpiamos la dirección en el código en `src/lib/supabase.ts`. Así evitamos que la aplicación intentara buscar direcciones duplicadas o incorrectas.

---

## 🛠️ 3. Los "Mensajeros" del Sistema (Archivos API)

Creamos y organizamos varios "mensajeros" en la carpeta `src/lib/api/`. Cada uno tiene una tarea específica:

### 📡 `src/lib/supabase.ts` (El Conector Principal)
Es el teléfono central. Toma la dirección y la llave de acceso y establece la conexión segura entre la aplicación y Supabase.

### 🗺️ `src/lib/api/sectors.ts` (Mensajero de Sectores)
Se encarga de traer la información real de los sectores operacionales desde la tabla `sectors` de la base de datos (Panel de Mando, Rutinas, Riqueza, Cuerpo, Hoja de Cazador).

### 📜 `src/lib/api/contracts.ts` (Mensajero de Contratos)
Gestiona todo lo relacionado con tus misiones:
- Trae tus contratos guardados.
- Marca los contratos como completados en la base de datos.
- Registra tus rachas diarias en la tabla `routine_logs`.

### 👤 `src/lib/api/profile.ts` (Mensajero del Cazador)
Mantiene al día tus estadísticas personales: tu nombre de cazador, tu experiencia acumulada (XP), tu nivel, tu rango y el estado de tu droide de a bordo.

### 🔄 `src/lib/api/quarry-sync.ts` (El Sincronizador)
Al abrir la aplicación, este mensajero va a la nube, revisa si ya tienes datos guardados y los trae a tu pantalla. Si es la primera vez que abres la app, se encarga de crear tu perfil inicial en Supabase para que todo comience a funcionar de inmediato.

---

## 🧠 4. El Cerebro de la Aplicación (`src/lib/state/quarry.tsx`)

Este archivo es el corazón que une la pantalla con la base de datos:

1. **Al iniciar la app**: Conecta inmediatamente con Supabase y carga los sectores y contratos reales.
2. **Actualización Ultrarrápida (Optimista)**: Cuando haces clic en **"Sellar"** un contrato:
   - La pantalla responde al instante sumándote los XP y créditos (sin hacerte esperar).
   - En segundo plano (sin interrumpirte), la aplicación le avisa a Supabase que guarde ese cambio en la base de datos.
3. **Indicador de Estado Visual**: Añadimos un pequeño indicador en la esquina superior derecha de la pantalla que muestra **`BD NUBE`** con un punto verde intermitente cuando estás conectado a la base de datos real.

---

## 🚀 5. ¿Cómo comprobar que todo funciona?

1. **Abre la aplicación** en tu navegador.
2. Observa la barra superior: verás la etiqueta **`BD NUBE`** que confirma que la base de datos de Supabase está activa.
3. Haz clic en **"Sellar"** en cualquier contrato o completa una rutina. Verás cómo los XP y créditos se actualizan y la base de datos guarda el estado del contrato.
4. Si recargas la página, la información seguirá ahí porque ya proviene de tu base de datos en la nube.

---

## ✨ Mejoras Profesionales Aplicadas
- **Resiliencia ante fallos de conexión**: Si internet se interrumpe momentáneamente, la app sigue funcionando suavemente sin congelarse.
- **Código Limpio y Tipado en TypeScript**: Cero errores de compilación (`tsc --noEmit` verificado).
- **Cero duplicación de código**: Servicios separados y modulares listos para escalar a futuro.
