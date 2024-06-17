const fs = require('fs');



const saveFile = (filename, array) =>{
    const jsonData = JSON.stringify(array, null, 2);

   try {
     fs.writeFile(filename, jsonData, 'utf8', (err) => {
        if (err) {
          console.error('Error al escribir el archivo:', err);
        } else {
          console.log(`Archivo ${filename} almacenado correctamente en s3.`);
        }
      });
   } catch (error) {
    console.log(`error al escribir archivo ${filename} json en S3`, error)
   }
}

module.exports = {
    saveFile
}