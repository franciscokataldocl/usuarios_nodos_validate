

const { getFacultyRoles } = require("../src/model/usersBanner");
const { extractProperties } = require("./extractUserProperties");
const { saveOnS3, fileName, readFromS3 } = require("./saveOnS3");






const FetchDataBlackBoard = async (method, body = null, url, retryAttempts = 3, retryDelay = 3000) => {
    const contentType = method === 'PUT' ? 'application/json' : 'application/x-www-form-urlencoded';
    const requestOptions = {
        method,
        headers: {
            'Content-Type': contentType,
            'Authorization': `Bearer ${global.blackboardToken}`,
        },
        body: body ? (contentType === 'application/json' ? JSON.stringify(body) : body) : null,
    };

    try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            if ((response.status === 503 || response.status === 429) && retryAttempts > 0) {
                console.log(`Error ${response.status} al realizar la solicitud a ${url}. Reintentando...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay)); // Espera antes de reintentar
                return await FetchDataBlackBoard(method, body, url, retryAttempts - 1, retryDelay); // Reintenta la solicitud
            } else {
                throw new Error(`Error ${response.status} al realizar la solicitud a ${url}`);
            }
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en FetchDataBlackBoard:', error);
        throw error;
    }
};








const usersFromBlackboard = async (studentId) => {
    global.totalApiRequest = global.apiRequestCounter++;
    try {
        const response = await FetchDataBlackBoard(
            "GET",
            null,
            `${process.env.BLACKBOARD_URL}users?studentId=${studentId}`
        );
        return response
    } catch (error) {
        console.log(error)
    }
}

let usersWithApiId= [];
let usuariosEncontradosEnBlackBoard=0;



const usuariosWithIdBlackBoard = async () => {
    const tamanoSubarreglo = 40;
    const delayEntreSubarreglos = 10000;

    console.log('...obteniendo usuarios banner');
     const usersFromBanner = await getFacultyRoles();
    console.log('...usuarios encontrados en banner', usersFromBanner.length)
    const subarreglos = dividirArregloEnSubarreglos(usersFromBanner, tamanoSubarreglo);
    
//    console.log(subarreglos[0]);
    for (const subarreglo of subarreglos) {
        await procesarSubarreglo(subarreglo);
        await delay(delayEntreSubarreglos);
    }
    console.log('usuarios encontrados en blackboard',usuariosEncontradosEnBlackBoard)
   const properties = extractProperties(usersWithApiId);
    await saveOnS3(fileName.USERS, usersWithApiId);

    return {
        users: usersWithApiId,
        properties,
    };

//     const users = await readFromS3(fileName.USERS)
// const properties = await extractProperties(users);
// return {
//     users: users,
//     properties,
// };
}

const dividirArregloEnSubarreglos = (arr, tamanoSubarreglo) => {
    const subarreglos = [];
    for (let i = 0; i < arr.length; i += tamanoSubarreglo) {
        subarreglos.push(arr.slice(i, i + tamanoSubarreglo));
    }
    return subarreglos;
};

const procesarSubarreglo = async (subarreglo) => {
    console.log('... buscando usuarios en blackboard', subarreglo.length);
    
    for (const user of subarreglo) {
        try {
            const blackBoardUser = await usersFromBlackboard(user.RUT);
            
            if (blackBoardUser && blackBoardUser.results && blackBoardUser.results[0]) {
                usuariosEncontradosEnBlackBoard++;
                
                const newUser = {
                    RUT: user.RUT,
                    ROL: user.ROL,
                    BB_ID: blackBoardUser.results[0].id,
                    NIVEL: user.NIVEL,
                    FACULTAD: user.FACULTAD,
                    CAMPUS: user.VCAMPUS,
                    CARRERA: user.VCARRERA,
                    PERIODO: user.PERIODO,
                };
                
                usersWithApiId.push(newUser);
            }
        } catch (error) {
            if (error.message.includes('401')) {
                console.error(`Error 401: No autorizado al buscar usuario con RUT: ${user.RUT}`);
                // Manejo del error 401, por ejemplo, puedes reintentar, loguear, o simplemente continuar
            } else {
                console.error(`Error al buscar usuario con RUT: ${user.RUT}`, error);
                // Aquí podrías manejar otros tipos de errores si es necesario
            }
        }
        
        // Agregar un delay de 1 segundo (1000 ms) entre cada consulta
        await delay(1000);
    }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));



module.exports = {
    usuariosWithIdBlackBoard,
    FetchDataBlackBoard
}