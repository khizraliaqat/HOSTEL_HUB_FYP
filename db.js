const mysql = require('mysql2');

// 1. Use Connection Pool (Keeps DB alive)
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',      
    database: 'hostelhub_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Test the connection
db.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
    } else {
        console.log('✅ Connected to MySQL Database (Pool Active)');
        connection.release(); // Release connection back to pool
    }
});

module.exports = db;