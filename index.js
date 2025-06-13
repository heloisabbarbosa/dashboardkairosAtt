const sideMenu = document.querySelector('aside');
const menuBtn = document.getElementById('menu-btn');
const closeBtn = document.getElementById('close-btn');
const darkMode = document.querySelector('.dark-mode');
const sidebarLinks = document.querySelectorAll(".sidebar a");
const pages = document.querySelectorAll(".page");

menuBtn.addEventListener('click', () => {
    sideMenu.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    sideMenu.style.display = 'none';
});

darkMode.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode-variables');
    darkMode.querySelector('span:nth-child(1)').classList.toggle('active');
    darkMode.querySelector('span:nth-child(2)').classList.toggle('active');
});

document.addEventListener("DOMContentLoaded", () => {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
            console.log("Permissão de notificação:", permission);
        });
    }
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        const registration = await navigator.serviceWorker.register("/service-worker.js");

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array("BKeVtfvG8z_xW00aacQWOvpzph5FgbHiFh1if2jDo0HMnHclTHvVaSqgy4yIUCogviHrUA_jxg9uiHfp28BpefQ")
        });

        await fetch("/subscribe", {
            method: "POST",
            body: JSON.stringify(subscription),
            headers: {
                "Content-Type": "application/json"
            }
        });
    });
}

// Função auxiliar para decodificar chave
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}


// login
document.addEventListener("DOMContentLoaded", function () {
    const isLoggedIn = localStorage.getItem("userLoggedIn");
    if (!isLoggedIn) {
        window.location.href = "/login/login.html";
        return;
    }

    const sidebarLinks = document.querySelectorAll(".sidebar a");
    const pages = document.querySelectorAll(".page");
    document.getElementById("dashboard").classList.add("active");

    sidebarLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            const sectionId = this.getAttribute("data-section");

            pages.forEach(page => page.classList.remove("active"));

            const sectionToShow = document.getElementById(sectionId);
            if (sectionToShow) {
                sectionToShow.classList.add("active");
            }

            sidebarLinks.forEach(link => link.classList.remove("active"));
            this.classList.add("active");
        });
    });

    const analyseDiv = document.querySelector(".analyse");
    if (analyseDiv) {
        analyseDiv.addEventListener("click", () => {
            window.location.href = "/baixar-musicas";
        });
    }
});




// Função para carregar os dados do JSON
async function carregarDados() {
    try {
        const response = await fetch('/quantidade-musicas'); 
        const data = await response.json(); 
        document.getElementById('quantidade-musicas').textContent = data.totalMusicas; 
    } catch (error) {
        console.error('Erro ao carregar os dados:', error);
    }
}

// Chamar a função quando a página carregar
document.addEventListener('DOMContentLoaded', carregarDados);

// Função para carregar a quantidade de repertórios dinamicamente
async function carregarRepertorios() {
    try {
        const response = await fetch('/quantidade-repertorios'); 
        const data = await response.json(); 
        document.getElementById('quantidade-repertorios').textContent = data.totalRepertorios; 
    } catch (error) {
        console.error('Erro ao carregar os repertórios:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarDados();       
    carregarRepertorios(); 
});


//carrega o form de add músicas
document.addEventListener("DOMContentLoaded", function () {
    const formContainer = document.getElementById("form-container");

    function loadForm() {
        if (!formContainer) return;

        fetch("addmusic.html")
            .then(response => {
                if (!response.ok) throw new Error("Erro ao carregar o formulário");
                return response.text();
            })
            .then(html => {
                formContainer.innerHTML = html;
                attachFormListener(); 
            })
            .catch(error => console.error("Erro ao carregar o formulário:", error));
    }

    function attachFormListener() {
        const form = document.querySelector(".form");

        if (!form) {
            console.error("Erro: Formulário não encontrado após carregar!");
            return;
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault(); 

            const formData = {
                nome: form.querySelector("input[placeholder='Nome']").value,
                cantor: form.querySelector("input[placeholder='Cantor']").value,
                tom: form.querySelector("input[placeholder='Escolha o tom...']").value,
                youtube: form.querySelector("input[placeholder='Link']").value
            };

            console.log("Dados capturados:", formData); // teste

            fetch("/salvar-musica", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                console.log("Resposta do servidor:", data);
                showAlert(data.message, "addmusic");
                form.reset();
            })
            .catch(error => console.error("Erro ao enviar os dados:", error));
        });
    }

    document.querySelectorAll(".sidebar a").forEach(link => {
        link.addEventListener("click", function (e) {
            if (this.getAttribute("data-section") === "addmusic") {
                loadForm();
            }
        });
    });

    if (document.getElementById("addmusic").classList.contains("active")) {
        loadForm();
    }
});



// Enviar dados form add músicas JSON
document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector(".form");

    if (!form) {
        console.error("Erro: Formulário não encontrado!");
        return;
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("Evento de submit acionado!");

        const formData = {
            nome: form.querySelector("input[placeholder='Nome']").value.trim().toLowerCase(),
            cantor: form.querySelector("input[placeholder='Cantor']").value.trim().toLowerCase(),
            tom: form.querySelector("input[placeholder='Escolha o tom...']").value,
            youtube: form.querySelector("input[placeholder='Link']").value
        };

        console.log("Dados capturados:", formData);

        try {
            const response = await fetch("/obter-musicas");
            const musicas = await response.json();

            const existe = musicas.some(musica => 
                musica.nome.trim().toLowerCase() === formData.nome.trim().toLowerCase()
            );            

            if (existe) {
                showAlert("Essa música já está no repertório!", "error");
                return;
            }

            const salvarResponse = await fetch("/salvar-musica", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await salvarResponse.json();
            console.log("Resposta do servidor:", data);
            showAlert(data.message, "addmusic");
            form.reset();
            carregarDados();
            
        } catch (error) {
            console.error("Erro ao verificar/enviar os dados:", error);
        }
    });
});



//lista musicas
let listaMusicas = []; 
let paginaAtual = 1;
const musicasPorPagina = 7;

function renderizarPagina() {
    const repertorioLista = document.querySelector("#lista-repertorio ul");
    if (!repertorioLista) {
        console.error("Elemento <ul> não encontrado dentro de #lista-repertorio");
        return;
    }

    repertorioLista.innerHTML = "";
    const inicio = (paginaAtual - 1) * musicasPorPagina;
    const fim = inicio + musicasPorPagina;
    const musicasPaginadas = listaMusicas.slice(inicio, fim);

    if (musicasPaginadas.length === 0) {
        repertorioLista.innerHTML = "<p>Nenhuma música disponível.</p>";
        return;
    }

    repertorioLista.innerHTML = musicasPaginadas.map(musica => {
        let infoMusica = `<strong>${musica.nome}</strong>`;
    
        if (musica.cantor) {
            infoMusica += ` - ${musica.cantor}`;
        }
    
        if (musica.tom) {
            infoMusica += ` (${musica.tom})`;
        }
    
        return `
            <li>
                <span>${infoMusica}</span>
                <div class="music-actions">
                    ${musica.youtube ? `<button class="youtube-button" onclick="window.open('${musica.youtube}', '_blank')">🎵</button>` : ""}
                    <button class="edit-button" data-nome="${musica.nome}" data-cantor="${musica.cantor || ''}" data-tom="${musica.tom || ''}" data-youtube="${musica.youtube || ''}">✏️</button>
                    <button class="delete-button" data-nome="${musica.nome}">🗑️</button>
                </div>
            </li>`;
    }).join("");    

    adicionarEventosBotoes();
    atualizarBotoesPaginacao();
}

// paginaçao musicas
function atualizarBotoesPaginacao() {
    const paginacaoContainer = document.getElementById("paginacao");
    paginacaoContainer.innerHTML = "";

    const totalPaginas = Math.ceil(listaMusicas.length / musicasPorPagina);

    if (totalPaginas > 1) {
        if (paginaAtual > 1) {
            paginacaoContainer.innerHTML += `
                <button id="anterior">
                    <span class="material-icons-sharp">chevron_left</span>
                </button>`;
        }
        if (paginaAtual < totalPaginas) {
            paginacaoContainer.innerHTML += `
                <button id="proximo">
                    <span class="material-icons-sharp">chevron_right</span>
                </button>`;
        }

        document.getElementById("anterior")?.addEventListener("click", function () {
            if (paginaAtual > 1) {
                paginaAtual--;
                renderizarPagina();
            }
        });

        document.getElementById("proximo")?.addEventListener("click", function () {
            if (paginaAtual < totalPaginas) {
                paginaAtual++;
                renderizarPagina();
            }
        });
    }
}
let musicaParaExcluir = null;
let musicaParaEditar = null;

// musicas lista - editar e excluir
document.addEventListener("DOMContentLoaded", function () {
    const repertorioContainer = document.getElementById("lista-repertorio");

    function loadRepertorio() {
        console.log("📥 Carregando repertório...");
        fetch("/repertorio")
            .then(response => response.json())
            .then(data => {
                listaMusicas = data.lista;
                console.log("🎵 Músicas carregadas com sucesso:", listaMusicas);
                paginaAtual = 1; 
                renderizarPagina();
                adicionarEventosBotoes();
            })
            .catch(error => console.error("❌ Erro ao carregar o repertório:", error));
    }

    document.getElementById("confirmar-excluir").addEventListener("click", function () {
        if (!musicaParaExcluir) {
            console.warn("⚠️ Nenhuma música selecionada para exclusão.");
            return;
        }

        console.log("🗑 Excluindo música:", musicaParaExcluir);
        fetch("/remover-musica", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: musicaParaExcluir })
        })
        .then(response => response.json())
        .then(data => {
            console.log("✅ Música excluída com sucesso!", data);
            loadRepertorio();
        })
        .catch(error => console.error("❌ Erro ao remover música:", error));

        document.getElementById("modal-confirmacao").style.display = "none";
    });

    document.getElementById("cancelar-excluir").addEventListener("click", function () {
        console.log("❌ Cancelando exclusão de música.");
        document.getElementById("modal-confirmacao").style.display = "none";
    });

    document.getElementById("salvar-edicao").addEventListener("click", function () {
        if (!musicaParaEditar) {
            console.warn("⚠️ Nenhuma música selecionada para edição.");
            return;
        }

        const musicaEditada = {
            nomeAntigo: musicaParaEditar,
            nome: document.getElementById("edit-nome").value,
            cantor: document.getElementById("edit-cantor").value,
            tom: document.getElementById("edit-tom").value,
            youtube: document.getElementById("edit-youtube").value
        };

        console.log("✏️ Editando música:", musicaEditada);
        fetch("/editar-musica", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(musicaEditada)
        })
        .then(response => {
            console.log("🔄 Recebendo resposta do servidor...");
            return response.json();
        })
        .then(data => {
            console.log("✅ Música editada com sucesso!", data);
            loadRepertorio();
        })
        .catch(error => console.error("❌ Erro ao editar música:", error));

        document.getElementById("modal-editar").style.display = "none";
    });

    document.getElementById("cancelar-edicao").addEventListener("click", function () {
        console.log("❌ Cancelando edição de música.");
        document.getElementById("modal-editar").style.display = "none";
    });

    document.querySelectorAll(".sidebar a").forEach(link => {
        link.addEventListener("click", function (e) {
            if (this.getAttribute("data-section") === "repertorio") {
                console.log("📂 Abrindo seção Repertório...");
                loadRepertorio();
            }
        });
    });
});



