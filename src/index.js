const express = require("express")
const cors = require("cors")
const { v4: uuidv4 } = require("uuid")
const app = express()


app.use(cors())
app.use(express.json())

const friends = []

// funções que não precisam estar dentro das rotas
function pairs(names) {
    const _pairs = [];
    // Copia o array para que as alterações dentro da função não sejam
    // refletidas no array original fora da função (evita efeito colateral)
    const _names = [...names];

    // Associa cada nome com seu sucessor e o último com o primeiro
    for (let i = 0; i < _names.length; i++) {
        _pairs.push([_names[i], _names[(i != _names.length - 1) ? i + 1 : 0]]);
    }
    return _pairs;
}

function shuffleArray(arr) {
    // Loop em todos os elementos
    for (let i = arr.length - 1; i > 0; i--) {
        // Escolhendo elemento aleatório
        const j = Math.floor(Math.random() * (i + 1));
        // Reposicionando elemento
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Retornando array com aleatoriedade
    return arr;
}



// middleware
function checkExistGroup(request, res, next) {
    const { grupo } = request.headers
    const group = friends.find(group => group.nameGroup === grupo)

    if (!group) {
        return res.status(404).json({ error: "Group Not Found" })
    }
    request.nameGroup = group
    return next()
}

function checkAdm(req, res, next){
    const {adm} = req.headers
    const admGroup = friends.some(group => group.adm === adm)
    if (!admGroup) {
        return res.status(404).json({ error: "ADM Not Found" })
    }
    req.adm = admGroup
    return next()
}

app.post("/jogo", (req, res) => {
    const { nameGroup, adm, deadline, description } = req.body
    const autenticarGroup = friends.some(group => group.nameGroup === nameGroup)

    if (autenticarGroup) {
        return res.status(400).json({ error: "Group Exists" })
    }
    const group = {
        id: uuidv4(),
        sorteio: false,
        nameGroup,
        adm,
        deadline: new Date(deadline),
        description,
        secret: [],
        participantes: null
    }
    const {sorteio} = group
    const descriptionGroup = {
        sorteio,
        nameGroup,
        adm,
        deadline,
        description
    }
    friends.push(group)
    return res.status(201).json(descriptionGroup)
})

app.get("/jogo", checkExistGroup, (request, response) => {
    const { nameGroup } = request
    const {sorteio, adm, description, deadline} = nameGroup
    const descriptionGroup = {
        sorteio,
        nameGroup:nameGroup.nameGroup,
        adm,
        deadline,
        description
    }
    return response.json(descriptionGroup)
})

app.get("/participantes", checkExistGroup, (request, res) => {
    const { nameGroup } = request
    return res.json(nameGroup.secret)
})
app.post("/participantes", checkExistGroup, (request, res) => {
    const { name, lastName, login } = request.body
    const { nameGroup } = request

    const checkExistParticipant = nameGroup.secret.find(p => {
        return p.login === login
    })
    if (checkExistParticipant) {
        return res.json({ erro: "Participante ja confirmado" })
    }

    const participants = {
        id: uuidv4(),
        name,
        lastName,
        fullName: `${name} ${lastName}`,
        login
    }
    nameGroup.secret.push(participants)
    return res.json(participants)
})

// apenas o adm pode realizar o sorteio-fazer algo para pegar o adm pelo headers
app.post("/sorteio", checkExistGroup,checkAdm, (request, response) => {
    const {adm} = request
    const { nameGroup } = request
    const lista = nameGroup.secret
    
    if(lista.length <= 2){
        return response.status(404).json({error:"Não tem participantes suficientes para realizar o sorteio"})
    }

    if (nameGroup.sorteio) {
        return response.status(404).json({ error: "sorteio ja realizado" })
    }
    if(!adm){
        return response.status(404).json({error: "Necessário ser adm do grupo para realizar sorteio."})
    }
    const sortidos = lista.map(n => n.fullName)
    const sorteio = pairs(shuffleArray(sortidos))
    nameGroup.sorteio = true
    console.log(sorteio)
    nameGroup.participantes = sorteio
    return response.send("Sorteio realizado")

})

app.get("/tirei", checkExistGroup, (request, response) => {
    const {full} = request.headers
    const { nameGroup } = request
    console.log(full)
    
    const auntenticLogin = nameGroup.secret.find(lg => lg.fullName === full)
    if(!auntenticLogin){
        return response.status(404).json({error:"Participante not found"})
    }

    const myFriendFileiraOne = nameGroup.participantes.map(filaOne => filaOne[0])
    console.log("ONNE ", myFriendFileiraOne)
    const myFriendFileiraTwo = nameGroup.participantes.map(filaTwo => filaTwo[1])
    console.log(myFriendFileiraTwo)
    const index = myFriendFileiraOne.indexOf(full)
    console.log(index)
    console.log("Lista length",nameGroup.participantes.length -1)
    if(index == nameGroup.participantes.length -1){
        console.log("Lista length",nameGroup.participantes.length -1)
        const myFriend = myFriendFileiraTwo[myFriendFileiraTwo.length-1]

        return response.json(myFriend)
        //console.log(myFriendFileiraTwo[myFriendFileiraTwo.length-1])

    }else{
        const myFriend = myFriendFileiraOne[index +1]
        return response.json(myFriend)
        //console.log(myFriendFileiraOne[index +1])
    }
    
})

app.listen(3000, ()=> {
    console.log("Server ok na porta 3000")
})