const { connect } = require("mongoose")

const dbConn = async () => {
    try {
        const conn = connect("mongodb+srv://admin:admingestion2023@gestionproyectos-db.mdyi04x.mongodb.net/gestiondb?retryWrites=true&w=majority")
        console.log("Conectado exitosamente a la db")
        return conn
    } catch (error) {
        console.log(error);
    }
}

module.exports = dbConn;