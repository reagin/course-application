import "dotenv/config";

// Used to connect database
export const mysqlConfig = {
	host: "localhost",
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
};

// Option to set the session function in  ./server/main.js
export const sessionConfig = {
	name: "token",
	resave: true,
	rolling: true,
	saveUninitialized: true,
	secret: process.env.SESSION_SECRET,
};
