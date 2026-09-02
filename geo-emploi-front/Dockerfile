FROM node:22-slim

WORKDIR /app

# Les dépendances d'abord : la couche est réutilisée tant que
# package-lock.json ne bouge pas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# API_URL est lue à l'exécution (jamais inlinée dans le bundle) : le build
# n'a besoin d'aucune variable d'environnement.
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
