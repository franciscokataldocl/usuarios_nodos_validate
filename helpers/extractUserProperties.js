const extractProperties = (users) =>{
    console.log('...extrayendo propiedades');
    const niveles = [];
    const facultades = [];
    const campus = [];
    const carreras = [];

const agregarUnico = (valor, arreglo) =>{
    if (!arreglo.includes(valor)) {
        arreglo.push(valor);
    }
}
    

    users.forEach(user => {
        agregarUnico(user.NIVEL, niveles);
        agregarUnico(user.FACULTAD, facultades);
        agregarUnico(user.CAMPUS, campus);
        agregarUnico(user.CARRERA, carreras);
    });

    // Devolver un objeto con los arreglos de valores únicos
    return {
        niveles,
        facultades,
        campus,
        carreras
    };
}



module.exports = {
    extractProperties
};