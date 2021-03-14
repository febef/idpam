
export default {
  server: {
    port: 8180,
    host: "0.0.0.0",
    logger: ":method :url :status :res[content-length] - :response-time ms"
  },
  database:{
    user: 'root',
    password: 'toor',
    host: '10.0.0.2',
    port: 27027, // ??
    dbName: 'idpam'
  }
};
