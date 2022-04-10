const express = require("express");
const { Server: IOServer } = require("socket.io");
const { Server: HttpServer } = require("http");
const { error } = require("console");
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const {faker} = require('@faker-js/faker')
const normalizr = require("normalizr");
const cookieParser = require('cookie-parser')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const normalize = normalizr.normalize;
const denormalize = normalizr.denormalize;
const schema = normalizr.schema;
const DataBase = require('./DataBase.js');
const mensajesFirebase = new DataBase('mensajes');

app.use(express.static("./public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(session({
    /* ----------------------------------------------------- */
    /*           Persistencia por redis database             */
    /* ----------------------------------------------------- */
    store: MongoStore.create({ 
        mongoUrl: 'mongodb+srv://damianAbalos:vegantechno@cluster0.sv63y.mongodb.net/myFirstDatabase?retryWrites=true&w=majority',
        // mongoOptions: advancedOptions
    }),
    /* ----------------------------------------------------- */

    secret: 'shhhhhhhhhhhhhhhhhhhhh',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 600000
    } 
}))
let usuario = ""
const setearUsuario = (user) => {
    usuario = user
}

/* Rutas */

app.get("/api/productos-test", (req,res)=>{    
    res.send(productosFaker)
})

app.get('/login', (req,res)=>{
    res.sendFile("/userForm.html", { root: __dirname })
})

app.post('/login', (req, res) => {
    req.session.usuario = req.body.nombreUsuario
    setearUsuario(req.session.usuario)
    console.log(req.session.usuario);
    res.redirect('/')
})

app.get('/logout', (req,res) => {
    req.session.destroy( err => {
        if(!err) res.send(`
        <div style="width:85%; 
            display:flex; 
            margin: auto; 
            padding: 1em;
            justify-content: space-between;
            align-items: center;
            background-color:rgb(117 149 222)">
                <h1 style="color: rgb(17 50 126);" >Adios ${usuario}</h1>
                <a 
                    style="border: 1px solid transparent;
                        display: inline-block;
                        font-weight: 400;
                        line-height: 1.5;
                        color: #f8fbfe;
                        text-align: center;
                        align-items:center;
                        text-decoration: none;
                        vertical-align: middle;
                        cursor: pointer;
                        user-select: none;
                        background-color: #1315e6;
                        border: 1px solid transparent;
                        padding: 0.375rem 0.75rem;
                        font-size: 1rem;
                        border-radius: 0.25rem;" 
                    href='/login'>
                        Login
                </a>
        </div>
        `)
        else res.send({status: 'Logout ERROR', body: err})
    })
})

app.get("/", (req, res) => {
    console.log(`usuario: ${req.session.usuario}`);
    if (req.session.usuario == undefined || usuario == "") {
        res.redirect('/login')
    } else {
        console.log(`usuario: ${req.session.usuario}`);
        res.sendFile("/index.html", { root: __dirname });
    }
});

/*------------- crear productos con faker faker-------------*/
function generarCombinacion() {
    return{
        nombre:faker.commerce.product(),
        precio:faker.commerce.price(),
        imagen:faker.image.imageUrl()
    }
}
function generarData(cantidad) {
    const productos = []
    for (let i = 0; i < cantidad; i++) {
        productos.push(generarCombinacion())
    }
    return productos
}
const productosFaker = generarData(5)

/*----------------------------------------------*/
const getMessages = async () => {
    return await mensajesFirebase.getMessages();
};
/*----------------------------------------------*/

io.on("connection", async (socket) => {

    console.log("¡Nuevo cliente conectado!");

    const listaProductos = await productosFaker
    socket.emit("productoDesdeElServidor", listaProductos) //nombre del evento + data

    const mensajes = await getMessages()
	socket.emit('mensajeDesdeElServidor', mensajes)

    console.log(usuario);
    socket.emit('loginUsuario' , usuario)

    socket.on("mensajeDesdeElCliente", async (data) => {
        await mensajesFirebase.saveMessages(data)
        const mensajes = await getMessages()
        io.sockets.emit("mensajeDesdeElServidor", mensajes);
    });
});
/*----------------------------------------------*/

app.use("/static", express.static("public"));

const PORT = 8080
const connectedServer = httpServer.listen(PORT, () => {
    console.log(`Servidor Http con Websockets escuchando en el puerto ${connectedServer.address().port}`)
})
connectedServer.on('error', error => console.log(`Error en el servidor ${error}`))



