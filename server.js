const express = require("express");
const fs = require("fs");
const app = express();
//const PORT = 80;
const PORT = 3000;
const path = require("path");
const webpush = require("web-push");
const bodyParser = require('body-parser');

const publicVapidKey = "BKeVtfvG8z_xW00aacQWOvpzph5FgbHiFh1if2jDo0HMnHclTHvVaSqgy4yIUCogviHrUA_jxg9uiHfp28BpefQ";
const privateVapidKey = "ttKtlTVnWaaFaFQTM8s_1VIwHVLMi_eNU4pMMZAjRgs";

webpush.setVapidDetails(
    "mailto:heloisabbarbosasilva@email.com",
    publicVapidKey,
    privateVapidKey
);

let subscriptions = []; 

app.post("/subscribe", (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({ message: "Inscrito com sucesso!" });
});

app.post("/notificar", async (req, res) => {
    const payload = JSON.stringify({
        title: "🎵 Repertório salvo com sucesso!",
        body: "Novo repertório foi adicionado.",
        //icon: "/assets/icon.png"
    });

    try {
        const sendResults = await Promise.all(
            subscriptions.map(sub =>
                webpush.sendNotification(sub, payload).catch(err => console.error("Erro ao enviar:", err))
            )
        );
        res.status(200).json({ message: "Notificações enviadas", detalhes: sendResults });
    } catch (error) {
        console.error("Erro ao notificar:", error);
        res.status(500).json({ error: "Erro ao enviar notificações" });
    }
});


app.use(express.json()); 
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login", "login.html"));
});

app.use("/assets", express.static(path.join(__dirname, "login", "assets")));
app.use(express.static(__dirname)); 

app.post("/login", (req, res) => {
    const { login, password } = req.body;

    fs.readFile("users.json", "utf8", (err, data) => {
        if (err) {
            return res.status(500).json({ message: "Erro no servidor" });
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.login === login && u.password === password);

        if (user) {
            res.json({ success: true });
        } else {
            res.status(401).json({ message: "Login ou senha inválidos" });
        }
    });
});

app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Rota para salvar a música no arquivo JSON
app.post("/salvar-musica", (req, res) => {
    const novaMusica = req.body;

    const nomeNormalizado = novaMusica.nome.trim().toLowerCase();

    fs.readFile("form.json", "utf8", (err, data) => {
        if (err && err.code !== "ENOENT") { 
            return res.status(500).json({ error: "Erro ao ler arquivo" });
        }
        
        let musicas = { totalMusicas: 0, lista: [] };

        if (data) {
            try {
                musicas = JSON.parse(data);
            } catch (error) {
                return res.status(500).json({ error: "Erro ao processar JSON" });
            }
        }

        const existe = musicas.lista.some(musica =>
            musica.nome.trim().toLowerCase() === nomeNormalizado
        );

        if (existe) {
            return res.status(400).json({ message: "Essa música já está no repertório!" });
        }

        musicas.lista.unshift(novaMusica);
        musicas.totalMusicas = musicas.lista.length;

        fs.writeFile("form.json", JSON.stringify(musicas, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Erro ao salvar arquivo" });
            res.status(200).json({ message: "Música salva com sucesso!", total: musicas.totalMusicas });
        });
    });
});



// rota para salvar repertórios no rep.json
app.post("/salvar-repertorio", (req, res) => {
    const novoRepertorio = req.body;

    if (!novoRepertorio.nome || !novoRepertorio.data || !Array.isArray(novoRepertorio.musicas)) {
        return res.status(400).json({ error: "Dados inválidos!" });
    }

    const nomeNormalizado = novoRepertorio.nome.trim().toLowerCase();

    fs.readFile("rep.json", "utf8", (err, data) => {
        let jsonData;

        if (!err && data.trim()) {
            try {
                jsonData = JSON.parse(data);
                if (!jsonData || typeof jsonData !== "object" || !Array.isArray(jsonData.repertorios)) {
                    jsonData = { listaRepertorios: 0, repertorios: [] };
                }
            } catch (error) {
                console.error("⚠️ Erro ao processar JSON:", error);
                jsonData = { listaRepertorios: 0, repertorios: [] };
            }
        } else {
            jsonData = { listaRepertorios: 0, repertorios: [] };
        }

        const existe = jsonData.repertorios.some(rep => rep.nome.trim().toLowerCase() === nomeNormalizado);

        if (existe) {
            return res.status(400).json({ error: "Já existe um repertório com esse nome!" });
        }

        // push - final / unshift - inicio
        jsonData.repertorios.unshift(novoRepertorio);
        jsonData.listaRepertorios = jsonData.repertorios.length;

        console.log("📝 Antes de salvar, JSON será:", JSON.stringify(jsonData, null, 4));

        fs.writeFile("rep.json", JSON.stringify(jsonData, null, 4), (err) => {
            if (err) {
                console.error("❌ Erro ao salvar JSON:", err);
                return res.status(500).json({ error: "Erro ao salvar repertório" });
            }
            console.log("✅ JSON atualizado com sucesso!");
            res.status(200).json({ message: "Repertório salvo com sucesso!", total: jsonData.listaRepertorios });
        });
    });
});






