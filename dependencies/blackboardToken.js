const axios = require('axios');

// Codificar las credenciales en formato "Basic Authentication"
const credentials = Buffer.from(`${process.env.BLACKBOARD_CLIENT_ID}:${process.env.BLACKBOARD_CLIENT_SECRET}`).toString('base64');
let headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded'
};
const endpoint = `${process.env.BLACKBOARD_URL}oauth2/token`;

const grant_type = 'client_credentials';

// Realizar la solicitud para obtener el token de acceso
const getBlackBoardToken = async () => {
    const response = await axios.post(endpoint, {
        grant_type: grant_type
    }, { headers });
    global.totalApiRequest = global.apiRequestCounter++;
    const {  access_token } = response.data;
    global.blackboardToken = access_token;
};



module.exports = {
    getBlackBoardToken
}