import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: '15kb'}))
app.use(express.urlencoded(encoded({extended: true, limit: "15kb"})))
// extended refers to object ke andr v objected de skte hai kinda nested
app.use(express.static("public"))
app.use(cookieParser())
// cookie parser is generally used to access cookies from user server and also helps in settting or modifying cookies.


export { app }