// Carregar repertórios do rep.json
app.get("/repertorios", (req, res) => {
    fs.readFile("rep.json", "utf8", (err, data) => {
        if (err) {
            console.error("Erro ao ler rep.json:", err);
            return res.status(500).json({ message: "Erro ao carregar repertórios" });
        }

        try {
            const jsonData = JSON.parse(data);
            
            if (!jsonData.repertorios || !Array.isArray(jsonData.repertorios)) {
                return res.status(500).json({ message: "Formato inválido de repertórios" });
            }

            res.json(jsonData);
        } catch (parseErr) {
            console.error("Erro ao parsear JSON:", parseErr);
            res.status(500).json({ message: "Erro ao processar dados do repertório" });
        }
    });
});


// excluir rep.json
const caminhoArquivo  = path.join(__dirname, "rep.json");

app.delete("/remover-repertorio", (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.json({ sucesso: false, erro: "Nome do repertório não fornecido." });
    }

    fs.readFile(caminhoArquivo, "utf8", (err, data) => {
        if (err) {
            console.error("Erro ao ler o arquivo JSON:", err);
            return res.json({ sucesso: false, erro: "Erro ao acessar o banco de dados." });
        }

        let jsonData = JSON.parse(data);
        const indexRepertorio = jsonData.repertorios.findIndex(rep => rep.nome === nome);

        if (indexRepertorio === -1) {
            return res.json({ sucesso: false, erro: "Repertório não encontrado." });
        }

        jsonData.repertorios.splice(indexRepertorio, 1);

        jsonData.listaRepertorios = jsonData.repertorios.length;

        fs.writeFile(caminhoArquivo, JSON.stringify(jsonData, null, 4), (err) => {
            if (err) {
                console.error("Erro ao salvar as alterações:", err);
                return res.json({ sucesso: false, erro: "Erro ao excluir repertório." });
            }

            res.json({ sucesso: true });
        });
    });
});



// Editar repertório no rep.json
app.put("/editar-repertorio", (req, res) => {
    const { nomeAntigo, novoNome, novaData, musicas, observacoes } = req.body;

    fs.readFile("rep.json", "utf8", (err, data) => {
        if (err) {
            console.error("❌ Erro ao ler o arquivo:", err);
            return res.status(500).json({ sucesso: false, erro: "Erro ao ler o arquivo JSON." });
        }

        let jsonData;
        try {
            jsonData = JSON.parse(data);
        } catch (e) {
            return res.status(500).json({ sucesso: false, erro: "Erro ao processar o JSON." });
        }

        if (!jsonData.repertorios || !Array.isArray(jsonData.repertorios)) {
            return res.status(500).json({ sucesso: false, erro: "Formato inválido do JSON." });
        }

        let repertorioIndex = jsonData.repertorios.findIndex(rep => rep.nome === nomeAntigo);

        if (repertorioIndex === -1) {
            return res.status(404).json({ sucesso: false, erro: "Repertório não encontrado." });
        }

        if (novoNome && jsonData.repertorios.some((rep, index) => index !== repertorioIndex && rep.nome === novoNome)) {
            return res.status(400).json({ sucesso: false, erro: "Já existe um repertório com esse nome." });
        }

        let repertorio = jsonData.repertorios[repertorioIndex];

        console.log("📌 Antes da edição:", JSON.stringify(repertorio, null, 2));

        repertorio.nome = novoNome || repertorio.nome;
        repertorio.data = novaData || repertorio.data;

        if (Array.isArray(musicas)) {
            repertorio.musicas = musicas.filter(musica => musica.nome.trim() !== "");
        }

        repertorio.observacoes = observacoes !== undefined ? observacoes : repertorio.observacoes;

        console.log("✅ Depois da edição:", JSON.stringify(repertorio, null, 2));

        jsonData.listaRepertorios = jsonData.repertorios.length || 0;

        fs.writeFile("rep.json", JSON.stringify(jsonData, null, 4), err => {
            if (err) {
                console.error("❌ Erro ao salvar a edição:", err);
                return res.status(500).json({ sucesso: false, erro: "Erro ao salvar a edição no arquivo JSON." });
            }
            res.json({ sucesso: true, repertorioAtualizado: repertorio });
        });
    });
});





