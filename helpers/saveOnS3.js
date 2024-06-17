const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();



const saveOnS3 = async (fileName,data) =>{
    const jsonData = JSON.stringify(data);
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${process.env.AWS_FOLDER_NAME}/${fileName}`,
        Body: jsonData,
        ContentType: 'application/json'
    };
    s3.putObject(params, (err, data) => {
        if (err) {
            console.error(`Error al cargar el archivo ${fileName} JSON a S3:`, err);
            return;
        }
        console.log('Archivo JSON cargado exitosamente a S3:', `${process.env.AWS_FOLDER_NAME}/${fileName}`);
    });
}



const fileName = {
    USERS: 'users.json',
    PRODUCCION: 'produccion.json',
    NIVELES: 'niveles.json',
    CARRERAS: 'carreras.json',
    CAMPUS: 'campus.json',
    FACULTADES: 'facultades.json',
    NOTFOUND: 'notFoundNodes.json'
}

const readFromS3 = async (fileName) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${process.env.AWS_FOLDER_NAME}/${fileName}`
      };

      try {
        const data = await s3.getObject(params).promise();
        const jsonData = JSON.parse(data.Body.toString());
        return jsonData;
      } catch (error) {
        console.error(`Error al leer el archivo ${fileName} desde S3:`, error);
        throw error;
      }


}


module.exports = {saveOnS3, fileName, readFromS3};