function adicionarEventosBotoes() {
    document.querySelectorAll(".delete-button").forEach(button => {
        button.addEventListener("click", function () {
            musicaParaExcluir = this.getAttribute("data-nome");
            document.getElementById("modal-texto").innerText = `Tem certeza que deseja excluir "${musicaParaExcluir}"?`;
            document.getElementById("modal-confirmacao").style.display = "flex";
        });
    });

    document.querySelectorAll(".edit-button").forEach(button => {
        button.addEventListener("click", function () {
            musicaParaEditar = this.getAttribute("data-nome");
            console.log("🎵 Música selecionada para edição:", musicaParaEditar);
            document.getElementById("edit-nome").value = this.getAttribute("data-nome");
            document.getElementById("edit-cantor").value = this.getAttribute("data-cantor");
            document.getElementById("edit-tom").value = this.getAttribute("data-tom");
            document.getElementById("edit-youtube").value = this.getAttribute("data-youtube");
            document.getElementById("modal-editar").style.display = "flex";
        });
    });
}



function filtrarMusicas() {
    const termoBusca = document.getElementById("search-bar").value.toLowerCase();
    console.log("Buscando por:", termoBusca);

    if (termoBusca.trim() === "") {
        console.log("Campo de busca vazio. Restaurando paginação...");
        paginaAtual = 1; 
        renderizarPagina();
        return;
    }

    const musicasFiltradas = listaMusicas.filter(musica =>
        musica.nome.toLowerCase().includes(termoBusca) ||
        musica.cantor.toLowerCase().includes(termoBusca) ||
        musica.tom.toLowerCase().includes(termoBusca)
    );

    console.log("Músicas encontradas:", musicasFiltradas);

    renderizarMusicas(musicasFiltradas);
}


// Função para renderizar músicas sem paginação (usada na busca)
function renderizarMusicas(musicas) {
    const repertorioLista = document.querySelector("#lista-repertorio ul");

    if (!repertorioLista) {
        console.error("Elemento <ul> não encontrado dentro de #lista-repertorio");
        return;
    }

    repertorioLista.innerHTML = "";

    if (musicas.length === 0) {
        repertorioLista.innerHTML = "<p>Nenhuma música encontrada.</p>";
        return;
    }

    repertorioLista.innerHTML = musicas.map(musica => {
        let infoMusica = `<strong>${musica.nome}</strong>`;
        
        if (musica.cantor) {
            infoMusica += ` - ${musica.cantor}`;
        }
        
        if (musica.tom) {
            infoMusica += ` (${musica.tom})`;
        }
    
        return `
            <li>
                <span>${infoMusica}</span>
                <div class="music-actions">
                    ${musica.youtube ? `<button class="youtube-button" onclick="window.open('${musica.youtube}', '_blank')">🎵</button>` : ""}
                    <button class="edit-button" data-nome="${musica.nome}" data-cantor="${musica.cantor || ''}" data-tom="${musica.tom || ''}" data-youtube="${musica.youtube || ''}">✏️</button>
                    <button class="delete-button" data-nome="${musica.nome}">🗑️</button>
                </div>
            </li>`;
    }).join("");    

    console.log("Músicas renderizadas:", repertorioLista.innerHTML);
    adicionarEventosBotoes();
}


// função para exibir alerta 
function showAlert(message, type) {
    console.log("Chamando showAlert para:", type);

    let alertBox, alertMessage, alertButton;

    if (type === "addmusic") {
        alertBox = document.getElementById("custom-alert-addmusic");
        alertMessage = document.getElementById("alert-message-addmusic");
        alertButton = document.getElementById("alert-ok-addmusic");
    } else if (type === "repertorio") {
        alertBox = document.getElementById("custom-alert-repertorio");
        alertMessage = document.getElementById("alert-message-repertorio");
        alertButton = document.getElementById("alert-ok-repertorio");
    } else if (type === "erro") {
        alertBox = document.getElementById("custom-alert-repertorio"); 
        alertMessage = document.getElementById("alert-message-repertorio"); 
        alertButton = document.getElementById("alert-ok-repertorio"); 
        // alertBox.style.backgroundColor = "rgba(255, 0, 0, 0.1)"; 
    } else if (type === "sugestoes") {
        alertBox = document.getElementById("custom-alert-sugestoes");
        alertMessage = document.getElementById("alert-message-sugestoes");
        alertButton = document.getElementById("alert-ok-sugestoes");
    } else if (type === "blocos") {  
        alertBox = document.getElementById("custom-alert-blocos");
        alertMessage = document.getElementById("alert-message-blocos");
        alertButton = document.getElementById("alert-ok-blocos");
    } else {
        console.error("Tipo de alerta desconhecido:", type);
        return;
    }

    if (!alertBox || !alertMessage || !alertButton) {
        console.error("Erro: Elementos do alerta não encontrados!");
        return;
    }

    alertMessage.textContent = message;
    alertBox.style.display = "flex"; 

    alertButton.onclick = () => {
        alertBox.style.display = "none";
    };
}



// form repertório rep.json
document.addEventListener("DOMContentLoaded", async function () {
    console.log("DOM do Form de Repertório carregado!");

    const formRepertorio = document.getElementById("form-repertorio");
    const musicasContainer = document.getElementById("musicas-container");
    const addMusicButton = document.getElementById("add-music");

    if (!formRepertorio || !musicasContainer || !addMusicButton) {
        console.error("Erro: Elementos do formulário não encontrados!");
        return;
    }

    console.log("Elementos do formulário carregados corretamente.");

    let musicIndex = 0;
    let listaMusicas = [];

    async function carregarMusicas() {
        try {
            const response = await fetch("/form.json"); 
            if (!response.ok) throw new Error("Erro ao carregar form.json");
            const data = await response.json();
            
            listaMusicas = data.lista.map(musica => {
                const tomFormatado = musica.tom ? ` (${musica.tom})` : ""; 
                return {
                    nomeCompleto: `${musica.nome} - ${musica.cantor}${tomFormatado}`, 
                    youtube: musica.youtube,
                };
            });
    
            criarDatalist();
        } catch (error) {
            console.error("⚠️ Erro ao carregar músicas:", error);
        }
    }
    

    function criarDatalist() {
        let dataList = document.createElement("datalist");
        dataList.id = "musicas-datalist";
        listaMusicas.forEach(musica => {
            let option = document.createElement("option");
            option.value = musica.nomeCompleto;
            dataList.appendChild(option);
        });

        const oldDataList = document.getElementById("musicas-datalist");
        if (oldDataList) {
            oldDataList.remove();
        }

        document.body.appendChild(dataList);
    }

    function addMusicField(nome = "", link = "") {
        musicIndex++;
    
        const musicDiv = document.createElement("div");
        musicDiv.classList.add("music-entry");
    
        const musicNameInput = document.createElement("input");
        musicNameInput.type = "text";
        musicNameInput.placeholder = "Nome da Música";
        musicNameInput.classList.add("music-name");
        musicNameInput.value = nome;
        musicNameInput.setAttribute("autocomplete", "off");
    
        const musicLinkInput = document.createElement("input");
        musicLinkInput.type = "url";
        musicLinkInput.placeholder = "Link do YouTube";
        musicLinkInput.classList.add("music-link");
        musicLinkInput.value = link;
    
        const removeButton = document.createElement("button");
        removeButton.innerHTML = "🗑️";
        removeButton.classList.add("remove-music");
    
        const dropdown = document.createElement("div");
        dropdown.classList.add("dropdown-suggestions");
        document.body.appendChild(dropdown); 
    
        function mostrarSugestoes() {
            dropdown.innerHTML = "";
            const valorDigitado = musicNameInput.value.toLowerCase();
        
            const sugestoes = valorDigitado
                ? listaMusicas.filter(musica => musica.nomeCompleto.toLowerCase().includes(valorDigitado))
                : listaMusicas;
        
            if (sugestoes.length === 0) {
                dropdown.style.display = "none";
                return;
            }
        
            sugestoes.forEach(musica => {
                let item = document.createElement("div");
                item.classList.add("dropdown-item");
            
                const tomFormatado = musica.tom ? ` (${musica.tom})` : "";
                item.textContent = `${musica.nomeCompleto}${tomFormatado}`;
            
                item.addEventListener("click", () => {
                    musicNameInput.value = musica.nomeCompleto;
                    musicLinkInput.value = musica.youtube || "";
            
                    dropdown.style.display = "none";
                });
            
                dropdown.appendChild(item);
            });                       
        
            const rect = musicNameInput.getBoundingClientRect();
            const parentRect = musicNameInput.closest(".music-entry").getBoundingClientRect();
        
            const isFirstInput = document.querySelector(".music-name") === musicNameInput;
            const offsetFix = isFirstInput ? 2 : 0; 
        
            dropdown.style.left = `${parentRect.left + window.scrollX + offsetFix}px`;
            dropdown.style.top = `${rect.bottom + window.scrollY}px`;
            dropdown.style.width = `${rect.width}px`;
            dropdown.style.display = "block";
        }
        
        musicNameInput.addEventListener("input", mostrarSugestoes);
        musicNameInput.addEventListener("focus", mostrarSugestoes);
        
    
        document.addEventListener("click", (e) => {
            if (!musicNameInput.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });
    
        removeButton.addEventListener("click", function () {
            musicDiv.remove();
            dropdown.remove(); 
        });
    
        musicDiv.appendChild(musicNameInput);
        musicDiv.appendChild(musicLinkInput);
        musicDiv.appendChild(removeButton);
        musicasContainer.appendChild(musicDiv);
    }
    
    addMusicField();

    carregarMusicas();


    // salvar repertório
    formRepertorio.addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("Evento de submit acionado.");

        const nomeRepertorio = document.getElementById("nomeRepertorio").value.trim();
        const dataRepertorio = document.getElementById("dataRepertorio").value;

        const musicasRepertorio = Array.from(document.querySelectorAll(".music-entry")).map(entry => {
            const nome = entry.querySelector(".music-name").value.trim();
            const link = entry.querySelector(".music-link").value.trim();
            return nome ? { nome, link } : null; 
        }).filter(musica => musica !== null); 

        console.log("Dados capturados:", { nomeRepertorio, dataRepertorio, musicasRepertorio });

        if (!nomeRepertorio || !dataRepertorio || musicasRepertorio.length === 0) {
            console.warn("Formulário preenchido incorretamente!");
            showAlert("Por favor, preencha todos os campos corretamente.", "erro");
            return;
        }

        try {
            const response = await fetch("/repertorios");
            const data = await response.json();

            if (data.repertorios) {
                const nomeNormalizado = nomeRepertorio.toLowerCase();
                const existe = data.repertorios.some(rep => rep.nome.toLowerCase() === nomeNormalizado);

                if (existe) {
                    showAlert("Esse nome de repertório já existe!", "erro");
                    return;
                }
            }

            const repertorio = { nome: nomeRepertorio, data: dataRepertorio, musicas: musicasRepertorio };

            console.log("Enviando dados para o servidor:", repertorio);

            const salvarResponse = await fetch("/salvar-repertorio", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(repertorio)
            });

            const salvarData = await salvarResponse.json();
            console.log("Resposta do servidor:", salvarData);

            showAlert("Repertório salvo com sucesso!", "repertorio");

            if ('serviceWorker' in navigator) {
                registration = await navigator.serviceWorker.ready;
                await fetch("/notificar", {
                    method: "POST"
                });
            }
            
            formRepertorio.reset();
            musicasContainer.innerHTML = ""; 
            addMusicField(); 
        } catch (error) {
            console.error("Erro ao salvar repertório:", error);
            showAlert("Erro ao salvar repertório.");
        }
    });
});