// 📌 Rota para obter a quantidade de repertórios
app.get("/quantidade-repertorios", (req, res) => {
    fs.readFile("rep.json", "utf8", (err, data) => {
        if (err || !data.trim()) {
            return res.json({ totalRepertorios: 0 }); 
        }

        try {
            const repertorios = JSON.parse(data);
            res.json({ totalRepertorios: repertorios.listaRepertorios || 0 });
        } catch (error) {
            res.status(500).json({ error: "Erro ao processar JSON" });
        }
    });
});

// 📌 Rota para obter a quantidade de músicas
app.get("/quantidade-musicas", (req, res) => {
    fs.readFile("form.json", "utf8", (err, data) => {
        if (err || !data.trim()) {
            return res.json({ totalMusicas: 0 }); 
        }

        try {
            const musicas = JSON.parse(data);
            res.json({ totalMusicas: musicas.totalMusicas || 0 });
        } catch (error) {
            res.status(500).json({ error: "Erro ao processar JSON" });
        }
    });
});

// 📌 Rota para obter todas as musicas 
app.get("/repertorio", (req, res) => {
    fs.readFile("form.json", "utf8", (err, data) => {
        if (err || !data.trim()) {
            return res.json({ lista: [] }); 
        }

        try {
            const musicas = JSON.parse(data);
            res.json({ lista: musicas.lista || [] });
        } catch (error) {
            res.status(500).json({ error: "Erro ao processar JSON" });
        }
    });
});

// Rota para remover uma música do repertório
app.delete("/remover-musica", (req, res) => {
    const { nome } = req.body; 

    fs.readFile("form.json", "utf8", (err, data) => {
        if (err || !data.trim()) {
            return res.status(500).json({ error: "Erro ao ler o arquivo" });
        }

        try {
            let musicas = JSON.parse(data);
            const listaAntiga = musicas.lista.length;

            musicas.lista = musicas.lista.filter(musica => musica.nome !== nome);
            musicas.totalMusicas = musicas.lista.length; 
            if (musicas.lista.length === listaAntiga) {
                return res.status(404).json({ error: "Música não encontrada" });
            }

            fs.writeFile("form.json", JSON.stringify(musicas, null, 2), (err) => {
                if (err) return res.status(500).json({ error: "Erro ao salvar as alterações" });

                res.json({ message: "Música removida com sucesso!", total: musicas.totalMusicas });
            });

        } catch (error) {
            res.status(500).json({ error: "Erro ao processar JSON" });
        }
    });
});

// Rota para editar música
app.put("/editar-musica", (req, res) => {
    const { nomeAntigo, nome, cantor, tom, youtube } = req.body;
    console.log("📥 Recebendo solicitação para editar música...");
    console.log("🔍 Nome Antigo:", nomeAntigo);
    console.log("✏️ Novo Nome:", nome);
    console.log("🎤 Cantor:", cantor);
    console.log("🎼 Tom:", tom);
    console.log("▶️ YouTube:", youtube);

    fs.readFile("form.json", "utf8", (err, data) => {
        if (err || !data.trim()) {
            console.error("❌ Erro ao ler o arquivo:", err);
            return res.status(500).json({ error: "Erro ao ler arquivo" });
        }

        let musicas;
        try {
            musicas = JSON.parse(data);
            console.log("📄 Arquivo carregado com sucesso!");
        } catch (parseError) {
            console.error("❌ Erro ao parsear JSON:", parseError);
            return res.status(500).json({ error: "Erro ao processar arquivo" });
        }

        console.log("🔎 Buscando música para edição...");
        let musica = musicas.lista.find(m => m.nome === nomeAntigo);

        if (!musica) {
            console.warn("⚠️ Música não encontrada:", nomeAntigo);
            return res.status(404).json({ error: "Música não encontrada" });
        }

        console.log("✅ Música encontrada! Atualizando informações...");
        musica.nome = nome;
        musica.cantor = cantor;
        musica.tom = tom;
        musica.youtube = youtube;

        console.log("💾 Salvando alterações...");
        fs.writeFile("form.json", JSON.stringify(musicas, null, 2), err => {
            if (err) {
                console.error("❌ Erro ao salvar edição:", err);
                return res.status(500).json({ error: "Erro ao salvar edição" });
            }
            console.log("✅ Música editada com sucesso!");
            res.json({ message: "Música editada com sucesso!" });
        });
    });
});


