# Deploy — Mundial FIFA 2026

Dos instancias independientes, cada una con su propio Firebase project y base de datos.

| Instancia | Firebase project             | URL                              | Usuarios        |
|-----------|------------------------------|----------------------------------|-----------------|
| **work**  | cnd-proyectos-1758925687125  | prode.came.ar / prode.gastongracis.dev | CAME (Microsoft login) |
| **paid**  | fifa26came                   | mundial2026.newdanger.com.ar     | Público (pago)  |

---

## ⚠️ Regla de oro

**Siempre** correr el build de la instancia correcta antes de deployar.
Si deployás con el build equivocado, ambos sitios apuntan al mismo Firebase → comparten usuarios y datos.

---

## Deploy instancia WORK (CAME)

```bash
cd worldcup-simple/web
npm run deploy:work
```

Equivale a:
```bash
npm run build                          # vite build sin --mode → usa .env
firebase deploy --only hosting -P work
```

**Frontend config:** `web/.env`
**Functions config:** `functions/.env.cnd-proyectos-1758925687125`

---

## Deploy instancia PAID (mundial2026)

```bash
cd worldcup-simple/web
npm run deploy:paid
```

Equivale a:
```bash
npm run build:paid                     # vite build --mode paid → usa .env.paid
firebase deploy --only hosting -P paid
```

**Frontend config:** `web/.env.paid`
**Functions config:** `functions/.env.fifa26came`

---

## Deploy functions (ambas instancias)

Las functions se deployean por separado. Cada proyecto usa su propio archivo `.env.<projectId>`.

```bash
cd worldcup-simple

# WORK
firebase deploy --only functions -P work

# PAID
firebase deploy --only functions -P paid
```

---

## Deploy completo (hosting + functions)

```bash
cd worldcup-simple

# WORK — build y deploy todo
cd web && npm run build && cd ..
firebase deploy -P work

# PAID — build y deploy todo
cd web && npm run build:paid && cd ..
firebase deploy -P paid
```

---

## Dev local

```bash
cd worldcup-simple/web

# Instancia work (default)
npm run dev

# Instancia paid
npx vite --mode paid
```

---

## Archivos clave

```
worldcup-simple/
├── .firebaserc                          # alias de proyectos Firebase (work / paid)
├── firebase.json                        # config hosting + functions
├── web/
│   ├── .env                             # config frontend WORK
│   ├── .env.paid                        # config frontend PAID
│   └── package.json                     # scripts: build / build:paid / deploy:work / deploy:paid
└── functions/
    ├── .env                             # fallback compartido
    ├── .env.cnd-proyectos-1758925687125 # secrets WORK (Resend, APP_NAME, SITE_URL)
    └── .env.fifa26came                  # secrets PAID (Resend, APP_NAME, SITE_URL)
```
