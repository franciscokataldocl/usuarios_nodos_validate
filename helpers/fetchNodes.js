const { FetchDataBlackBoard } = require("./functions");
const { saveFile } = require("./saveJson");
const { saveOnS3, fileName } = require("./saveOnS3");

const fetchNodes = async (properties) => {
    console.log('... obteniendo niveles, facultades, campus y carreras');
    const getNodeChildrenWithDelay = async (id) => {
        return new Promise(resolve => {
            setTimeout(async () => {
                const { results } = await FetchDataBlackBoard(
                    "GET",
                    null,
                    `${process.env.BLACKBOARD_URL}institutionalHierarchy/nodes/${id}/children`
                );
                resolve(results || []);
            }, 1000); // Delay de 1 segundo (1000 milisegundos)
        });
    };

    const filterByExternalId = (items, externalIds) => {
        return items.filter(item => {
            return externalIds.some(externalId => item.externalId.includes(externalId));
        });
    };

    const niveles = await getNodeChildrenWithDelay("_163_1");
    const filteredNiveles = niveles.filter(item => item.title !== 'INSTITUCIONALES' && 
        properties.niveles.some(nivel => item.externalId.includes(nivel)));

    const produccion = await Promise.all(filteredNiveles.map(async item => {
        const children = await getNodeChildrenWithDelay(item.id);
        return children.find(child => child.title === 'Producción');
    }));

    const facultades = await Promise.all(produccion.map(async item => {
        const children = await getNodeChildrenWithDelay(item.id);
        return filterByExternalId(children, properties.facultades);
    }));

    const campus = await Promise.all(facultades.flat().map(async item => {
        const children = await getNodeChildrenWithDelay(item.id);
        return filterByExternalId(children, properties.campus);
    }));

    const carreras = await Promise.all(campus.flat().map(async item => {
        const children = await getNodeChildrenWithDelay(item.id);
        return filterByExternalId(children, properties.carreras);
    }));

    saveFile('campus.json', campus.flat());
    saveFile('carreras.json', carreras.flat());
    // await saveOnS3(fileName.CAMPUS, campus.flat());
    // await saveOnS3(fileName.CARRERAS, carreras.flat());
};

module.exports = {
    fetchNodes
};