// adicionar em sugestoes.json
app.post("/adicionar-sugestao", (req, res) => {
    const novaSugestao = req.body;

    fs.readFile("sugestoes.json", "utf8", (err, data) => {
        let sugestoes = [];
        if (!err && data) {
            try {
                sugestoes = JSON.parse(data);
            } catch (error) {
                return res.status(500).json({ error: "Erro ao processar JSON de sugestões" });
            }
        }

        sugestoes.push(novaSugestao);

        fs.writeFile("sugestoes.json", JSON.stringify(sugestoes, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Erro ao salvar sugestão" });
            res.json({ message: "Sugestão adicionada com sucesso!" });
        });
    });
});

// Listar sugestões pendentes
app.get("/sugestoes", (req, res) => {
    fs.readFile("sugestoes.json", "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Erro ao carregar sugestões" });

        let sugestoes = [];
        if (data) {
            try {
                sugestoes = JSON.parse(data);
            } catch (error) {
                return res.status(500).json({ error: "Erro ao processar JSON de sugestões" });
            }
        }

        res.json(sugestoes);
    });
});

// Aprovar sugestão (mover para form.json)
app.post("/aprovar-sugestao", (req, res) => {
    const { nome } = req.body;

    fs.readFile("sugestoes.json", "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Erro ao ler sugestões" });

        let sugestoes = JSON.parse(data);
        const sugestaoAprovada = sugestoes.find(s => s.nome === nome);

        if (!sugestaoAprovada) {
            return res.status(404).json({ error: "Sugestão não encontrada" });
        }

        sugestoes = sugestoes.filter(s => s.nome !== nome);
        fs.writeFile("sugestoes.json", JSON.stringify(sugestoes, null, 2), () => { });

        fs.readFile("form.json", "utf8", (err, data) => {
            let form = { totalMusicas: 0, lista: [] };
            if (!err && data) {
                try {
                    form = JSON.parse(data);
                } catch (error) {
                    return res.status(500).json({ error: "Erro ao processar JSON do repertório" });
                }
            }

            form.lista.push(sugestaoAprovada);
            form.totalMusicas = form.lista.length;

            fs.writeFile("form.json", JSON.stringify(form, null, 2), (err) => {
                if (err) return res.status(500).json({ error: "Erro ao aprovar sugestão" });
                res.json({ message: "Sugestão aprovada e adicionada ao repertório!" });
            });
        });
    });
});

// Recusar sugestão (remover do json)
app.post("/recusar-sugestao", (req, res) => {
    const { nome } = req.body;

    fs.readFile("sugestoes.json", "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Erro ao ler sugestões" });

        let sugestoes = JSON.parse(data);
        sugestoes = sugestoes.filter(s => s.nome !== nome);

        fs.writeFile("sugestoes.json", JSON.stringify(sugestoes, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Erro ao remover sugestão" });
            res.json({ message: "Sugestão recusada!" });
        });
    });
});


// estatisticas
function extrairNomeBase(nome) {
    return nome.split("-")[0].split("(")[0].trim().toLowerCase();
}

