require('dotenv').config();
const { getBlackBoardToken } = require('./dependencies/blackboardToken');
const { fetchNodes } = require('./helpers/fetchNodes');
const { usuariosWithIdBlackBoard } = require('./helpers/functions');
const { saveFile } = require('./helpers/saveJson');
const { sendToApi } = require('./helpers/sendToApi');

(async ( ) => {
    console.log('...iniciando servidor');
    console.time();
    global.apiRequestCounter = 0;

    await getBlackBoardToken();
        const users = await usuariosWithIdBlackBoard();
        saveFile('users.json', users)
        await fetchNodes(users.properties);
       await sendToApi();
       console.log('ejecucion terminada')
       console.timeEnd();
       console.log('total_request to api', global.totalApiRequest)

    }) ( );