// carregar os inputs da parte de add músicas
document.addEventListener("DOMContentLoaded", async function () {
    console.log("🎵 Script carregado!");

    const musicasContainer = document.getElementById("musicas-container");
    const addMusicButton = document.getElementById("add-music");
    let listaMusicas = [];

    async function carregarMusicas() {
        try {
            const response = await fetch("/form.json"); 
            if (!response.ok) throw new Error("Erro ao carregar form.json");
            const data = await response.json();
            
            listaMusicas = data.lista.map(musica => {
                const tomFormatado = musica.tom ? ` (${musica.tom})` : ""; 
                return {
                    nomeCompleto: `${musica.nome} - ${musica.cantor}${tomFormatado}`, 
                    youtube: musica.youtube,
                };
            });
    
            criarDatalist();
        } catch (error) {
            console.error("⚠️ Erro ao carregar músicas:", error);
        }
    }

    function criarDropdown(inputElement, parentElement) {
        let dropdown = document.createElement("div");
        dropdown.classList.add("dropdown-suggestions");
        dropdown.style.display = "none";
        dropdown.style.position = "absolute"; 
        dropdown.style.zIndex = "1000"; 
        document.body.appendChild(dropdown); 

        inputElement.addEventListener("input", function () {
            atualizarSugestoes(inputElement, dropdown);
        });

        inputElement.addEventListener("focus", function () {
            atualizarSugestoes(inputElement, dropdown);
        });

        document.addEventListener("click", function (e) {
            if (!e.target.closest(".music-name") && !e.target.closest(".dropdown-suggestions")) {
                dropdown.style.display = "none";
            }
        });
    }

    function atualizarSugestoes(inputElement, dropdown) {
        dropdown.innerHTML = "";
        const valorDigitado = inputElement.value.toLowerCase();
        
        const sugestoes = valorDigitado
            ? listaMusicas.filter(musica => musica.nomeCompleto.toLowerCase().includes(valorDigitado))
            : listaMusicas; 
    
        if (sugestoes.length === 0) {
            dropdown.style.display = "none";
            return;
        }
    
        sugestoes.forEach(musica => {
            let item = document.createElement("div");
            item.classList.add("dropdown-item");
        
            const tomFormatado = musica.tom ? ` (${musica.tom})` : ""; 
            item.textContent = `${musica.nomeCompleto}${tomFormatado}`;
        
            item.addEventListener("click", () => {
                inputElement.value = musica.nomeCompleto;
                const musicEntry = inputElement.closest(".music-entry");
                if (musicEntry) {
                    const linkInput = musicEntry.querySelector(".music-link");
                    linkInput.value = musica.youtube || "";
                }
                dropdown.style.display = "none";
            });
        
            dropdown.appendChild(item);
        });
        
    
        const rect = inputElement.getBoundingClientRect();
        const parentRect = inputElement.closest(".music-entry").getBoundingClientRect();
    
        const isFirstInput = inputElement === document.querySelector(".music-name");
        const offsetFix = isFirstInput ? 2 : 0;
    
        dropdown.style.left = `${parentRect.left + window.scrollX + offsetFix}px`;
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.display = "block";
    }
    
    
    

    function addMusicField(nome = "", link = "") {
        const musicEntry = document.createElement("div");
        musicEntry.classList.add("music-entry");
        musicEntry.style.position = "relative"; 

        const musicNameInput = document.createElement("input");
        musicNameInput.type = "text";
        musicNameInput.placeholder = "Nome da música";
        musicNameInput.classList.add("music-name");
        musicNameInput.value = nome;
        musicNameInput.setAttribute("autocomplete", "off");

        const musicLinkInput = document.createElement("input");
        musicLinkInput.type = "url";
        musicLinkInput.placeholder = "Link do YouTube";
        musicLinkInput.classList.add("music-link");
        musicLinkInput.value = link;

        const removeButton = document.createElement("button");
        removeButton.innerHTML = "🗑️";
        removeButton.classList.add("remove-music");

        removeButton.addEventListener("click", function () {
            musicEntry.remove();
        });

        musicEntry.appendChild(musicNameInput);
        musicEntry.appendChild(musicLinkInput);
        musicEntry.appendChild(removeButton);
        musicasContainer.appendChild(musicEntry);

        criarDropdown(musicNameInput, musicEntry);
    }

    addMusicButton.addEventListener("click", function (event) {
        event.preventDefault();
        addMusicField();
    });

    await carregarMusicas();
});








let listaRepertorios = [];
let paginaAtualRepertorios = 1;
let repertoriosPorPagina = 7;

