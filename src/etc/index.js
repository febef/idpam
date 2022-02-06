
export default {
  server: {
    port: 80,
    host: "0.0.0.0",
    logger: ":method :url :status :res[content-length] - :response-time ms"
  },
  database:{
    user: 'root',
    password: 'example',
    host: '192.168.100.42',//'10.0.0.2',
    port: 27017, // ??
    dbName: 'idpam'
  },
  idp: {
    ldap: {}
  }
};
