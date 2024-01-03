const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const OpenAI = require("openai");
//conexion con OpenAi
const openai = new OpenAI({
  apiKey: "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"
});




const app = express().use(bodyParser.json());
//token de api de messenger
const PAGE_ACCESS_TOKEN = 'EAAExju54ngQBO0qlbzXjDpWDZAro9UwGImLNWDLVFObBiQJD48IX2fqMDvnK6XX0kvgd4pMxRGq8TVvcNIQ4mAIcpLMXz6cDGEAzj8MA1xreWI8lo2KsgOrgkEr29AHMZCHiKYOzK76KF47ZCUWk8fnm2o9QxR1RLWzAZCh0TI7ng0paYs0S2JxgnvG8CikB';

//Purta de coneccion con la Api de Facebook
app.post('/webhook', (req, res) =>{
    console.log('POST: webhook');
    const body = req.body;

    if(body.object === 'page'){
    
        body.entry.forEach(entry => {
            // recibir mensaje y id de mensaje
            const webhookEvent = entry.messaging[0];
            const sender_psid = webhookEvent.sender.id;

            //validar que se este recibiendo Mensajes
            if(webhookEvent.message){
                handleMessage(sender_psid, webhookEvent.message);
            }
 
        });

        res.status(200).send('EVENTO RECIBIDO');
    }else{
        res.sendStatus(404);
    }
});

//Autentificacion con Facebook Api
app.get('/webhook', (req, res) =>{
    const VERIFY_TOKEN = '232lflkdlplvstrka24'; 

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if(mode && token){
        if(mode === 'subscribe' && token === VERIFY_TOKEN){
            console.log('Logeado con exito!');
            res.status(200).send(challenge);
        }else{
            res.sendStatus(404);
        }
    }else{
        res.sendStatus(404);
    }
});



//Creacion de Mensajes
function handleMessage(sender_psid, received_message) {
    let response;
    //funcion para conectar con openAI
    const openFun=async()=>{
        var data = require('./datos');
        const chatCompletion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {"role": "system", "content": data.base},
                {"role": "user", "content": received_message.text,}
            ],
            max_tokens:100
          });
          
          
          response = {
            'text' : chatCompletion.choices[0].message.content
         }
    
          callSendAPI(sender_psid, response)
    }
    

    if (received_message.text) {
        openFun();
    }else if(received_message.attachments){
        response = {'text': 'Solo puede comunicarse con nosotros mediante Texto'};
    };
}

//Envio de datos mediante Api
function callSendAPI(sender_psid, response) {
    let requestBody = {
        'recipient' : {
            'id' : sender_psid
        },
        'message': response
    }

    request({
        'uri' : 'https://graph.facebook.com/v18.0/me/messages',
        'qs'  :{'access_token' : PAGE_ACCESS_TOKEN},
        'method' : 'POST',
        'json' : requestBody
    }, (err, res, body)=>{
         if(!err){
            console.log('se Envio')
         }else{
            console.log('Fallo de envio')
         }
    })
}


//Mensaje de integracion
app.get('/', (req, res) => {
    res.status(200).send('Hola a mi bot!')
})

app.listen(3000, () =>{
    console.log('Servidor iniciado...');
});