// container para exibir os repertórios
document.addEventListener("DOMContentLoaded", function () {
    let repertorioParaExcluir = null; 
    let repertorioParaEditar = null; 

    function renderizarRepertorios() {
        const repertorioLista = document.querySelector("#lista-repertorios ul");
        if (!repertorioLista) {
            console.error("Elemento <ul> não encontrado dentro de #lista-repertorios");
            return;
        }

        repertorioLista.innerHTML = "";
        const inicio = (paginaAtualRepertorios - 1) * repertoriosPorPagina;
        const fim = inicio + repertoriosPorPagina;
        const repertoriosPaginados = listaRepertorios.slice(inicio, fim);

        if (repertoriosPaginados.length === 0) {
            repertorioLista.innerHTML = "<p>Nenhum repertório disponível.</p>";
            return;
        }

        repertorioLista.innerHTML = repertoriosPaginados.map(rep =>
            `<li>
                <span><strong>${rep.nome.toUpperCase()}</strong> - ${formatarData(rep.data)}</span>
                <div class="rep-actions">
                    <button class="view-button" data-nome="${rep.nome}">👀</button>
                    <button class="edit-button" data-nome="${rep.nome}">✏️</button>
                    <button class="delete-button" data-nome="${rep.nome}">🗑️</button>
                </div>
            </li>`
        ).join("");

        document.querySelectorAll(".view-button").forEach(button => {
            button.addEventListener("click", function () {
                const nomeRepertorio = this.getAttribute("data-nome");
                exibirRelatorio(nomeRepertorio);
            });
        });

        document.querySelectorAll(".edit-button").forEach(button => {
            button.addEventListener("click", function () {
                const nomeRepertorio = this.getAttribute("data-nome");
                abrirModalEdicao(nomeRepertorio);
            });
        });

        document.querySelectorAll(".delete-button").forEach(button => {
            button.addEventListener("click", function () {
                const nomeRepertorio = this.getAttribute("data-nome");
                abrirModalExclusao(nomeRepertorio);
            });
        });

        atualizarBotoesPaginacaoRepertorios();
    }

    // função pra atualizar botoes de paginaçao 
    function atualizarBotoesPaginacaoRepertorios() {
        const paginacaoContainer = document.getElementById("paginacao-repertorios");
        if (!paginacaoContainer) return;
    
        paginacaoContainer.innerHTML = "";
    
        const totalPaginas = Math.ceil(listaRepertorios.length / repertoriosPorPagina);
        
        console.log(`Total de páginas: ${totalPaginas}, Página atual: ${paginaAtualRepertorios}`);
    
        if (totalPaginas > 1) {
            console.log("Adicionando botões de paginação...");
    
            if (paginaAtualRepertorios > 1) {
                let btnAnterior = document.createElement("button");
                btnAnterior.id = "anterior-rep";

                let iconAnterior = document.createElement("span");
                iconAnterior.classList.add("material-icons-sharp");
                iconAnterior.textContent = "chevron_left";

                btnAnterior.appendChild(iconAnterior);
                btnAnterior.appendChild(document.createTextNode(""));
                btnAnterior.addEventListener("click", function () {
                    if (paginaAtualRepertorios > 1) {
                        paginaAtualRepertorios--;
                        renderizarRepertorios();
                    }
                });
                paginacaoContainer.appendChild(btnAnterior);
                console.log("Botão 'Anterior' adicionado!");
            }
    
            if (paginaAtualRepertorios < totalPaginas) {
                let btnProximo = document.createElement("button");

                let iconProximo = document.createElement("span");
                iconProximo.classList.add("material-icons-sharp");
                iconProximo.textContent = "chevron_right";

                btnProximo.appendChild(document.createTextNode(""));
                btnProximo.appendChild(iconProximo);
                btnProximo.id = "proximo-rep";
                btnProximo.addEventListener("click", function () {
                    if (paginaAtualRepertorios < totalPaginas) {
                        paginaAtualRepertorios++;
                        renderizarRepertorios();
                    }
                });
                paginacaoContainer.appendChild(btnProximo);
                console.log("Botão 'Próximo' adicionado!");
            }
        } else {
            console.log("Menos de 1 página, não adicionando botões.");
        }
    }
        
    

    function carregarRepertorios() {
        fetch("/repertorios")
            .then(response => response.json())
            .then(data => {
                if (data && Array.isArray(data.repertorios)) {
                    listaRepertorios = data.repertorios;
                } else {
                    console.error("Formato inválido recebido da API:", data);
                    listaRepertorios = [];
                }
                paginaAtualRepertorios = 1;
                renderizarRepertorios();
            })
            .catch(error => console.error("Erro ao carregar repertórios:", error));
    }
    
    

    // Função para filtrar repertórios
    window.filtrarRepertorios = function () {
        console.log("Função filtrarRepertorios foi chamada!");

        const termoBusca = document.getElementById("search-bar-repertorios").value.toLowerCase();
        console.log("Buscando repertórios por:", termoBusca);

        if (termoBusca.trim() === "") {
            console.log("Campo de busca vazio. Restaurando paginação...");
            paginaAtualRepertorios = 1;
            renderizarRepertorios();
            return;
        }

        const repertoriosFiltrados = listaRepertorios.filter(rep => {
            const nomeRepertorio = rep.nome.toLowerCase();
            const dataRepertorio = formatarData(rep.data).toLowerCase(); 

            return nomeRepertorio.includes(termoBusca) || dataRepertorio.includes(termoBusca);
        });

        console.log("Repertórios encontrados:", repertoriosFiltrados);
        renderizarRepertoriosFiltrados(repertoriosFiltrados);
    }
     

    // Função para renderizar repertórios filtrados sem paginação
    function renderizarRepertoriosFiltrados(repertorios) {
        const repertorioLista = document.querySelector("#lista-repertorios ul");

        if (!repertorioLista) {
            console.error("Elemento <ul> não encontrado dentro de #lista-repertorios");
            return;
        }

        repertorioLista.innerHTML = "";

        if (repertorios.length === 0) {
            repertorioLista.innerHTML = "<p>Nenhum repertório encontrado.</p>";
            return;
        }

        repertorioLista.innerHTML = repertorios.map(rep =>
            `<li>
                <span><strong>${rep.nome}</strong> - ${formatarData(rep.data)}</span>
                <div class="rep-actions">
                    <button class="view-button" data-nome="${rep.nome}">👀</button>
                    <button class="edit-button" data-nome="${rep.nome}">✏️</button>
                    <button class="delete-button" data-nome="${rep.nome}">🗑️</button>
                </div>
            </li>`
        ).join("");

        document.querySelectorAll(".view-button").forEach(button => {
            button.addEventListener("click", function () {
                const nomeRepertorio = this.getAttribute("data-nome");
                exibirRelatorio(nomeRepertorio);
            });
        });

        document.querySelectorAll(".edit-button").forEach(button => {
            button.addEventListener("click", function () {
                const nomeRepertorio = this.getAttribute("data-nome");
                abrirModalEdicao(nomeRepertorio);
            });
        });

        document.querySelectorAll(".delete-button").forEach(button => {
            button.addEventListener("click", function () {
                const nomeRepertorio = this.getAttribute("data-nome");
                abrirModalExclusao(nomeRepertorio);
            });
        });
    }


    // editar rep.json
    function abrirModalEdicao(nome) {
        repertorioParaEditar = listaRepertorios.find(rep => rep.nome === nome);
        if (!repertorioParaEditar) return alert("Repertório não encontrado! rep.json");
    
        console.log("Editando repertório:", repertorioParaEditar);
    
        document.getElementById("edit-nome-repertorio").value = repertorioParaEditar.nome;
        document.getElementById("edit-data-repertorio").value = formatarDataParaInput(repertorioParaEditar.data);
        
        document.getElementById("edit-observacoes").value = repertorioParaEditar.observacoes || "";
    
        const listaMusicas = document.getElementById("edit-lista-musicas");
        listaMusicas.innerHTML = "";
    
        if (repertorioParaEditar.musicas && repertorioParaEditar.musicas.length > 0) {
            repertorioParaEditar.musicas.forEach((musica) => {
                const musicaItem = document.createElement("div");
                musicaItem.classList.add("musica-item");
                musicaItem.innerHTML = `
                    <input type="text" value="${musica.nome}" class="edit-musica-nome">
                    <input type="text" value="${musica.link}" class="edit-musica-link">
                    <button class="remove-musica">🗑️</button>
                `;
    
                musicaItem.querySelector(".remove-musica").addEventListener("click", function () {
                    console.log(`Removendo música: ${musica.nome}`);
                    musicaItem.remove();
                });
    
                listaMusicas.appendChild(musicaItem);
            });
        } else {
            const musicaItem = document.createElement("div");
            musicaItem.classList.add("musica-item");
            musicaItem.innerHTML = `
                <input type="text" placeholder="Nome da música" class="edit-musica-nome">
                <input type="text" placeholder="Link da música" class="edit-musica-link">
                <button class="remove-musica">🗑️</button>
            `;
    
            musicaItem.querySelector(".remove-musica").addEventListener("click", function () {
                console.log("Removendo música adicionada");
                musicaItem.remove();
            });
    
            listaMusicas.appendChild(musicaItem);
        }
    
        document.getElementById("modal-editar-repertorio").style.display = "flex";
    }
    

    function fecharModalEdicao() {
        console.log("Fechando modal de edição");
        document.getElementById("modal-editar-repertorio").style.display = "none";
        repertorioParaEditar = null;
    }

    document.getElementById("cancelar-edicao-repertorio").addEventListener("click", fecharModalEdicao);

    document.getElementById("salvar-edicao-repertorio").addEventListener("click", function () {
        if (!repertorioParaEditar) return;
    
        const novoNome = document.getElementById("edit-nome-repertorio").value.trim();
        const novaData = document.getElementById("edit-data-repertorio").value.trim();
        const observacoes = document.getElementById("edit-observacoes").value.trim();
    
        let novasMusicas = [];
    
        document.querySelectorAll("#edit-lista-musicas .musica-item").forEach(item => {
            const nomeMusica = item.querySelector(".edit-musica-nome").value.trim();
            const linkMusica = item.querySelector(".edit-musica-link").value.trim();
    
            if (nomeMusica && !novasMusicas.some(m => m.nome === nomeMusica)) {
                novasMusicas.push({ nome: nomeMusica, link: linkMusica });
            }
        });
    
        const repertorioEditado = {
            nomeAntigo: repertorioParaEditar.nome, 
            novoNome: novoNome || repertorioParaEditar.nome, 
            novaData: novaData || repertorioParaEditar.data, 
            musicas: novasMusicas.length > 0 ? novasMusicas : [], 
            observacoes: observacoes !== undefined ? observacoes : (repertorioParaEditar.observacoes || "")
        };
    
        console.log("📌 Enviando dados editados:", repertorioEditado);
    
        fetch("/editar-repertorio", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(repertorioEditado)
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                carregarRepertorios();
            } else {
                alert(`Erro ao editar repertório: ${data.erro}`);
            }
            fecharModalEdicao();
        })
        .catch(error => {
            console.error("Erro ao editar repertório:", error);
            alert("Erro ao conectar com o servidor. Tente novamente mais tarde.");
        });        
    });
    

    document.getElementById("adicionar-musica").addEventListener("click", function () {
        const listaMusicas = document.getElementById("edit-lista-musicas");
        const musicaItem = document.createElement("div");
        musicaItem.classList.add("musica-item-edit");
        musicaItem.innerHTML = `
            <div class="musica-item">
                <input type="text" placeholder="Nome da música" class="edit-musica-nome">
                <input type="text" placeholder="Link da música" class="edit-musica-link">
                <button class="remove-musica">🗑️</button>
            </div>
        `;
        musicaItem.querySelector(".remove-musica").addEventListener("click", function () {
            console.log("Removendo música adicionada");
            musicaItem.remove();
        });

        listaMusicas.appendChild(musicaItem);
    });

    function formatarDataParaInput(data) {
        if (!data.includes("/")) return data;
        const partes = data.split("/");
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }

    // excluir rep.json
    function abrirModalExclusao(nome) {
        repertorioParaExcluir = nome;
        document.getElementById("modal-texto-repertorio").innerText = `Tem certeza que deseja excluir o repertório "${nome}"?`;
        document.getElementById("modal-excluir-repertorio").style.display = "flex";
    }
    
    function fecharModalExclusao() {
        document.getElementById("modal-excluir-repertorio").style.display = "none";
        repertorioParaExcluir = null;
    }
    
    document.getElementById("cancelar-exclusao-repertorio").addEventListener("click", fecharModalExclusao);
    
    document.getElementById("confirmar-exclusao-repertorio").addEventListener("click", function () {
        if (!repertorioParaExcluir) return;
    
        fetch("/remover-repertorio", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nome: repertorioParaExcluir })
        })
        .then(response => response.json())
        .then(data => {
            if (data.sucesso) {
                carregarRepertorios();
            } else {
                alert(`Erro ao remover repertório: ${data.erro}`);
            }
            fecharModalExclusao();
        })
        .catch(error => {
            console.error("Erro ao remover repertório:", error);
            alert("Erro ao conectar com o servidor. Tente novamente mais tarde.");
            fecharModalExclusao();
        });        
    });    

    // botão olhinho
    function exibirRelatorio(nomeRepertorio) {
        const repertorio = listaRepertorios.find(rep => rep.nome === nomeRepertorio);
        if (!repertorio) {
            alert("Repertório não encontrado! rep.json");
            return;
        }
    
        let relatorio = `
            <h2>${repertorio.nome}</h2>
            <p><strong>Data:</strong> ${formatarData(repertorio.data)}</p>
            <h3>Músicas:</h3>
            <ol class="musicas-container">
        `;
    
        repertorio.musicas.forEach(musica => {
            relatorio += `
                <li class="musica-item-olhinho">
                    <span><strong>${musica.nome}</strong></span>
            `;
            
            if (musica.link && musica.link.trim() !== "") {
                relatorio += `<a href="${musica.link}" target="_blank">🎵 Assistir no YouTube</a>`;
            }
        
            relatorio += `</li>`;
        });
        
    
        relatorio += `</ol>`;
    
        if (repertorio.observacoes && repertorio.observacoes.trim() !== "") {
            relatorio += `
                <h3>Observações:</h3>
                <p>${repertorio.observacoes}</p>
            `;
        }
    
        document.getElementById("relatorio-container").innerHTML = relatorio;
        
        document.getElementById("relatorio-modal").style.display = "flex";
    }
    
    
    function fecharModalRelatorio() {
        document.getElementById("relatorio-modal").style.display = "none";
    }

    document.getElementById("fechar-relatorio-modal").addEventListener("click", fecharModalRelatorio);
    
    window.onclick = function(event) {
        const modal = document.getElementById("relatorio-modal");
        if (event.target === modal) {
            modal.style.display = "none";
        }
    };
    

    function formatarData(data) {
        if (!data) return "Data não informada";
        const partes = data.split("-");
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }


    document.querySelectorAll(".sidebar a").forEach(link => {
        link.addEventListener("click", function () {
            if (this.getAttribute("data-section") === "listrep") {
                carregarRepertorios();
            }
        });
    });
});


