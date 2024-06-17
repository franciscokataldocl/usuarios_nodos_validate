const oracledb = require('oracledb')
const config = {
    user          : process.env.NODE_ORACLEDB_USER,
    password      : process.env.NODE_ORACLEDB_PASSWORD,
    connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING
};
//console.log("🚀 ~ config:", config)

const execQuery = async(query, param) => {
    let conn
    let result = [];
    try {
        conn = await oracledb.getConnection(config)
        if(!param)
            param = {};
        const response = await conn.execute(query, param, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        result = result = response.rows;
    } catch (err) {
        console.log(err)
        result = null;
    } finally {
        if (conn) {
            conn.close()
        }
        return result;
    }
}

module.exports = { execQuery };