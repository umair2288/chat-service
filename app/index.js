//  HTTP

const crypto = require('crypto');
const express = require('express')
const http = require('http')
const jsonParser = require('body-parser').json()


const HOST =  "0.0.0.0"
const PORT  = "80"


var app = express()
var chatServices = []
const content = require('fs').readFileSync(__dirname + '/index.html', 'utf8');



function get_service(service_hash_key){
    const serviceIndex = chatServices.findIndex(({service_hash}) => service_hash == service_hash_key)
    if (serviceIndex === -1){     
        throw Error("Service not found!!")
       
    }
    
    return chatServices[serviceIndex]
}
    


app.get('/',(req,res)=>{
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Length', Buffer.byteLength(content));
    res.end(content);
})


app.get('/services/', (req , res)=>{
    res.send(chatServices)
})

app.post('/services/', (req , res)=>{
    const service_hash = crypto.createHash('sha256').update(Math.random()+Date()).digest('hex')
    
  
    const chatService = {
        service_hash,
        created_at : new Date().toISOString(),
        last_message_at : new Date().toISOString()
    }

    chatServices.push(chatService)

    res.send(chatService)
})


app.get('/services/:serviceId', (req , res)=>{
    console.log(req.params)
    const serviceIndex = chatServices.findIndex(service => service.id == req.params.serviceId)
    console.log(serviceIndex)
    if (serviceIndex === -1){     
        res.status(404).send("Service not found")        
    }
    res.send(chatServices[serviceIndex])
})


app.post('/services/:service_hash/send', jsonParser ,(req , res)=>{
    try{
        
        const service = get_service(req.params.service_hash)
        if (service.socket){
            service.socket.send(req.body.message)
            service["last_message_at"] = new Date().toISOString()
            return res.send("success")
        }else{     
            return res.status(404).send("web socket connection not registered")
        }
             
    }
    catch(err){     
        return res.status(404).send("service not found")
    }

     
})



httpServer = http.createServer(app)

httpServer.listen(PORT,HOST,()=>{
    console.log("running on " + HOST + ":" + PORT)
})



//WS
const io = require('socket.io')(httpServer)

io.on("connection" , socket => {
    
    socket.send("ws connection established!! : from server")
    
    socket.on("message" , message =>{
        console.log(message)
    })

    socket.on("register",(service_hash)=>{
        try{
            const chatService  = get_service(service_hash)
            chatService["socket"] = socket
            socket.on("message",message=>{
                console.log("message from client " + service_hash + " : " + message)
            })
        }catch(err){
            socket.disconnet(true)
        }
        
    })

})