// Função para analisar repertórios - estatisticas
function analisarRepertorios() {
    try {
        const data = fs.readFileSync('rep.json', 'utf8');
        const json = JSON.parse(data);

        const repertorios = json.repertorios || [];
        if (!Array.isArray(repertorios)) {
            throw new Error("O campo 'repertorios' não é um array válido.");
        }

        repertorios.sort((a, b) => new Date(a.data) - new Date(b.data));

        let historicoRecentes = []; 
        let totalMusicasGeral = 0;
        let totalRepetidasGeral = 0;

        const analiseIndividual = repertorios.map(rep => {
            let repetidas = 0;
            let musicasRepetidas = []; 

            rep.musicas.forEach(musica => {
                let nomeBase = extrairNomeBase(musica.nome);

                let repertoriosOrigem = historicoRecentes
                    .filter(hist => hist.musicas.some(m => extrairNomeBase(m.nome) === nomeBase))
                    .map(hist => hist.nome); 

                if (repertoriosOrigem.length > 0) {
                    repetidas++;
                    musicasRepetidas.push({
                        nome: musica.nome,
                        origem: repertoriosOrigem
                    });
                }
            });

            let taxaRepeticao = (repetidas / rep.musicas.length) || 0; 
            let status = taxaRepeticao > 0.5 ? "Repetitivo" :
                         taxaRepeticao > 0.2 ? "Moderado" : "Variado";

            totalMusicasGeral += rep.musicas.length;
            totalRepetidasGeral += repetidas;

            historicoRecentes.push(rep);
            if (historicoRecentes.length > 2) {
                historicoRecentes.shift(); 
            }

            return {
                nome: rep.nome,
                data: rep.data,
                totalMusicas: rep.musicas.length,
                repetidas,
                taxaRepeticao: (taxaRepeticao * 100).toFixed(1) + "%", 
                status,
                repetidasDetalhes: musicasRepetidas 
            };
        });

        let taxaMediaRepeticao = totalMusicasGeral > 0 ? (totalRepetidasGeral / totalMusicasGeral) : 0;
        let statusGeral = taxaMediaRepeticao > 0.5 ? "Repetitivo" :
                          taxaMediaRepeticao > 0.2 ? "Moderado" : "Variado";

        const estatisticaGeral = {
            totalRepertorios: repertorios.length,
            totalMusicas: totalMusicasGeral,
            totalRepetidas: totalRepetidasGeral,
            taxaRepeticao: (taxaMediaRepeticao * 100).toFixed(1) + "%", 
            statusGeral
        };

        fs.writeFileSync('analise_repertorios.json', JSON.stringify({ estatisticaGeral, analiseIndividual }, null, 4));
    } catch (error) {
        console.error("⚠️ Erro ao analisar repertórios:", error.message);
    }
}


// rota para fornecer as estatisticas
app.get('/estatisticas', (req, res) => {
    analisarRepertorios();

    try {
        const dados = fs.readFileSync('analise_repertorios.json', 'utf8');

        if (!dados.trim()) {
            return res.json({ estatisticaGeral: null, analiseIndividual: [] }); 
        }

        const { estatisticaGeral, analiseIndividual } = JSON.parse(dados);

        const estatisticasFormatadas = analiseIndividual.map(rep => ({
            nome: rep.nome,
            data: rep.data,
            totalMusicas: rep.totalMusicas,
            repetidas: rep.repetidas,
            taxaRepeticao: rep.taxaRepeticao,
            status: rep.status,
            repetidasDetalhes: rep.repetidasDetalhes.map(musica => ({
                nome: musica.nome,
                origem: Array.isArray(musica.origem) ? musica.origem.join(', ') : musica.origem
            }))
        }));

        res.json({ estatisticaGeral, analiseIndividual: estatisticasFormatadas });

    } catch (error) {
        console.error("⚠️ Erro ao ler analise_repertorios.json:", error);
        res.status(500).json({ error: "Erro ao carregar estatísticas" });
    }
});




// Rota para obter os blocos
app.get("/blocos", (req, res) => {
    fs.readFile("blocos.json", "utf8", (err, data) => {
        if (err || !data) return res.json([]);
        try {
            const blocos = JSON.parse(data);
            res.json(blocos);
        } catch (error) {
            res.status(500).json({ error: "Erro ao processar JSON de blocos" });
        }
    });
});

