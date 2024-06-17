FROM node:20.9-buster-slim
RUN apt update 
RUN apt install dnsutils -y
WORKDIR /myapp
# Copiar el resto de los archivos de la aplicación
COPY . .
RUN npm install
CMD ["node", "index.js"]
