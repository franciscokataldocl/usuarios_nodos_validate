const { FetchDataBlackBoard } = require("./functions");
const { readFromS3, fileName, saveOnS3 } = require("./saveOnS3")

let users=[];
let campus=[];
let carreras=[];

let userNodes=[];
let notFoundNodes=[];

const sendToApi = async () => {
    const data = [fileName.USERS, fileName.CAMPUS, fileName.CARRERAS];

    for (const item of data) {
        const response = await readFromS3(item);
        switch (item) {
            case fileName.USERS:
                users.push(response);
                break;
            case fileName.CAMPUS:
                campus.push(response);
                break;
            case fileName.CARRERAS:
                carreras.push(response);
                break;
            default:
                break;
        }
    }


            await userNodesToSave();

};

const userNodesToSave = async () =>{
    users[0].forEach(USER => {
        const route = `USS_${USER.NIVEL}_PROD_${USER.FACULTAD}_${USER.CAMPUS}${USER.ROL === 'SECESTUDIO' ? '_' + USER.CARRERA : ''}`;
       let nodoId='';
        
        if(USER.ROL === 'SECESTUDIO'){
          nodoId = carreras[0].find(c => c.externalId === route)?.id;
        } else{
           nodoId = campus[0].find(c => c.externalId === route)?.id;
        }
      
        if(nodoId !== '' && nodoId !== undefined){
          userNodes.push({
            USERID: USER.BB_ID,
            NODEID: nodoId
          })
         // console.log(`Encontrado nodo ${route} para usuario ${USER.BB_ID}`);
        } else{
          //console.log(`No existe nodo ${route} para usuario ${USER.BB_ID}`)
          notFoundNodes.push({
            RUT: USER.RUT,
            BB_ID: USER.BB_ID,
            ROL: USER.ROL,
            NODEROUTE: route
          });
        }
      });

        //almacenar nodos no encontrados en s3
        if(notFoundNodes.length !== 0){
            await saveOnS3(fileName.NOTFOUND, notFoundNodes);
        }
        await SaveAdminUsersNodes(userNodes)
}

const SaveAdminUsersNodes = async (data) => {
    const chunkSize = Math.ceil(data.length / 40); 
    const dataChunks = []; 

    // Divide data en subarreglos
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        dataChunks.push(chunk);
    }

    // Itera sobre cada subarreglo y realiza la llamada a FetchDataBlackBoard con un retraso de 10 segundos entre cada llamada
    for (let i = 0; i < dataChunks.length; i++) {
        const chunk = dataChunks[i];
        await processChunk(chunk);
        if (i < dataChunks.length - 1) {
            await delay(10000); // Espera 10 segundos antes de continuar con el siguiente subarreglo
        }
    }
};

const processChunk = async (chunk) => {
    console.log('... total usuarios + nodos', chunk.length);
    console.log('... vinculando usuarios-nodos');
    for (const item of chunk) {
        global.totalApiRequest = global.apiRequestCounter++;
        try {
            const data = await FetchDataBlackBoard(
                "PUT",
                {
                    "nodeRoles": [
                        "USS-S-S"
                    ]
                },
                `${process.env.BLACKBOARD_URL}institutionalHierarchy/nodes/${item.NODEID}/admins/${item.USERID}`
            );

            try {
                await FetchDataBlackBoard(
                    "PUT",
                    null,
                    `${process.env.BLACKBOARD_URL}institutionalHierarchy/nodes/${item.NODEID}/users/${item.USERID}`
                );
            } catch (error) {
                if (error.status === 409 && error.message === "An association between this user and node already exists") {
                    console.warn(`Error 409: La asociación entre el usuario ${item.USERID} y el nodo ${item.NODEID} ya existe, continuando con la siguiente petición.`);
                    continue; // Continuar con el siguiente item del chunk
                } else {
                    throw error; // Lanzar otros errores
                }
            }

            console.log('data', data);
        } catch (error) {
            // Manejar el error 404 sin lanzar una excepción
            if (error.message.includes('Error 404')) {
                console.error(`Error 404: No se encontró el recurso para nodo: ${item.NODEID} - usuario:${item.USERID}`);
            } else {
                console.error('Error en FetchDataBlackBoard:', error);
                throw error; 
            }
        }
    }
};



const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};



module.exports = {
    sendToApi
}