// Rota para adicionar um novo bloco
app.post("/adicionar-bloco", (req, res) => {
    const { nome, musicas } = req.body;

    if (!nome) {
        return res.status(400).json({ error: "O nome do bloco é obrigatório!" });
    }

    if (!Array.isArray(musicas)) {
        return res.status(400).json({ error: "A lista de músicas deve ser um array!" });
    }

    fs.readFile("blocos.json", "utf8", (err, data) => {
        let blocos = [];
        if (!err && data) {
            try {
                blocos = JSON.parse(data);
            } catch (error) {
                return res.status(500).json({ error: "Erro ao processar JSON de blocos" });
            }
        }

        const blocoExistente = blocos.find(bloco => bloco.nome.toLowerCase() === nome.toLowerCase());
        if (blocoExistente) {
            return res.status(400).json({ error: "Esse bloco já existe!" });
        }

        const novoBloco = {
            nome,
            musicas: musicas.map(musica => ({
                nome: musica.nome || "Música sem nome",
                link: musica.link || ""
            }))
        };

        blocos.unshift(novoBloco);

        fs.writeFile("blocos.json", JSON.stringify(blocos, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Erro ao salvar o bloco" });
            res.json({ message: "Bloco adicionado com sucesso!", bloco: novoBloco });
        });
    });
});


// Rota para remover um bloco
app.post("/remover-bloco", (req, res) => {
    const { nome } = req.body;

    if (!nome) {
        return res.status(400).json({ error: "O nome do bloco é obrigatório para exclusão!" });
    }

    fs.readFile("blocos.json", "utf8", (err, data) => {
        if (err || !data) return res.status(500).json({ error: "Erro ao acessar os blocos" });

        let blocos;
        try {
            blocos = JSON.parse(data);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao processar JSON de blocos" });
        }

        const blocoIndex = blocos.findIndex(bloco => bloco.nome.toLowerCase() === nome.toLowerCase());

        if (blocoIndex === -1) {
            return res.status(404).json({ error: "Bloco não encontrado" });
        }

        // Remove o bloco encontrado
        const blocoRemovido = blocos.splice(blocoIndex, 1)[0];

        fs.writeFile("blocos.json", JSON.stringify(blocos, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Erro ao salvar mudanças" });
            res.json({ message: "Bloco removido com sucesso!", blocoRemovido });
        });
    });
});


// Rota para editar um bloco
app.post("/editar-bloco", (req, res) => {
    const { nomeAntigo, novoNome, musicas } = req.body;

    if (!nomeAntigo || !novoNome) {
        return res.status(400).json({ error: "O nome do bloco é obrigatório para edição!" });
    }

    fs.readFile("blocos.json", "utf8", (err, data) => {
        if (err || !data) return res.status(500).json({ error: "Erro ao acessar os blocos" });

        let blocos;
        try {
            blocos = JSON.parse(data);
        } catch (error) {
            return res.status(500).json({ error: "Erro ao processar JSON de blocos" });
        }

        const blocoIndex = blocos.findIndex(bloco => bloco.nome.toLowerCase() === nomeAntigo.toLowerCase());

        if (blocoIndex === -1) {
            return res.status(404).json({ error: "Bloco não encontrado" });
        }

        blocos[blocoIndex].musicas = Array.isArray(musicas)
        ? musicas
            .filter(m => m.nome || m.link)
            .map(musica => ({
                nome: musica.nome || "",
                link: musica.link || ""
            }))
        : [];

        fs.writeFile("blocos.json", JSON.stringify(blocos, null, 2), (err) => {
            if (err) return res.status(500).json({ error: "Erro ao salvar mudanças" });
            res.json({ message: "Bloco editado com sucesso!", blocoEditado: blocos[blocoIndex] });
        });
    });
});


//baixar musicas / download
app.get("/baixar-musicas", (req, res) => {
    fs.readFile("form.json", "utf8", (err, data) => {
        if (err) {
            return res.status(500).send("Erro ao ler as músicas.");
        }

        let musicas;
        try {
            musicas = JSON.parse(data);
        } catch (parseErr) {
            return res.status(500).send("Erro ao processar o JSON.");
        }

        let texto = "";
        musicas.lista.forEach((musica, index) => {
            texto += `${index + 1}. ${musica.nome} - ${musica.cantor} | Tom: ${musica.tom}\n`;
        });

        res.setHeader("Content-Disposition", "attachment; filename=lista-musicas.txt");
        res.setHeader("Content-Type", "text/plain");
        res.send(texto);
    });
});





app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

// http://localhost: