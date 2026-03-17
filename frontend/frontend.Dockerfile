# Estágio 1: Build do React
FROM node:22-slim AS build

WORKDIR /app

# Instala as dependências
COPY package*.json ./
RUN npm install

# Copia o código e gera a pasta 'dist' (ou 'build')
COPY . .
RUN npm run build

# Estágio 2: Servir os arquivos estáticos com Nginx
FROM nginx:alpine

# Copia os arquivos gerados no estágio de build para a pasta do Nginx
# Obs: Se você usa Create React App, mude /app/dist para /app/build
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.confs

# Expõe a porta 80 (padrão do Nginx)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]