// adicionar sugestoes
document.getElementById("addSuggestion").addEventListener("click", function () {
    document.getElementById("modal-sugestao").style.display = "flex";
});

document.getElementById("fecharModalSugestao").addEventListener("click", function () {
    document.getElementById("modal-sugestao").style.display = "none";
});

let listaSugestoes = []; 
let paginaSugestoesAtual = 1;
const sugestoesPorPagina = 7;

// salvar sugestão 
document.getElementById("salvarSugestao").addEventListener("click", function () {
    const nome = document.getElementById("sugestao-nome").value.trim();
    const cantor = document.getElementById("sugestao-cantor").value.trim();
    const tom = document.getElementById("sugestao-tom").value.trim();
    const youtube = document.getElementById("sugestao-youtube").value.trim();

    if (!nome || !cantor) {
        showAlert("Por favor, preencha os campos obrigatórios (Nome e Cantor)", "sugestoes");
        return;
    }

    const novaSugestao = { nome, cantor, tom, youtube: youtube || null };

    fetch('/adicionar-sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaSugestao)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("modal-sugestao").style.display = "none";
        carregarSugestoes();
    })
    .catch(error => console.error("Erro ao adicionar sugestão:", error));
});

// Função para carregar sugestões pendentes
function carregarSugestoes() {
    fetch('/sugestoes')
        .then(response => response.json())
        .then(sugestoes => {
            listaSugestoes = sugestoes; 
            paginaSugestoesAtual = 1; 
            renderizarSugestoes(); 
        })
        .catch(error => console.error("Erro ao carregar sugestões:", error));
}

function renderizarSugestoes() {
    const lista = document.querySelector("#suggestion-list ul");
    if (!lista) {
        console.error("Elemento <ul> não encontrado dentro de #suggestion-list");
        return;
    }

    lista.innerHTML = ""; 

    const inicio = (paginaSugestoesAtual - 1) * sugestoesPorPagina;
    const fim = inicio + sugestoesPorPagina;
    const sugestoesPaginadas = listaSugestoes.slice(inicio, fim);

    if (sugestoesPaginadas.length === 0) {
        lista.innerHTML = "<p>Nenhuma sugestão disponível.</p>";
        return;
    }

    lista.innerHTML = sugestoesPaginadas.map(sugestao =>
        `<li>
            <span><strong>${sugestao.nome}</strong> - ${sugestao.cantor} (${sugestao.tom || "Sem tom"})</span>
            <div class="music-actions">
                ${sugestao.youtube ? `<a href="${sugestao.youtube}" target="_blank" class="youtub-button">🎵</a>` : ""}
                <button class="approve-button" onclick="aprovarSugestao('${sugestao.nome}')">✅</button>
                <button class="reject-button" onclick="recusarSugestao('${sugestao.nome}')">❌</button>
            </div>
        </li>`
    ).join("");

    atualizarBotoesPaginacaoSugestoes();
}

function atualizarBotoesPaginacaoSugestoes() {
    const paginacaoContainer = document.getElementById("paginacao-sugestoes");
    paginacaoContainer.innerHTML = "";

    const totalPaginas = Math.ceil(listaSugestoes.length / sugestoesPorPagina);

    if (totalPaginas > 1) {
        if (paginaSugestoesAtual > 1) {
            paginacaoContainer.innerHTML += `
                <button id="anterior-sugestoes">
                    <span class="material-icons-sharp">chevron_left</span>
                </button>`;
        }
        if (paginaSugestoesAtual < totalPaginas) {
            paginacaoContainer.innerHTML += `
                <button id="proximo-sugestoes">
                    <span class="material-icons-sharp">chevron_right</span>
                </button>`;
        }

        document.getElementById("anterior-sugestoes")?.addEventListener("click", function () {
            if (paginaSugestoesAtual > 1) {
                paginaSugestoesAtual--;
                renderizarSugestoes();
            }
        });

        document.getElementById("proximo-sugestoes")?.addEventListener("click", function () {
            if (paginaSugestoesAtual < totalPaginas) {
                paginaSugestoesAtual++;
                renderizarSugestoes();
            }
        });
    }
}

