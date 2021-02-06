//  HTTP
const crypto = require('crypto');
const express = require('express')
const http = require('http')
const jsonParser = require('body-parser').json()

var app = express()

var chatServices = []
const content = require('fs').readFileSync(__dirname + '/index.html', 'utf8');

var wsConnection = null

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
    
    wsConnection.on(service_hash, (message) => {
        console.log("message received from client  " + service_hash)
        console.log("message:" + message)
    })

    const chatService = {
        service_hash,
        created_at : new Date().toISOString(),
        last_message_time : new Date().toISOString()
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
    const serviceIndex = chatServices.findIndex(({service_hash}) => service_hash == req.params.service_hash)
    if (serviceIndex === -1){     
        res.status(404).send("Service not found")   
        return      
    }
    
    const chatService = chatServices[serviceIndex]
    
    wsConnection.emit(chatService.service_hash, req.body.message)

    res.send("success")
})



httpServer = http.createServer(app)
httpServer.listen(5000,()=>{
    console.log("listening on 5000!")
})



//WS
const io = require('socket.io')(httpServer)

io.on("connection" , socket => {
    
    wsConnection = socket
    socket.send("ws connection established!! : from server")
    
    socket.on("message" , message =>{
        console.log(message)
    })

})