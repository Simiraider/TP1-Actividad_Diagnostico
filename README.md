# Starlight Starter Kit: Basics

[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)

```
npm create astro@latest -- --template starlight
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro + Starlight project, you'll see the following folders and files:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   └── docs/
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Check out [Starlight’s docs](https://starlight.astro.build/), read [the Astro documentation](https://docs.astro.build), or jump into the [Astro Discord server](https://astro.build/chat).


Ideas posibles:
    1. Dashboard de Suscripciones: Sirviria como un dashboard generico pero para facilitar el manejo de gastos fijos mensuales (Netflix, Spotify, Gimnasio, etc.)
    También le podria agregar cuanto gastaria de año en suspcripciones y te avise siempre con antelacion de unos dias cuando iba a vencer una. Ya debe existir una, pero me parece una muy buena idea para empezar.

    2. Catalogo de Rutas/Viajes: Similar a Netflix pero con destinos. Basicamente seria un netflix para lugares en el que cliqueas y te podria decir planes o lugares interesantes para visitar/hacer, seria muy bueno en los casos de organizacion de viajes, tambien podria agregar un calendario, los precios, horarios habiles, y organizar viajes y dividirlos en carpetas estilo por continentes favoritos. Me parece una idea dificil pero increible, se le podria agregar un catalogo con fotos al estilo pinterest usando CSS Grid. O sino tambien, tipo scrollear tipo tinder y los lugares que te guste te va dejando las cosas que puedes hacer. Prefiero mas lo de similar a Netflix.

    3. Simulador de Inversiones(o real pero viendo hacia futuro): Seria una herramienta en la que pondrias el monto a invertir, el interés anual y te mostraria cuando tendrias en 5 o la cantidad de años que quieras. Otra forma seria una verdadera pero te mostraria estrategias y seria como una ia o algo que te diria cuando invertir, cuando sacar, en que invertir y en que no. Viendo cosas que se repitan dentro de las acciones. Buena idea, seria como un real-time broker.
    
    4. App de Seleccion Aleatoria: Seria algo que usar cuando tienes varias cosas que hacer o estas aburrido y no tenes ni idea de que hacer, comer o ver. Cargarias una lista de opciones y la app elegiria por vos, podria ser tambien una ruleta o un estilo tipo un juego de casino que va haciendo probabilidades para ver que vas a hacer, que seria verdaderamente aleatorio. Agregarle animaciones y diversos estilos de juegos. No me parece una idea muy buena pero si divertida, estaria aceptable.

    5. Temporizador Pomodoro W/Calendario: Seria como un temporizador Pomodoro normal que es una herramienta de gestión del tiempo que alterna bloques de trabajo enfocado (generalmente 25 minutos) con descansos breves (5 minutos) para mejorar la productividad y reducir la fatiga menta. Pero en este caso seria medirlo entre varios dias y sumar al calendario de google, o cuenta de samsung, apple o lo que tengas, basicamente te organizaria el tiempo de estudio y pruebas en tu calendario propio. Seria una idea apta para proyecto pero ya debio ser hecha, buena herramienta para alumnos y estudiantes. Se podria agregar funciones para que te testee despues de estudiar, y meterle tus contenidos y te de flashcards o pruebas multiple choice para estudias o practicar. Otra variable seria como un duolingo para estudiar.


    Me quede con la ultima idea, osea la idea de Tecnica Pomodora W/Calendario. Para explicar mejor se basaria en un proyecto que combina técnicas Pomodoro con un sistema de aprendizaje inteligente. La página principal incluye un dashboard central con un temporizador circular, tres secciones: Zona de Enfoque con controles para el temporizador, Agenda de Hoy que muestra tareas completadas y Estadísticas Rápidas para seguimiento de minutos de estudio. Debe ser responsiva, utilizando Flexbox/Grid. La lógica del cronómetro se implementará con JavaScript, permitiendo actualizaciones en tiempo real. Opcionalmente, se pueden añadir componentes reutilizables en Astro, animaciones con View Transitions API o Framer Motion, y estandarizar el diseño con Tailwind CSS. También se propone integrar una API de frases motivacionales, un modo oscuro y despliegue en Vercel o Netlify, así como una celebración con Confetti-js tras completar cuatro pomodoros. lo voy a llamar FocusFlow.