// Função para aprovar sugestão
function aprovarSugestao(nome) {
    fetch('/aprovar-sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    })
    .then(response => response.json())
    .then(data => {
        carregarSugestoes();
    });
}

// Função para recusar sugestão
function recusarSugestao(nome) {
    fetch('/recusar-sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    })
    .then(response => response.json())
    .then(data => {
        carregarSugestoes();
    });
}

carregarSugestoes();



// Função para ler o rep.json - estatisticas
function lerRepertorios() {
    try {
        const data = fs.readFileSync("rep.json", "utf-8");
        const jsonData = JSON.parse(data);

        if (!jsonData.repertorios || !Array.isArray(jsonData.repertorios)) {
            throw new Error("Formato inválido do rep.json");
        }

        return jsonData.repertorios; 
    } catch (error) {
        console.error("Erro ao ler o rep.json:", error);
        return [];
    }
}


// Função para salvar a análise em um novo json
function salvarAnalise(analise) {
    try {
        fs.writeFileSync('analise_repertorios.json', JSON.stringify(analise, null, 4));
        console.log("Análise salva em analise_repertorios.json");
    } catch (error) {
        console.error("Erro ao salvar a análise:", error);
    }
}

function parseData(dataString) {
    const partes = dataString.split("-");
    if (partes.length === 3) {
        const ano = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1;
        const dia = parseInt(partes[2], 10);
        return new Date(ano, mes, dia);
    }
    return null;
}

function extrairNomeBase(nome) {
    return nome.split("-")[0].split("(")[0].trim().toLowerCase();
}

// Função para analisar repertórios
function analisarRepertorios(repertorios) {
    repertorios.sort((a, b) => new Date(a.data) - new Date(b.data));

    let analise = [];
    let somaTaxaRepeticao = 0;

    repertorios.forEach((repertorio, index) => {
        let repetidas = 0;
        let totalMusicas = repertorio.musicas.length;

        let historicoMusicas = new Set();
        for (let i = Math.max(0, index - 2); i < index; i++) {
            repertorios[i].musicas.forEach(musica => {
                historicoMusicas.add(extrairNomeBase(musica.nome));
            });
        }

        repertorio.musicas.forEach(musica => {
            let nomeBase = extrairNomeBase(musica.nome);
            if (historicoMusicas.has(nomeBase)) {
                repetidas++;
            }
        });

        let taxaRepeticao = repetidas / totalMusicas;
        somaTaxaRepeticao += taxaRepeticao;

        let status = taxaRepeticao > 0.7 ? "Repetitivo" : taxaRepeticao > 0.3 ? "Moderado" : "Variado";

        analise.push({
            nome: repertorio.nome,
            data: repertorio.data,
            repetidas,
            totalMusicas,
            taxaRepeticao: (taxaRepeticao * 100).toFixed(2) + "%",
            status
        });
    });

    let taxaMedia = somaTaxaRepeticao / repertorios.length;
    let statusGeral = taxaMedia > 0.7 ? "Repetitivo" : taxaMedia > 0.3 ? "Moderado" : "Variado";

    return {
        estatisticaGeral: {
            taxaMediaRepeticao: (taxaMedia * 100).toFixed(2) + "%",
            statusGeral
        },
        analiseIndividual: analise
    };
}

const repertorios = lerRepertorios();
const resultadoAnalise = analisarRepertorios(repertorios);
salvarAnalise(resultadoAnalise);

function formatarData(data) {
    let partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Função para carregar estatísticas dos repertórios
function carregarEstatisticas() {
    fetch('/estatisticas')
        .then(response => response.json())
        .then(analise => {
            listaEstatisticas = {
                estatisticaGeral: analise.estatisticaGeral,  
                analiseIndividual: analise.analiseIndividual 
            }; 
            paginaAtualStats = 1; 
            renderizarEstatisticas(); 
        })
        .catch(error => console.error("Erro ao carregar estatísticas:", error));
}

document.addEventListener("DOMContentLoaded", carregarEstatisticas);

// Paginação estatísticas
let listaEstatisticas = []; 
let paginaAtualStats = 1;
const statsPorPagina = 6; 

function renderizarEstatisticas() {
    const listaContainer = document.querySelector("#statistics-list");
    
    if (!listaContainer) {
        console.error("Elemento #statistics-list não encontrado");
        return;
    }

    const lista = listaContainer.querySelector("ul");
    if (!lista) {
        console.error("Elemento <ul> não encontrado dentro de #statistics-list");
        return;
    }

    lista.innerHTML = ""; 

    const estatisticaExistente = document.querySelector(".estatistica-geral");
    if (estatisticaExistente) {
        estatisticaExistente.remove();
    }

    const estatisticaGeral = document.createElement("div");
    estatisticaGeral.classList.add("estatistica-geral");

    console.log("🔍 Estatística Geral:", listaEstatisticas.estatisticaGeral);
    
    if (listaEstatisticas.estatisticaGeral) {
        let cor = listaEstatisticas.estatisticaGeral.statusGeral === "Repetitivo" ? "red" :
                  listaEstatisticas.estatisticaGeral.statusGeral === "Moderado" ? "orange" : "green";

        estatisticaGeral.innerHTML = `
            <div class="taxaMedia">
                <p><strong>Taxa Média de Repetição:</strong> 
                    ${listaEstatisticas.estatisticaGeral.taxaRepeticao !== undefined 
                        ? listaEstatisticas.estatisticaGeral.taxaRepeticao 
                        : "Não disponível"}
                </p>
                <p><strong>Status Geral:</strong> <span style="color: ${cor}; font-weight: bold;">${listaEstatisticas.estatisticaGeral.statusGeral}</span></p>
                <hr>
            </div>
        `;
    } else {
        estatisticaGeral.innerHTML = "<p><strong>Sem dados gerais disponíveis.</strong></p><hr>";
    }

    const searchBar = document.querySelector("#search-bar-statistic");
    searchBar.insertAdjacentElement("afterend", estatisticaGeral);

    const estatisticasReversas = [...listaEstatisticas.analiseIndividual].reverse();
    const inicio = (paginaAtualStats - 1) * statsPorPagina;
    const fim = inicio + statsPorPagina;
    const estatisticasPaginadas = estatisticasReversas.slice(inicio, fim);

    if (estatisticasPaginadas.length === 0) {
        lista.innerHTML = "<p>Nenhuma estatística disponível.</p>";
    } else {
        estatisticasPaginadas.forEach(rep => {
            let cor = rep.status === "Repetitivo" ? "red" :
                      rep.status === "Moderado" ? "orange" : "green";

            const item = document.createElement("li");
            item.innerHTML = `
                <div class="stat-left">
                    <strong>${rep.nome}</strong> (${formatarData(rep.data)}) - 
                    <span class="status" style="color: ${cor}; font-weight: bold;">${rep.status}</span>
                </div>
                <div class="rep-actions">
                    <button class="ver-relatorio-btn" onclick="exibirRelatorioEstatistica('${rep.nome}')">📝</button>
                </div>
            `;
            lista.appendChild(item);
        });
    }

    atualizarBotoesPaginacaoEstatisticas();
}


//<span class="stat-details">🎵 ${rep.totalMusicas} músicas, 🔁 ${rep.repetidas} repetidas (${rep.taxaRepeticao})</span>
function exibirRelatorioEstatistica(nomeRepertorio) {
    const repertorio = listaEstatisticas.analiseIndividual.find(rep => rep.nome === nomeRepertorio);
    if (!repertorio) {
        alert("Repertório não encontrado! estatisticas");
        return;
    }

    let repetidasHTML = "";

    if (repertorio.repetidasDetalhes && repertorio.repetidasDetalhes.length > 0) {
        repetidasHTML = `
            <h3>Músicas Repetidas:</h3>
            <ul>
                ${repertorio.repetidasDetalhes.map(m => `
                    <li class="musica-item-rep">🎶 <strong>${m.nome}</strong> (Repetida de: ${m.origem})</li>
                `).join("")}
            </ul>
        `;
    } else {
        repetidasHTML = "<p><strong>Nenhuma música repetida neste repertório.</strong></p>";
    }

    let relatorio = `
        <h2>${repertorio.nome}</h2>
        <span class="musica-item"><strong>Data:</strong>${formatarData(repertorio.data)}</span>
        <h3>Estatísticas:</h3>
        <ul class="musica-item">
            <li><strong>Total de Músicas:</strong> ${repertorio.totalMusicas}</li>
            <li><strong>Repetidas:</strong> ${repertorio.repetidas}</li>
            <li><strong>Taxa de Repetição:</strong> ${repertorio.taxaRepeticao}</li>
            <li><strong>Status:</strong> <span style="color:${repertorio.status === "Repetitivo" ? "red" : repertorio.status === "Moderado" ? "orange" : "green"}">${repertorio.status}</span></li>
        </ul>
        ${repetidasHTML}
    `;

    document.getElementById("relatorio-container-statistic").innerHTML = relatorio;
    document.getElementById("relatorio-modal-statistics").style.display = "flex";
}


function fecharModalRelatorioEstatistica() {
    document.getElementById("relatorio-modal-statistics").style.display = "none";
}

document.getElementById("fechar-relatorio-modal-statistic").addEventListener("click", fecharModalRelatorioEstatistica);

window.onclick = function(event) {
    const modal = document.getElementById("relatorio-modal-statistics");
    if (event.target === modal) {
        modal.style.display = "none";
    }
};



// Paginação das estatísticas
function atualizarBotoesPaginacaoEstatisticas() {
    const paginacaoContainer = document.getElementById("paginacao-statistics");
    if (!paginacaoContainer) {
        console.error("⚠️ Erro: Elemento #paginacao-statistics não encontrado no DOM.");
        return; 
    }

    paginacaoContainer.innerHTML = "";
    const totalPaginas = Math.ceil(listaEstatisticas.analiseIndividual.length / statsPorPagina);

    if (totalPaginas > 1) {
        if (paginaAtualStats > 1) {
            let btnAnterior = document.createElement("button");
            btnAnterior.innerHTML = "<span class='material-icons-sharp'>chevron_left</span>";
            btnAnterior.addEventListener("click", function () {
                if (paginaAtualStats > 1) {
                    paginaAtualStats--;
                    renderizarEstatisticas();
                }
            });
            paginacaoContainer.appendChild(btnAnterior);
        }

        if (paginaAtualStats < totalPaginas) {
            let btnProximo = document.createElement("button");
            btnProximo.innerHTML = "<span class='material-icons-sharp'>chevron_right</span>";
            btnProximo.addEventListener("click", function () {
                if (paginaAtualStats < totalPaginas) {
                    paginaAtualStats++;
                    renderizarEstatisticas();
                }
            });
            paginacaoContainer.appendChild(btnProximo);
        }
    }
}

// Paginação estatísticas com filtro
function filtrarEstatisticas() {
    const termoBusca = document.getElementById("search-bar-statistic").value.toLowerCase();
    console.log("Buscando estatísticas por:", termoBusca);

    if (termoBusca.trim() === "") {
        console.log("Campo de busca vazio. Restaurando paginação...");
        paginaAtualStats = 1; 
        renderizarEstatisticas();
        return;
    }

    const estatisticasFiltradas = listaEstatisticas.filter(rep =>
        rep.nome.toLowerCase().includes(termoBusca) ||
        formatarData(rep.data).includes(termoBusca) || 
        rep.status.toLowerCase().includes(termoBusca)
    );

    console.log("Estatísticas encontradas:", estatisticasFiltradas);

    renderizarEstatisticasFiltradas(estatisticasFiltradas);
}

// Função para renderizar estatísticas sem paginação (usada na busca)
function renderizarEstatisticasFiltradas(estatisticas) {
    const lista = document.querySelector("#statistics-list ul");

    if (!lista) {
        console.error("Elemento <ul> não encontrado dentro de #statistics-list");
        return;
    }

    lista.innerHTML = "";

    if (estatisticas.length === 0) {
        lista.innerHTML = "<p>Nenhuma estatística encontrada.</p>";
        return;
    }

    estatisticas.forEach(rep => {
        let cor = rep.status === "Repetitivo" ? "red" :
                  rep.status === "Moderado" ? "orange" : "green";

        const item = document.createElement("li");
        item.innerHTML = `
            <div class="stat-left">
                <strong>${rep.nome}</strong> (${formatarData(rep.data)}) - 
                <span class="status" style="color: ${cor}; font-weight: bold;">${rep.status}</span>
            </div>
            <div class="rep-actions">
                <button class="ver-relatorio-btn" onclick="exibirRelatorioEstatistica('${rep.nome}')">🔍 Ver Relatório</button>
            </div>
        `;
        lista.appendChild(item);
    });
}



// analises
let aproveitamentoGeral = "Não disponível";

document.addEventListener("DOMContentLoaded", function () {
    carregarDadosEAnalisar();
});

// função para carregar os dados do servidor e processar a análise
async function carregarDadosEAnalisar() {
    try {
        const formResponse = await fetch("/repertorio"); 
        const repResponse = await fetch("/repertorios");

        const formJson = await formResponse.json();
        const repJson = await repResponse.json();

        const resultadoAproveitamento = analisarAproveitamento(formJson.lista, repJson.repertorios);
        exibirAproveitamentoNoHTML(resultadoAproveitamento);
    } catch (error) {
        console.error("❌ Erro ao carregar dados:", error);
    }
}

// função para analisar o aproveitamento das músicas do form.json nos repertórios do rep.json
function analisarAproveitamento(listaForm, listaRepertorios) {
    let totalMusicas = listaForm.length;
    let usadas = 0;
    let analiseDetalhada = [];

    listaForm.forEach(musicaForm => {
        let nomeBaseForm = extrairNomeBase(musicaForm.nome); 
        let foiUsada = false;
        let vezesUsada = 0;

        listaRepertorios.forEach(repertorio => {
            repertorio.musicas.forEach(musicaRep => {
                let nomeBaseRep = extrairNomeBase(musicaRep.nome); 
                
                if (nomeBaseRep.toLowerCase().trim() === nomeBaseForm.toLowerCase().trim()) {
                    foiUsada = true;
                    vezesUsada++;
                }
            });
        });

        if (foiUsada) {
            usadas++;
        }

        analiseDetalhada.push({
            nome: musicaForm.nome,
            utilizada: foiUsada ? "Sim" : "Não",
            vezesUsada: vezesUsada
        });
    });

    let percentualAproveitamento = ((usadas / totalMusicas) * 100).toFixed(2) + "%";

    return {
        percentual: percentualAproveitamento,
        detalhes: analiseDetalhada
    };
}

function extrairNomeBase(nomeCompleto) {
    return nomeCompleto.split(/[-(]/)[0].trim(); 
}


let paginaAtualAnalytics = 1;
const musicasPorPaginaAnalytics = 4; 

// função para exibir as analises
function exibirAproveitamentoNoHTML(resultado) {
    const analyticsList = document.querySelector("#analytics-list ul");
    const paginacaoContainer = document.querySelector("#paginacao-analytics");

    analyticsList.innerHTML = ""; 
    paginacaoContainer.innerHTML = "";
    aproveitamentoGeral = resultado.percentual;

    let percentualItem = document.createElement("li");
    percentualItem.innerHTML = `<strong>Aproveitamento geral:</strong> ${resultado.percentual}`;
    analyticsList.appendChild(percentualItem);

    let utilizadas = resultado.detalhes.filter(musica => musica.utilizada === "Sim");
    let naoUtilizadas = resultado.detalhes.filter(musica => musica.utilizada === "Não");

    let totalPaginas = Math.ceil(Math.max(utilizadas.length, naoUtilizadas.length) / musicasPorPaginaAnalytics);

    let listaContainer = document.createElement("div");
    listaContainer.classList.add("musicas-section");
    analyticsList.appendChild(listaContainer);

    function renderizarPagina() {
        listaContainer.innerHTML = ""; 

        let inicio = (paginaAtualAnalytics - 1) * musicasPorPaginaAnalytics;
        let fim = inicio + musicasPorPaginaAnalytics;

        let musicasUsadas = utilizadas.slice(inicio, fim);
        let musicasNaoUsadas = naoUtilizadas.slice(inicio, fim);

        let tituloUsadas = document.createElement("h3");
        tituloUsadas.textContent = "🎵 Músicas Tocadas";
        listaContainer.appendChild(tituloUsadas);

        let listaUsadas = document.createElement("ul");
        if (musicasUsadas.length === 0) {
            listaUsadas.innerHTML = "<p>Nenhuma música nesta categoria.</p>";
        } else {
            musicasUsadas.forEach(musica => {
                let item = document.createElement("li");
                item.innerHTML = `<strong>${musica.nome}</strong> Utilizada: ${musica.utilizada} (${musica.vezesUsada}x)`;
                listaUsadas.appendChild(item);
            });
        }
        listaContainer.appendChild(listaUsadas);

        let tituloNaoUsadas = document.createElement("h3");
        tituloNaoUsadas.textContent = "⚠️ Músicas Nunca Tocadas";
        listaContainer.appendChild(tituloNaoUsadas);

        let listaNaoUsadas = document.createElement("ul");
        if (musicasNaoUsadas.length === 0) {
            listaNaoUsadas.innerHTML = "<p>Nenhuma música nesta categoria.</p>";
        } else {
            musicasNaoUsadas.forEach(musica => {
                let item = document.createElement("li");
                item.innerHTML = `<strong>${musica.nome}</strong> Utilizada: ${musica.utilizada} (${musica.vezesUsada}x)`;
                listaNaoUsadas.appendChild(item);
            });
        }
        listaContainer.appendChild(listaNaoUsadas);

        atualizarBotoesPaginacao();
    }

    function atualizarBotoesPaginacao() {
        paginacaoContainer.innerHTML = "";

        if (totalPaginas > 1) {
            if (paginaAtualAnalytics > 1) {
                let btnAnterior = document.createElement("button");
                btnAnterior.innerHTML = "<span class='material-icons-sharp'>chevron_left</span>";
                btnAnterior.addEventListener("click", function () {
                    if (paginaAtualAnalytics > 1) {
                        paginaAtualAnalytics--;
                        renderizarPagina();
                    }
                });
                paginacaoContainer.appendChild(btnAnterior);
            }

            if (paginaAtualAnalytics < totalPaginas) {
                let btnProximo = document.createElement("button");
                btnProximo.innerHTML = "<span class='material-icons-sharp'>chevron_right</span>";
                btnProximo.addEventListener("click", function () {
                    if (paginaAtualAnalytics < totalPaginas) {
                        paginaAtualAnalytics++;
                        renderizarPagina();
                    }
                });
                paginacaoContainer.appendChild(btnProximo);
            }
        }
    }

    renderizarPagina();
}


// page blocos
document.getElementById("addBloco").addEventListener("click", function () {
    document.getElementById("modal-blocos").style.display = "flex";
});

document.getElementById("fecharModalBloco").addEventListener("click", function () {
    document.getElementById("modal-blocos").style.display = "none";
});

// salvar blocos
let listaBlocos = [];
let paginaBlocosAtual = 1;
const blocosPorPagina = 7;
let blocoEditando = null;

document.getElementById("addBloco").addEventListener("click", function () {
    document.getElementById("modal-blocos").style.display = "flex";
});

document.getElementById("fecharModalBloco").addEventListener("click", function () {
    document.getElementById("modal-blocos").style.display = "none";
});

// Salvar bloco
document.getElementById("salvarBloco").addEventListener("click", function () {
    const nome = document.getElementById("bloco-nome").value.trim();

    if (!nome) {
        showAlert("Por favor, preencha o nome do bloco!", "blocos");
        return;
    }

    const novoBloco = { nome, musicas: [] };

    fetch('/adicionar-bloco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoBloco)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showAlert(data.error, "blocos");
        } else {
            document.getElementById("modal-blocos").style.display = "none";
            carregarBlocos();
        }
    })
    .catch(error => console.error("Erro ao adicionar bloco:", error));
});

let blocoParaExcluir = null;

function carregarBlocos() {
    fetch("/blocos")
        .then(response => response.json())
        .then(blocos => {
            listaBlocos = blocos;
            paginaBlocosAtual = 1; 
            renderizarBlocos();
        })
        .catch(error => console.error("Erro ao carregar blocos:", error));
}

function renderizarBlocos() {
    const lista = document.querySelector("#blocos-list ul");
    if (!lista) {
        console.error("Elemento <ul> não encontrado dentro de #blocos-list");
        return;
    }

    lista.innerHTML = "";

    const inicio = (paginaBlocosAtual - 1) * blocosPorPagina;
    const fim = inicio + blocosPorPagina;
    const blocosPaginados = listaBlocos.slice(inicio, fim);

    if (blocosPaginados.length === 0) {
        lista.innerHTML = "<p>Nenhum bloco disponível.</p>";
        return;
    }

    lista.innerHTML = blocosPaginados.map(bloco =>
        `<li>
            <span><strong>${bloco.nome}</strong></span>
            <div class="music-actions">
                <button class="view-button-bloco" data-nome="${bloco.nome}">👀</button>
                <button class="edit-button-bloco" data-nome="${bloco.nome}">✏️</button>
                <button class="delete-button-bloco" data-nome="${bloco.nome}">🗑️</button>
            </div>
        </li>`
    ).join("");

    document.querySelectorAll(".view-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            exibirRelatorioBloco(this.getAttribute("data-nome"));
        });
    });

    document.querySelectorAll(".delete-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            excluirBloco(this.getAttribute("data-nome"));
        });
    });

    document.querySelectorAll(".edit-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            abrirModalEdicaoBloco(this.getAttribute("data-nome"));
        });
    });

    atualizarBotoesPaginacaoBlocos();
}

