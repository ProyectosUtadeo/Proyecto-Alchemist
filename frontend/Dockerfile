# Etapa base
FROM node:20

# Crear directorio
WORKDIR /app

# Copiar package.json y lock para instalar dependencias
COPY package*.json ./

RUN npm install

# Copiar el resto del código fuente
COPY . .

# Puerto de desarrollo
EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host"]