function atualizarBotoesPaginacaoBlocos() {
    const paginacaoContainer = document.getElementById("paginacao-blocos");
    paginacaoContainer.innerHTML = "";

    const totalPaginas = Math.ceil(listaBlocos.length / blocosPorPagina);

    if (totalPaginas > 1) {
        if (paginaBlocosAtual > 1) {
            const btnAnterior = document.createElement("button");
            btnAnterior.id = "anterior-blocos";
            btnAnterior.innerHTML = '<span class="material-icons-sharp">chevron_left</span>';
            btnAnterior.addEventListener("click", () => {
                if (paginaBlocosAtual > 1) {
                    paginaBlocosAtual--;
                    renderizarBlocos();
                }
            });
            paginacaoContainer.appendChild(btnAnterior);
        }

        if (paginaBlocosAtual < totalPaginas) {
            const btnProximo = document.createElement("button");
            btnProximo.id = "proximo-blocos";
            btnProximo.innerHTML = '<span class="material-icons-sharp">chevron_right</span>';
            btnProximo.addEventListener("click", () => {
                if (paginaBlocosAtual < totalPaginas) {
                    paginaBlocosAtual++;
                    renderizarBlocos();
                }
            });
            paginacaoContainer.appendChild(btnProximo);
        }
    }
}

// relatorio blocos
function carregarBlocos() {
    fetch("/blocos")
        .then(response => response.json())
        .then(blocos => {
            listaBlocos = blocos;
            paginaBlocosAtual = 1; 
            renderizarBlocos();
        })
        .catch(error => console.error("Erro ao carregar blocos:", error));
}

function renderizarBlocos() {
    const lista = document.querySelector("#blocos-list ul");
    if (!lista) {
        console.error("Elemento <ul> não encontrado dentro de #blocos-list");
        return;
    }

    lista.innerHTML = "";

    const inicio = (paginaBlocosAtual - 1) * blocosPorPagina;
    const fim = inicio + blocosPorPagina;
    const blocosPaginados = listaBlocos.slice(inicio, fim);

    if (blocosPaginados.length === 0) {
        lista.innerHTML = "<p>Nenhum bloco disponível.</p>";
        return;
    }

    lista.innerHTML = blocosPaginados.map(bloco =>
        `<li>
            <span><strong>${bloco.nome}</strong></span>
            <div class="music-actions">
                <button class="view-button-bloco" data-nome="${bloco.nome}">👀</button>
                <button class="edit-button-bloco" data-nome="${bloco.nome}">✏️</button>
                <button class="delete-button-bloco" data-nome="${bloco.nome}">🗑️</button>
            </div>
        </li>`
    ).join("");

    document.querySelectorAll(".view-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            exibirRelatorioBloco(this.getAttribute("data-nome"));
        });
    });

    document.querySelectorAll(".delete-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            excluirBloco(this.getAttribute("data-nome"));
        });
    });

    document.querySelectorAll(".edit-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            abrirModalEdicaoBloco(this.getAttribute("data-nome"));
        });
    });

    atualizarBotoesPaginacaoBlocos();
}

// relatorio blocos
function exibirRelatorioBloco(nomeBloco) {
    const bloco = listaBlocos.find(b => b.nome === nomeBloco);
    if (!bloco) {
        alert("Bloco não encontrado!");
        return;
    }

    let relatorio = `
        <h2>${bloco.nome}</h2>
        <h3>Músicas:</h3>
        
        
        <div class="container-musicas"> 
        <input type="text" id="search-musicas-bloco" placeholder="Buscar música..." onkeyup="filtrarMusicasRelatorio()">
            <ol id="musicas-lista" class="musicas-lista">
    `;

    bloco.musicas.forEach(musica => {
        relatorio += `
            <li class="musica-item">
                <span><strong>${musica.nome}</strong></span><br>
        `;

        if (musica.link && musica.link.trim() !== "") {
            relatorio += `<a href="${musica.link}" target="_blank">🎵 Assistir no YouTube</a>`;
        }

        relatorio += `</li>`;
    });

    relatorio += `
            </ol>
        </div>
    `;

    if (bloco.observacoes && bloco.observacoes.trim() !== "") {
        relatorio += `
            <h3>Observações:</h3>
            <p>${bloco.observacoes}</p>
        `;
    }

    document.getElementById("relatorio-container-bloco").innerHTML = relatorio;
    document.getElementById("relatorio-modal-bloco").style.display = "flex";
}

document.getElementById("fechar-relatorio-bloco").addEventListener("click", () => {
    document.getElementById("relatorio-modal-bloco").style.display = "none";
});

window.addEventListener("click", (e) => {
    const modal = document.getElementById("relatorio-modal-bloco");
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

function filtrarMusicasRelatorio() {
    const termoBusca = document.getElementById("search-musicas-bloco").value.toLowerCase();
    const lista = document.getElementById("musicas-lista");
    const itens = lista.getElementsByTagName("li");

    for (let i = 0; i < itens.length; i++) {
        let nomeMusica = itens[i].getElementsByTagName("strong")[0].innerText.toLowerCase();

        if (nomeMusica.includes(termoBusca)) {
            itens[i].style.display = "";
        } else {
            itens[i].style.display = "none";
        }
    }
}



// Excluir bloco
function excluirBloco(nome) {
    blocoParaExcluir = nome;
    document.getElementById("modal-texto-bloco").innerText = `Tem certeza que deseja excluir o bloco "${nome}"?`;
    document.getElementById("modal-excluir-bloco").style.display = "flex";
}

document.getElementById("confirmar-excluir-bloco").addEventListener("click", function () {
    if (!blocoParaExcluir) {
        console.warn("⚠️ Nenhum bloco selecionado para exclusão.");
        return;
    }

    fetch('/remover-bloco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: blocoParaExcluir })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showAlert(data.error, "blocos");
        } else {
            console.log("✅ Bloco excluído com sucesso!");
            carregarBlocos();
        }
    })
    .catch(error => console.error("❌ Erro ao excluir bloco:", error));

    document.getElementById("modal-excluir-bloco").style.display = "none";
    blocoParaExcluir = null;
});

document.getElementById("cancelar-excluir-bloco").addEventListener("click", function () {
    console.log("❌ Cancelando exclusão do bloco.");
    document.getElementById("modal-excluir-bloco").style.display = "none";
    blocoParaExcluir = null;
});

document.addEventListener("DOMContentLoaded", () => {
    carregarBlocos();
});

// editar blocos
function abrirModalEdicaoBloco(nomeBloco) {
    blocoEditando = listaBlocos.find(bloco => bloco.nome === nomeBloco);

    if (!blocoEditando) {
        console.error("Bloco não encontrado:", nomeBloco);
        return;
    }

    document.getElementById("edit-nome-bloco").value = blocoEditando.nome;

    const listaMusicas = document.getElementById("edit-lista-musicas-bloco");
    listaMusicas.innerHTML = "";

    if (blocoEditando.musicas && blocoEditando.musicas.length > 0) {
        blocoEditando.musicas.forEach((musica) => {
            adicionarInputMusicaBloco(musica.nome, musica.link);
        });
    } else {
        adicionarInputMusicaBloco();
    }

    document.getElementById("modal-editar-bloco").style.display = "flex";
}

let listaMusicasBlocos = []; 

async function carregarMusicasBloco() {
    try {
        const response = await fetch("/form.json");
        if (!response.ok) throw new Error("Erro ao carregar form.json");

        const data = await response.json();
        console.log("📂 Dados carregados do form.json:", data); 

        if (!data.lista || !Array.isArray(data.lista)) {
            throw new Error("⚠️ Estrutura do form.json está incorreta! 'lista' não é um array.");
        }

        listaMusicas = data.lista.map(musica => ({
            nomeCompleto: `${musica.nome} - ${musica.cantor}${musica.tom ? ` (${musica.tom})` : ""}`,
            youtube: musica.youtube || "",
        }));

        console.log("🎵 Lista de músicas formatada:", listaMusicas); 

    } catch (error) {
        console.error("⚠️ Erro ao carregar músicas:", error);
        listaMusicas = []; 
    }
}

// novo input de música - blocos
function adicionarInputMusicaBloco(valor = "", link = "") {
    const listaMusicasBlocos = document.getElementById("edit-lista-musicas-bloco");

    const divMusica = document.createElement("div");
    divMusica.classList.add("musica-item");

    const inputMusica = document.createElement("input");
    inputMusica.type = "text";
    inputMusica.classList.add("musica-input");
    inputMusica.placeholder = "Nome da música";
    inputMusica.value = valor;
    inputMusica.setAttribute("autocomplete", "off");

    const inputLink = document.createElement("input");
    inputLink.type = "url";
    inputLink.classList.add("musica-link");
    inputLink.placeholder = "Link do YouTube";
    inputLink.value = link;

    const botaoRemover = document.createElement("button");
    botaoRemover.textContent = "🗑️";
    botaoRemover.classList.add("remove-musica");

    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown-suggestions");
    document.body.appendChild(dropdown);

    function mostrarSugestoes() {
        dropdown.innerHTML = "";
        const valorDigitado = inputMusica.value.toLowerCase();
    
        if (!Array.isArray(listaMusicas) || listaMusicas.length === 0) {
            console.warn("⚠️ Lista de músicas não carregada ou vazia.");
            return;
        }
    
        const sugestoes = valorDigitado
            ? listaMusicas.filter(musica => musica.nomeCompleto.toLowerCase().includes(valorDigitado))
            : listaMusicas;
    
        if (sugestoes.length === 0) {
            dropdown.style.display = "none";
            return;
        }
    
        sugestoes.forEach(musica => {
            let item = document.createElement("div");
            item.classList.add("dropdown-item");
    
            const tomFormatado = musica.tom ? ` (${musica.tom})` : "";
            item.textContent = `${musica.nomeCompleto}${tomFormatado}`;
    
            item.addEventListener("click", () => {
                inputMusica.value = musica.nomeCompleto;
                inputLink.value = musica.youtube || "";
                dropdown.style.display = "none";
            });
    
            dropdown.appendChild(item);
        });
    
        const rect = inputMusica.getBoundingClientRect();
        const parentRect = inputMusica.closest(".music-entry")?.getBoundingClientRect() || rect;
    
        const isFirstInput = document.querySelector(".music-name") === inputMusica;
        const offsetFix = isFirstInput ? 2 : 0;
    
        dropdown.style.left = `${parentRect.left + window.scrollX + offsetFix}px`;
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.width = `${rect.width}px`;
        dropdown.style.display = "block";
    }
    
    inputMusica.addEventListener("input", mostrarSugestoes);
    inputMusica.addEventListener("focus", mostrarSugestoes);
    
    document.addEventListener("click", (e) => {
        if (!inputMusica.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });
    
    botaoRemover.addEventListener("click", function () {
        divMusica.remove();
        dropdown.remove();
    });

    divMusica.appendChild(inputMusica);
    divMusica.appendChild(inputLink);
    divMusica.appendChild(botaoRemover);
    listaMusicasBlocos.appendChild(divMusica);
}

document.getElementById("adicionar-musica-bloco").addEventListener("click", function () {
    adicionarInputMusicaBloco();
});

document.addEventListener("DOMContentLoaded", async function () {
    await carregarMusicasBloco();
});

// busca blocos
function filtrarBlocos() {
    const termoBusca = document.getElementById("search-bar-blocos").value.toLowerCase();
    console.log("Buscando por:", termoBusca);

    if (termoBusca.trim() === "") {
        console.log("Campo de busca vazio. Restaurando paginação...");
        paginaBlocosAtual = 1; 
        renderizarBlocos();
        return;
    }

    const blocosFiltrados = listaBlocos.filter(bloco =>
        bloco.nome.toLowerCase().includes(termoBusca)
    );

    console.log("Blocos encontrados:", blocosFiltrados);

    renderizarBlocosFiltrados(blocosFiltrados);
}

function renderizarBlocosFiltrados(blocos) {
    const lista = document.querySelector("#blocos-list ul");

    if (!lista) {
        console.error("Elemento <ul> não encontrado dentro de #blocos-list");
        return;
    }

    lista.innerHTML = "";

    if (blocos.length === 0) {
        lista.innerHTML = "<p>Nenhum bloco encontrado.</p>";
        return;
    }

    lista.innerHTML = blocos.map(bloco =>
        `<li>
            <span><strong>${bloco.nome}</strong></span>
            <div class="music-actions">
                <button class="view-button-bloco" data-nome="${bloco.nome}">👀</button>
                <button class="edit-button-bloco" data-nome="${bloco.nome}">✏️</button>
                <button class="delete-button-bloco" data-nome="${bloco.nome}">🗑️</button>
            </div>
        </li>`
    ).join("");

    document.querySelectorAll(".view-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            exibirRelatorioBloco(this.getAttribute("data-nome"));
        });
    });

    document.querySelectorAll(".delete-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            excluirBloco(this.getAttribute("data-nome"));
        });
    });

    document.querySelectorAll(".edit-button-bloco").forEach(button => {
        button.addEventListener("click", function () {
            abrirModalEdicaoBloco(this.getAttribute("data-nome"));
        });
    });

    console.log("Blocos renderizados:", lista.innerHTML);
}


function validarURL(url) {
    const pattern = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/\S*)?$/;
    return pattern.test(url);
}

// Salvar alterações no bloco
document.getElementById("salvar-edicao-bloco").addEventListener("click", function () {
    if (!blocoEditando) {
        console.warn("Nenhum bloco em edição.");
        return;
    }

    const novoNome = document.getElementById("edit-nome-bloco").value.trim();
    if (!novoNome) {
        showAlert("O nome do bloco não pode estar vazio!");
        return;
    }

    const listaMusicasDiv = document.querySelectorAll(".musica-item");
    let linkInvalido = false; 

    const musicas = Array.from(listaMusicasDiv).map(div => {
        const nomeMusicaElem = div.querySelector(".musica-input");
        const linkMusicaElem = div.querySelector(".musica-link");

        const nomeMusica = nomeMusicaElem ? nomeMusicaElem.value.trim() : "";
        const linkMusica = linkMusicaElem ? linkMusicaElem.value.trim() : "";

        if (linkMusica && !validarURL(linkMusica)) {
            showAlert(`O link da música "${nomeMusica}" não é válido. Insira um link correto.`, "erro");
            linkMusicaElem.classList.add("input-invalido"); 
            linkInvalido = true; 
            return null; 
        }

        linkMusicaElem?.classList.remove("input-invalido"); 

        return { nome: nomeMusica, link: linkMusica };
    }).filter(musica => musica && (musica.nome || musica.link));

    if (linkInvalido) return; 

    fetch("/editar-bloco", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            nomeAntigo: blocoEditando.nome,
            novoNome: novoNome,
            musicas: musicas,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showAlert("Erro ao editar bloco: " + data.error, "erro");
        } else {
            blocoEditando.nome = novoNome;
            blocoEditando.musicas = musicas;

            document.getElementById("modal-editar-bloco").style.display = "none";
            carregarBlocos(); 
        }
    })
    .catch(error => {
        console.error("Erro ao enviar edição:", error);
        showAlert("Erro ao editar o bloco.", "erro");
    });
});


document.getElementById("cancelar-edicao-bloco").addEventListener("click", function () {
    document.getElementById("modal-editar-bloco").style.display = "none";
});
















// Exibir dados na tabela
async function carregarEstatisticasTabela() {
    try {
        const response = await fetch("/estatisticas");
        if (!response.ok) throw new Error("Erro ao carregar estatísticas");

        const data = await response.json();
        
        if (data.estatisticaGeral && data.estatisticaGeral.taxaRepeticao !== undefined) {
            const taxaRepeticao = data.estatisticaGeral.taxaRepeticao;
            const statusGeral = data.estatisticaGeral.statusGeral || "Não disponível";

            let corClasse = statusGeral === "Repetitivo" ? "danger" :
                statusGeral === "Moderado" ? "warning" :
                statusGeral === "Variado" ? "success" : "primary"; 

            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; 

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>---</td>
                <td>${taxaRepeticao}</td>
                <td>${aproveitamentoGeral}</td> <!--🔥 Agora pegando o valor correto -->
                <td class="${corClasse}">${statusGeral}</td>
                <td class="primary">Detalhes</td>
            `;

            tbody.appendChild(tr);
        } else {
            console.warn("⚠️ Nenhuma estatística geral encontrada.");
        }
    } catch (error) {
        console.error("⚠️ Erro ao carregar estatísticas:", error);
    }
}


async function inicializar() {
    await carregarDadosEAnalisar(); 
    carregarEstatisticasTabela();   
}

inicializar();



