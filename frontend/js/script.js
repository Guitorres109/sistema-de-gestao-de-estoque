const API_BASE_URL = 'http://localhost:3000';

const STORAGE_KEYS = {
    token: 'controle_estoque_token',
    usuario: 'controle_estoque_usuario'
};

/*testando*/
console.log("SCRIPT.JS FOI CARREGADO!");


/* =========================================================
   API
   ========================================================= */

class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

async function request(endpoint, options = {}) {

    const {
        method = 'GET',
        body,
        auth = true
    } = options;

    const headers = {
        'Content-Type': 'application/json'
    };

    const token = localStorage.getItem(
        STORAGE_KEYS.token
    );

    if (auth && token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            method,
            headers,
            body: body !== undefined
                ? JSON.stringify(body)
                : undefined
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {

        if (response.status === 401) {
            window.dispatchEvent(
                new Event('sessao-expirada')
            );
        }

        throw new ApiError(
            data?.erro ||
            data?.message ||
            `Erro na requisição (${response.status})`,
            response.status,
            data
        );
    }

    return data;
}


const api = {

    get(endpoint, options = {}) {
        return request(endpoint, {
            ...options,
            method: 'GET'
        });
    },

    post(endpoint, body, options = {}) {
        return request(endpoint, {
            ...options,
            method: 'POST',
            body
        });
    },

    put(endpoint, body, options = {}) {
        return request(endpoint, {
            ...options,
            method: 'PUT',
            body
        });
    },

    delete(endpoint, options = {}) {
        return request(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }

};


/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

async function login(email, senha) {

    const data = await api.post(
        '/auth/login',
        {
            email,
            senha
        },
        {
            auth: false
        }
    );

    localStorage.setItem(
        STORAGE_KEYS.token,
        data.token
    );

    localStorage.setItem(
        STORAGE_KEYS.usuario,
        JSON.stringify(data.usuario)
    );

    return data.usuario;
}


function logout() {

    localStorage.removeItem(
        STORAGE_KEYS.token
    );

    localStorage.removeItem(
        STORAGE_KEYS.usuario
    );

    window.location.href =
        'index.html';
}


function getUsuarioLogado() {

    const raw =
        localStorage.getItem(
            STORAGE_KEYS.usuario
        );

    try {

        return raw
            ? JSON.parse(raw)
            : null;

    } catch {

        return null;
    }
}


function getToken() {

    return localStorage.getItem(
        STORAGE_KEYS.token
    );
}


function isAdministrador() {

    const usuario =
        getUsuarioLogado();

    return usuario?.perfil ===
        'Administrador';
}


function exigirAutenticacao() {

    if (!getToken()) {

        window.location.href =
            'index.html';

        return null;
    }

    return getUsuarioLogado();
}


function redirecionarSeJaLogado() {

    if (getToken()) {

        window.location.href =
            'dashboard.html';
    }
}


window.addEventListener(
    'sessao-expirada',
    () => {

        if (
            !window.location.pathname.endsWith(
                'index.html'
            )
        ) {

            localStorage.removeItem(
                STORAGE_KEYS.token
            );

            localStorage.removeItem(
                STORAGE_KEYS.usuario
            );

            window.location.href =
                'index.html';
        }
    }
);


/* =========================================================
   FUNÇÕES DE INTERFACE
   ========================================================= */

let toastStack = null;

let overlayEl = null;

let modalEl = null;

let onCloseCallback = null;


function getToastStack() {

    if (!toastStack) {

        toastStack =
            document.createElement(
                'div'
            );

        toastStack.className =
            'toast-stack';

        document.body.appendChild(
            toastStack
        );
    }

    return toastStack;
}


function toast(
    message,
    type = 'info',
    duration = 3200
) {

    const stack =
        getToastStack();

    const el =
        document.createElement(
            'div'
        );

    el.className =
        `toast toast-${type}`;

    el.textContent =
        message;

    stack.appendChild(el);

    setTimeout(() => {

        el.style.opacity = '0';

        el.style.transition =
            'opacity 200ms ease';

        setTimeout(() => {

            el.remove();

        }, 200);

    }, duration);
}


function ensureModal() {

    if (overlayEl) {
        return;
    }

    overlayEl =
        document.createElement(
            'div'
        );

    overlayEl.className =
        'modal-overlay';

    overlayEl.innerHTML = `
        <div class="modal panel"></div>
    `;

    document.body.appendChild(
        overlayEl
    );

    modalEl =
        overlayEl.querySelector(
            '.modal'
        );

    overlayEl.addEventListener(
        'click',
        (event) => {

            if (
                event.target ===
                overlayEl
            ) {

                fecharModal();
            }
        }
    );

    document.addEventListener(
        'keydown',
        (event) => {

            if (
                event.key === 'Escape' &&
                overlayEl.classList.contains(
                    'is-open'
                )
            ) {

                fecharModal();
            }
        }
    );
}


function abrirModal(
    html,
    onClose
) {

    ensureModal();

    modalEl.innerHTML =
        html;

    overlayEl.classList.add(
        'is-open'
    );

    onCloseCallback =
        onClose || null;

    const primeiroCampo =
        modalEl.querySelector(
            'input, select, textarea'
        );

    if (primeiroCampo) {

        setTimeout(() => {

            primeiroCampo.focus();

        }, 50);
    }
}


function fecharModal() {

    if (!overlayEl) {
        return;
    }

    overlayEl.classList.remove(
        'is-open'
    );

    if (onCloseCallback) {
        onCloseCallback();
    }
}


function confirmar(
    titulo,
    mensagem,
    rotuloConfirmar = 'Confirmar'
) {

    return new Promise(
        (resolve) => {

            abrirModal(`
                <div class="modal-header">
                    <h3>${titulo}</h3>
                </div>

                <p style="
                    color:var(--ink-300);
                    font-size:0.92rem;
                ">
                    ${mensagem}
                </p>

                <div class="modal-footer">

                    <button
                        class="btn btn-ghost"
                        data-acao="cancelar">
                        Cancelar
                    </button>

                    <button
                        class="btn btn-danger"
                        data-acao="confirmar">
                        ${rotuloConfirmar}
                    </button>

                </div>
            `);

            modalEl
                .querySelector(
                    '[data-acao="cancelar"]'
                )
                .onclick = () => {

                    fecharModal();

                    resolve(false);
                };


            modalEl
                .querySelector(
                    '[data-acao="confirmar"]'
                )
                .onclick = () => {

                    fecharModal();

                    resolve(true);
                };

        }
    );
}


function estadoCarregando(
    container,
    texto = 'Carregando...'
) {

    container.innerHTML = `
        <div class="state-block">

            <div class="spinner"></div>

            <span>
                ${texto}
            </span>

        </div>
    `;
}


function estadoVazio(
    container,
    titulo,
    descricao
) {

    container.innerHTML = `
        <div class="state-block">

            <strong>
                ${titulo}
            </strong>

            <span>
                ${descricao}
            </span>

        </div>
    `;
}


function estadoErro(
    container,
    mensagem,
    tentarNovamente
) {

    container.innerHTML = `
        <div class="state-block">

            <strong>
                Não foi possível carregar os dados
            </strong>

            <span>
                ${mensagem}
            </span>

            <button
                class="btn btn-secondary"
                style="margin-top:8px;">
                Tentar novamente
            </button>

        </div>
    `;

    if (tentarNovamente) {

        container
            .querySelector('button')
            .onclick =
            tentarNovamente;
    }
}


function escaparHtml(valor) {

    const div =
        document.createElement(
            'div'
        );

    div.textContent =
        valor ?? '';

    return div.innerHTML;
}


function formatarData(valor) {

    if (!valor) {
        return '—';
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return String(valor);
    }

    return data.toLocaleString(
        'pt-BR',
        {
            dateStyle: 'short',
            timeStyle: 'short'
        }
    );
}


function debounce(
    fn,
    atraso = 300
) {

    let timer;

    return (...args) => {

        clearTimeout(timer);

        timer = setTimeout(
            () => fn(...args),
            atraso
        );
    };
}


/* =========================================================
   PRODUTOS
   ========================================================= */

let produtosCache = [];

let produtosContainer = null;


async function initProdutos(
    container
) {

    produtosContainer =
        container;

    container.innerHTML = `

        <div class="section-header">

            <h2>
                Produtos
            </h2>

            <p>
                Catálogo de produtos cadastrados na plataforma.
            </p>

        </div>


        <div class="section-toolbar">

            <div class="search-box">

                <input
                    type="search"
                    id="busca-produtos"
                    placeholder="Buscar por nome..."
                />

            </div>


            <button
                class="btn btn-primary"
                id="btn-novo-produto">

                + Novo produto

            </button>

        </div>


        <div class="panel">

            <div
                class="panel-body"
                id="produtos-corpo">
            </div>

        </div>
    `;


    container
        .querySelector(
            '#btn-novo-produto'
        )
        .onclick = () =>
            abrirFormularioProduto();


    container
        .querySelector(
            '#busca-produtos'
        )
        .addEventListener(
            'input',
            debounce(
                (event) => {

                    renderizarTabelaProdutos(
                        filtrarProdutos(
                            event.target.value
                        )
                    );

                },
                220
            )
        );


    await carregarProdutos();
}


async function carregarProdutos() {

    if (!produtosContainer) {
        return;
    }

    const corpo =
        produtosContainer.querySelector(
            '#produtos-corpo'
        );

    estadoCarregando(
        corpo,
        'Carregando produtos...'
    );

    try {

        const data =
            await api.get(
                '/produtos'
            );

        produtosCache =
            Array.isArray(data)
                ? data
                : data?.produtos || [];

        renderizarTabelaProdutos(
            produtosCache
        );

    } catch (error) {

        estadoErro(
            corpo,
            error instanceof ApiError
                ? error.message
                : 'Erro inesperado.',
            carregarProdutos
        );
    }
}


function filtrarProdutos(
    termo
) {

    const busca =
        termo
            .trim()
            .toLowerCase();

    if (!busca) {
        return produtosCache;
    }

    return produtosCache.filter(
        (produto) =>
            (produto.nome || '')
                .toLowerCase()
                .includes(busca)
    );
}


function formatarPreco(
    valor
) {

    const numero =
        Number(valor);

    if (
        Number.isNaN(numero)
    ) {

        return '—';
    }

    return numero.toLocaleString(
        'pt-BR',
        {
            style: 'currency',
            currency: 'BRL'
        }
    );
}


function renderizarTabelaProdutos(
    lista
) {

    const corpo =
        produtosContainer.querySelector(
            '#produtos-corpo'
        );

    if (!lista.length) {

        estadoVazio(
            corpo,
            'Nenhum produto encontrado',
            'Cadastre o primeiro produto para começar.'
        );

        return;
    }


    corpo.innerHTML = `

        <div class="table-wrap">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Nome
                        </th>

                        <th>
                            Preço
                        </th>

                        <th>
                            Estoque
                        </th>

                        <th></th>

                    </tr>

                </thead>


                <tbody>

                    ${lista.map(
                        (produto) => `

                        <tr
                            data-id="${produto.id}">

                            <td>
                                ${escaparHtml(
                                    produto.nome
                                )}
                            </td>

                            <td>
                                ${formatarPreco(
                                    produto.preco
                                )}
                            </td>

                            <td>
                                ${escaparHtml(
                                    produto.quantidade ??
                                    '—'
                                )}
                            </td>

                            <td>

                                <div class="row-actions">

                                    <button
                                        class="btn btn-ghost btn-icon"
                                        data-acao="editar">

                                        ✎

                                    </button>


                                    <button
                                        class="btn btn-ghost btn-icon"
                                        data-acao="excluir">

                                        🗑

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `
                    ).join('')}

                </tbody>

            </table>

        </div>
    `;


    corpo
        .querySelectorAll(
            '[data-acao="editar"]'
        )
        .forEach(
            (botao) => {

                botao.onclick =
                    (event) => {

                        const id =
                            event.target
                                .closest('tr')
                                .dataset.id;

                        const produto =
                            produtosCache.find(
                                (p) =>
                                    String(p.id) ===
                                    id
                            );

                        abrirFormularioProduto(
                            produto
                        );
                    };
            }
        );


    corpo
        .querySelectorAll(
            '[data-acao="excluir"]'
        )
        .forEach(
            (botao) => {

                botao.onclick =
                    async (event) => {

                        const id =
                            event.target
                                .closest('tr')
                                .dataset.id;

                        const produto =
                            produtosCache.find(
                                (p) =>
                                    String(p.id) ===
                                    id
                            );

                        const ok =
                            await confirmar(
                                'Excluir produto',
                                `Deseja excluir "${escaparHtml(
                                    produto?.nome
                                )}"? Esta ação não pode ser desfeita.`,
                                'Excluir'
                            );

                        if (ok) {

                            await excluirProduto(
                                id
                            );
                        }
                    };
            }
        );
}


const CAMPOS_PRODUTO = [

    {
        name: 'nome',
        label: 'Nome do produto',
        type: 'text',
        required: true,
        full: true
    },

    {
        name: 'descricao',
        label: 'Descrição',
        type: 'textarea',
        full: true
    },

    {
        name: 'preco',
        label: 'Preço (R$)',
        type: 'number',
        step: '0.01',
        required: true
    },

    {
        name: 'quantidade',
        label: 'Quantidade em estoque',
        type: 'number',
        required: true
    }

];


function abrirFormularioProduto(
    produto = null
) {

    const editando =
        Boolean(produto);

    abrirModal(`

        <div class="modal-header">

            <h3>
                ${
                    editando
                        ? 'Editar produto'
                        : 'Novo produto'
                }
            </h3>

        </div>


        <form id="form-produto">

            <div class="form-grid">

                ${CAMPOS_PRODUTO.map(
                    (campo) =>
                        campoProdutoHtml(
                            campo,
                            produto
                        )
                ).join('')}

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="btn btn-ghost"
                    data-acao="cancelar">

                    Cancelar

                </button>


                <button
                    type="submit"
                    class="btn btn-primary">

                    ${
                        editando
                            ? 'Salvar alterações'
                            : 'Cadastrar'
                    }

                </button>

            </div>

        </form>
    `);


    modalEl
        .querySelector(
            '[data-acao="cancelar"]'
        )
        .onclick =
        fecharModal;


    document.getElementById(
        'form-produto'
    ).onsubmit =
        (event) =>
            salvarProduto(
                event,
                produto
            );
}


function campoProdutoHtml(
    campo,
    produto
) {

    const valor =
        produto
            ? produto[campo.name] ?? ''
            : '';

    const classe =
        campo.full
            ? 'field-full'
            : '';


    if (
        campo.type ===
        'textarea'
    ) {

        return `

            <div class="field ${classe}">

                <label>
                    ${campo.label}
                </label>

                <textarea
                    name="${campo.name}"
                    rows="2"
                >${escaparHtml(
                    valor
                )}</textarea>

            </div>

        `;
    }


    return `

        <div class="field ${classe}">

            <label>
                ${campo.label}
            </label>

            <input
                name="${campo.name}"
                type="${campo.type}"
                ${campo.step
                    ? `step="${campo.step}"`
                    : ''}
                value="${escaparHtml(
                    valor
                )}"
                ${campo.required
                    ? 'required'
                    : ''}
            />

        </div>

    `;
}


async function salvarProduto(
    event,
    produtoExistente
) {

    event.preventDefault();

    const form =
        event.target;

    const botao =
        form.querySelector(
            'button[type="submit"]'
        );

    const dados =
        Object.fromEntries(
            new FormData(form).entries()
        );


    if (
        dados.preco !==
        undefined
    ) {

        dados.preco =
            Number(
                dados.preco
            );
    }


    if (
        dados.quantidade !==
        undefined
    ) {

        dados.quantidade =
            Number(
                dados.quantidade
            );
    }


    botao.disabled =
        true;

    botao.textContent =
        'Salvando...';


    try {

        if (produtoExistente) {

            await api.put(
                `/produtos/${produtoExistente.id}`,
                dados
            );

            toast(
                'Produto atualizado com sucesso.',
                'success'
            );

        } else {

            await api.post(
                '/produtos',
                dados
            );

            toast(
                'Produto cadastrado com sucesso.',
                'success'
            );
        }


        fecharModal();

        await carregarProdutos();

    } catch (error) {

        toast(
            error instanceof ApiError
                ? error.message
                : 'Erro ao salvar produto.',
            'error'
        );

        botao.disabled =
            false;

        botao.textContent =
            produtoExistente
                ? 'Salvar alterações'
                : 'Cadastrar';
    }
}


async function excluirProduto(
    id
) {

    try {

        await api.delete(
            `/produtos/${id}`
        );

        toast(
            'Produto excluído.',
            'success'
        );

        await carregarProdutos();

    } catch (error) {

        toast(
            error instanceof ApiError
                ? error.message
                : 'Erro ao excluir produto.',
            'error'
        );
    }
}


/* =========================================================
   SAÍDAS
   ========================================================= */

let saidasCache = [];

let saidasContainer = null;


async function initSaidas(
    container
) {

    saidasContainer =
        container;

    container.innerHTML = `

        <div class="section-header">

            <h2>
                Saídas de estoque
            </h2>

            <p>
                Registro de retiradas de produtos do estoque.
            </p>

        </div>


        <div class="section-toolbar">

            <div class="search-box">

                <input
                    type="search"
                    id="busca-saidas"
                    placeholder="Buscar por produto..."
                />

            </div>


            <button
                class="btn btn-primary"
                id="btn-nova-saida">

                + Registrar saída

            </button>

        </div>


        <div class="panel">

            <div
                class="panel-body"
                id="saidas-corpo">
            </div>

        </div>
    `;


    container
        .querySelector(
            '#btn-nova-saida'
        )
        .onclick =
        () =>
            abrirFormularioSaida();


    container
        .querySelector(
            '#busca-saidas'
        )
        .addEventListener(
            'input',
            debounce(
                (event) => {

                    renderizarTabelaSaidas(
                        filtrarSaidas(
                            event.target.value
                        )
                    );

                },
                220
            )
        );


    await carregarProdutosParaSelect();

    await carregarSaidas();
}


async function carregarProdutosParaSelect() {

    try {

        const data =
            await api.get(
                '/produtos'
            );

        produtosCache =
            Array.isArray(data)
                ? data
                : data?.produtos || [];

    } catch {

        produtosCache = [];
    }
}


async function carregarSaidas() {

    if (!saidasContainer) {
        return;
    }

    const corpo =
        saidasContainer.querySelector(
            '#saidas-corpo'
        );

    estadoCarregando(
        corpo,
        'Carregando saídas...'
    );


    try {

        const data =
            await api.get(
                '/saidas'
            );

        saidasCache =
            Array.isArray(data)
                ? data
                : data?.saidas || [];

        renderizarTabelaSaidas(
            saidasCache
        );

    } catch (error) {

        estadoErro(
            corpo,
            error instanceof ApiError
                ? error.message
                : 'Erro inesperado.',
            carregarSaidas
        );
    }
}


function nomeProduto(
    id
) {

    const produto =
        produtosCache.find(
            (p) =>
                String(p.id) ===
                String(id)
        );

    return produto?.nome ||
        `#${id}`;
}


function filtrarSaidas(
    termo
) {

    const busca =
        termo
            .trim()
            .toLowerCase();

    if (!busca) {
        return saidasCache;
    }

    return saidasCache.filter(
        (saida) =>
            nomeProduto(
                saida.produto_id
            )
                .toLowerCase()
                .includes(busca)
    );
}


function renderizarTabelaSaidas(
    lista
) {

    const corpo =
        saidasContainer.querySelector(
            '#saidas-corpo'
        );

    if (!lista.length) {

        estadoVazio(
            corpo,
            'Nenhuma saída registrada',
            'As saídas de estoque aparecerão aqui.'
        );

        return;
    }


    corpo.innerHTML = `

        <div class="table-wrap">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Produto
                        </th>

                        <th>
                            Quantidade
                        </th>

                        <th>
                            Observação
                        </th>

                        <th>
                            Data
                        </th>

                        <th></th>

                    </tr>

                </thead>


                <tbody>

                    ${lista.map(
                        (saida) => `

                        <tr
                            data-id="${saida.id}">

                            <td>
                                ${escaparHtml(
                                    nomeProduto(
                                        saida.produto_id
                                    )
                                )}
                            </td>

                            <td>
                                ${escaparHtml(
                                    saida.quantidade ??
                                    '—'
                                )}
                            </td>

                            <td>
                                ${escaparHtml(
                                    saida.observacao ??
                                    '—'
                                )}
                            </td>

                            <td>
                                ${formatarData(
                                    saida.created_at ||
                                    saida.data
                                )}
                            </td>

                            <td>

                                <div class="row-actions">

                                    <button
                                        class="btn btn-ghost btn-icon"
                                        data-acao="editar">

                                        ✎

                                    </button>


                                    <button
                                        class="btn btn-ghost btn-icon"
                                        data-acao="excluir">

                                        🗑

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `
                    ).join('')}

                </tbody>

            </table>

        </div>
    `;


    corpo
        .querySelectorAll(
            '[data-acao="editar"]'
        )
        .forEach(
            (botao) => {

                botao.onclick =
                    (event) => {

                        const id =
                            event.target
                                .closest('tr')
                                .dataset.id;

                        const saida =
                            saidasCache.find(
                                (s) =>
                                    String(s.id) ===
                                    id
                            );

                        abrirFormularioSaida(
                            saida
                        );
                    };
            }
        );


    corpo
        .querySelectorAll(
            '[data-acao="excluir"]'
        )
        .forEach(
            (botao) => {

                botao.onclick =
                    async (event) => {

                        const id =
                            event.target
                                .closest('tr')
                                .dataset.id;

                        const ok =
                            await confirmar(
                                'Excluir saída',
                                'Deseja excluir este registro de saída?',
                                'Excluir'
                            );

                        if (ok) {

                            await excluirSaida(
                                id
                            );
                        }
                    };
            }
        );
}


function abrirFormularioSaida(
    saida = null
) {

    const editando =
        Boolean(saida);


    const opcoesProduto =
        produtosCache
            .map(
                (produto) => `

                    <option
                        value="${produto.id}"
                        ${
                            String(
                                saida?.produto_id
                            ) ===
                            String(
                                produto.id
                            )
                                ? 'selected'
                                : ''
                        }>

                        ${escaparHtml(
                            produto.nome
                        )}

                    </option>

                `
            )
            .join('');


    abrirModal(`

        <div class="modal-header">

            <h3>
                ${
                    editando
                        ? 'Editar saída'
                        : 'Registrar saída'
                }
            </h3>

        </div>


        <form id="form-saida">

            <div class="field">

                <label>
                    Produto
                </label>

                <select
                    name="produto_id"
                    required>

                    <option
                        value=""
                        disabled
                        ${
                            !saida
                                ? 'selected'
                                : ''
                        }>

                        Selecione um produto

                    </option>

                    ${opcoesProduto}

                </select>

            </div>


            <div class="field">

                <label>
                    Quantidade
                </label>

                <input
                    name="quantidade"
                    type="number"
                    min="1"
                    value="${
                        saida?.quantidade ??
                        ''
                    }"
                    required
                />

            </div>


            <div class="field">

                <label>
                    Observação
                </label>

                <textarea
                    name="observacao"
                    rows="2"
                >${escaparHtml(
                    saida?.observacao ??
                    ''
                )}</textarea>

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="btn btn-ghost"
                    data-acao="cancelar">

                    Cancelar

                </button>


                <button
                    type="submit"
                    class="btn btn-primary">

                    ${
                        editando
                            ? 'Salvar alterações'
                            : 'Registrar'
                    }

                </button>

            </div>

        </form>
    `);


    modalEl
        .querySelector(
            '[data-acao="cancelar"]'
        )
        .onclick =
        fecharModal;


    document.getElementById(
        'form-saida'
    ).onsubmit =
        (event) =>
            salvarSaida(
                event,
                saida
            );
}


async function salvarSaida(
    event,
    saidaExistente
) {

    event.preventDefault();

    const form =
        event.target;

    const botao =
        form.querySelector(
            'button[type="submit"]'
        );

    const dados =
        Object.fromEntries(
            new FormData(form).entries()
        );


    dados.produto_id =
        Number(
            dados.produto_id
        );

    dados.quantidade =
        Number(
            dados.quantidade
        );


    botao.disabled =
        true;

    botao.textContent =
        'Salvando...';


    try {

        if (saidaExistente) {

            await api.put(
                `/saidas/${saidaExistente.id}`,
                dados
            );

            toast(
                'Saída atualizada com sucesso.',
                'success'
            );

        } else {

            await api.post(
                '/saidas',
                dados
            );

            toast(
                'Saída registrada com sucesso.',
                'success'
            );
        }


        fecharModal();

        await carregarSaidas();

    } catch (error) {

        toast(
            error instanceof ApiError
                ? error.message
                : 'Erro ao salvar saída.',
            'error'
        );

        botao.disabled =
            false;

        botao.textContent =
            saidaExistente
                ? 'Salvar alterações'
                : 'Registrar';
    }
}


async function excluirSaida(
    id
) {

    try {

        await api.delete(
            `/saidas/${id}`
        );

        toast(
            'Saída excluída.',
            'success'
        );

        await carregarSaidas();

    } catch (error) {

        toast(
            error instanceof ApiError
                ? error.message
                : 'Erro ao excluir saída.',
            'error'
        );
    }
}


/* =========================================================
   USUÁRIOS
   ========================================================= */

const PERFIS = [
    'Administrador',
    'Operador'
];

let usuariosCache = [];

let usuariosContainer = null;


async function initUsuarios(
    container
) {

    usuariosContainer =
        container;

    container.innerHTML = `

        <div class="section-header">

            <h2>
                Usuários
            </h2>

            <p>
                Gerencie quem tem acesso à plataforma e com qual perfil.
            </p>

        </div>


        <div class="section-toolbar">

            <div class="search-box">

                <input
                    type="search"
                    id="busca-usuarios"
                    placeholder="Buscar por nome ou e-mail..."
                />

            </div>


            <button
                class="btn btn-primary"
                id="btn-novo-usuario">

                + Novo usuário

            </button>

        </div>


        <div class="panel">

            <div
                class="panel-body"
                id="usuarios-corpo">
            </div>

        </div>
    `;


    container
        .querySelector(
            '#btn-novo-usuario'
        )
        .onclick =
        () =>
            abrirFormularioUsuario();


    container
        .querySelector(
            '#busca-usuarios'
        )
        .addEventListener(
            'input',
            debounce(
                (event) => {

                    renderizarTabelaUsuarios(
                        filtrarUsuarios(
                            event.target.value
                        )
                    );

                },
                220
            )
        );


    await carregarUsuarios();
}


async function carregarUsuarios() {

    if (!usuariosContainer) {
        return;
    }

    const corpo =
        usuariosContainer.querySelector(
            '#usuarios-corpo'
        );

    estadoCarregando(
        corpo,
        'Carregando usuários...'
    );


    try {

        const data =
            await api.get(
                '/usuarios'
            );

        usuariosCache =
            Array.isArray(data)
                ? data
                : data?.usuarios || [];

        renderizarTabelaUsuarios(
            usuariosCache
        );

    } catch (error) {

        if (
            error instanceof ApiError &&
            error.status === 403
        ) {

            estadoVazio(
                corpo,
                'Acesso restrito',
                'Somente administradores podem ver esta seção.'
            );

            return;
        }


        estadoErro(
            corpo,
            error instanceof ApiError
                ? error.message
                : 'Erro inesperado.',
            carregarUsuarios
        );
    }
}


function filtrarUsuarios(
    termo
) {

    const busca =
        termo
            .trim()
            .toLowerCase();

    if (!busca) {
        return usuariosCache;
    }

    return usuariosCache.filter(
        (usuario) =>
            (
                usuario.nome ||
                ''
            )
                .toLowerCase()
                .includes(busca)

            ||

            (
                usuario.email ||
                ''
            )
                .toLowerCase()
                .includes(busca)
    );
}


function renderizarTabelaUsuarios(
    lista
) {

    const corpo =
        usuariosContainer.querySelector(
            '#usuarios-corpo'
        );

    if (!lista.length) {

        estadoVazio(
            corpo,
            'Nenhum usuário encontrado',
            'Cadastre o primeiro usuário para começar.'
        );

        return;
    }


    const usuarioAtual =
        getUsuarioLogado();


    corpo.innerHTML = `

        <div class="table-wrap">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Nome
                        </th>

                        <th>
                            E-mail
                        </th>

                        <th>
                            Perfil
                        </th>

                        <th></th>

                    </tr>

                </thead>


                <tbody>

                    ${lista.map(
                        (usuario) => `

                        <tr
                            data-id="${usuario.id}">

                            <td>
                                ${escaparHtml(
                                    usuario.nome
                                )}
                            </td>

                            <td>
                                ${escaparHtml(
                                    usuario.email
                                )}
                            </td>

                            <td>

                                <span
                                    class="badge ${
                                        usuario.perfil ===
                                        'Administrador'
                                            ? 'badge-admin'
                                            : ''
                                    }">

                                    ${escaparHtml(
                                        usuario.perfil
                                    )}

                                </span>

                            </td>


                            <td>

                                <div class="row-actions">

                                    <button
                                        class="btn btn-ghost btn-icon"
                                        data-acao="editar">

                                        ✎

                                    </button>


                                    <button
                                        class="btn btn-ghost btn-icon"
                                        data-acao="excluir"
                                        ${
                                            usuario.id ===
                                            usuarioAtual?.id
                                                ? 'disabled'
                                                : ''
                                        }>

                                        🗑

                                    </button>

                                </div>

                            </td>

                        </tr>

                    `
                    ).join('')}

                </tbody>

            </table>

        </div>
    `;


    corpo
        .querySelectorAll(
            '[data-acao="editar"]'
        )
        .forEach(
            (botao) => {

                botao.onclick =
                    (event) => {

                        const id =
                            event.target
                                .closest('tr')
                                .dataset.id;

                        const usuario =
                            usuariosCache.find(
                                (u) =>
                                    String(
                                        u.id
                                    ) === id
                            );

                        abrirFormularioUsuario(
                            usuario
                        );
                    };
            }
        );


    corpo
        .querySelectorAll(
            '[data-acao="excluir"]:not([disabled])'
        )
        .forEach(
            (botao) => {

                botao.onclick =
                    async (event) => {

                        const id =
                            event.target
                                .closest('tr')
                                .dataset.id;

                        const usuario =
                            usuariosCache.find(
                                (u) =>
                                    String(
                                        u.id
                                    ) === id
                            );

                        const ok =
                            await confirmar(
                                'Excluir usuário',
                                `Deseja excluir "${escaparHtml(
                                    usuario?.nome
                                )}"?`,
                                'Excluir'
                            );

                        if (ok) {

                            await excluirUsuario(
                                id
                            );
                        }
                    };
            }
        );
}


function abrirFormularioUsuario(
    usuario = null
) {

    const editando =
        Boolean(usuario);


    abrirModal(`

        <div class="modal-header">

            <h3>
                ${
                    editando
                        ? 'Editar usuário'
                        : 'Novo usuário'
                }
            </h3>

        </div>


        <form id="form-usuario">

            <div class="field">

                <label>
                    Nome
                </label>

                <input
                    name="nome"
                    type="text"
                    value="${escaparHtml(
                        usuario?.nome ??
                        ''
                    )}"
                    required
                />

            </div>


            <div class="field">

                <label>
                    E-mail
                </label>

                <input
                    name="email"
                    type="email"
                    value="${escaparHtml(
                        usuario?.email ??
                        ''
                    )}"
                    required
                />

            </div>


            <div class="field">

                <label>

                    ${
                        editando
                            ? 'Nova senha (deixe em branco para manter)'
                            : 'Senha'
                    }

                </label>

                <input
                    name="senha"
                    type="password"
                    ${
                        editando
                            ? ''
                            : 'required'
                    }
                    autocomplete="new-password"
                />

            </div>


            <div class="field">

                <label>
                    Perfil
                </label>

                <select
                    name="perfil"
                    required>

                    ${PERFIS.map(
                        (perfil) => `

                            <option
                                value="${perfil}"
                                ${
                                    usuario?.perfil ===
                                    perfil
                                        ? 'selected'
                                        : ''
                                }>

                                ${perfil}

                            </option>

                        `
                    ).join('')}

                </select>

            </div>


            <div class="modal-footer">

                <button
                    type="button"
                    class="btn btn-ghost"
                    data-acao="cancelar">

                    Cancelar

                </button>


                <button
                    type="submit"
                    class="btn btn-primary">

                    ${
                        editando
                            ? 'Salvar alterações'
                            : 'Cadastrar'
                    }

                </button>

            </div>

        </form>
    `);


    modalEl
        .querySelector(
            '[data-acao="cancelar"]'
        )
        .onclick =
        fecharModal;


    document.getElementById(
        'form-usuario'
    ).onsubmit =
        (event) =>
            salvarUsuario(
                event,
                usuario
            );
}


async function salvarUsuario(
    event,
    usuarioExistente
) {

    event.preventDefault();

    const form =
        event.target;

    const botao =
        form.querySelector(
            'button[type="submit"]'
        );

    const dados =
        Object.fromEntries(
            new FormData(form).entries()
        );


    if (
        usuarioExistente &&
        !dados.senha
    ) {

        delete dados.senha;
    }


    botao.disabled =
        true;

    botao.textContent =
        'Salvando...';


    try {

        if (usuarioExistente) {

            await api.put(
                `/usuarios/${usuarioExistente.id}`,
                dados
            );

            toast(
                'Usuário atualizado com sucesso.',
                'success'
            );

        } else {

            await api.post(
                '/usuarios',
                dados
            );

            toast(
                'Usuário cadastrado com sucesso.',
                'success'
            );
        }


        fecharModal();

        await carregarUsuarios();

    } catch (error) {

        toast(
            error instanceof ApiError
                ? error.message
                : 'Erro ao salvar usuário.',
            'error'
        );

        botao.disabled =
            false;

        botao.textContent =
            usuarioExistente
                ? 'Salvar alterações'
                : 'Cadastrar';
    }
}


async function excluirUsuario(
    id
) {

    try {

        await api.delete(
            `/usuarios/${id}`
        );

        toast(
            'Usuário excluído.',
            'success'
        );

        await carregarUsuarios();

    } catch (error) {

        toast(
            error instanceof ApiError
                ? error.message
                : 'Erro ao excluir usuário.',
            'error'
        );
    }
}


/* =========================================================
   LOGS
   ========================================================= */

let logsCache = [];

let logsContainer = null;


async function initLogs(
    container
) {

    logsContainer =
        container;

    container.innerHTML = `

        <div class="section-header">

            <h2>
                Logs do sistema
            </h2>

            <p>
                Histórico de ações registradas na plataforma.
            </p>

        </div>


        <div class="section-toolbar">

            <div class="search-box">

                <input
                    type="search"
                    id="busca-logs"
                    placeholder="Buscar nos registros..."
                />

            </div>


            <button
                class="btn btn-secondary"
                id="btn-atualizar-logs">

                Atualizar

            </button>

        </div>


        <div class="panel">

            <div
                class="panel-body"
                id="logs-corpo">
            </div>

        </div>
    `;


    container
        .querySelector(
            '#btn-atualizar-logs'
        )
        .onclick =
        () =>
            carregarLogs();


    container
        .querySelector(
            '#busca-logs'
        )
        .addEventListener(
            'input',
            debounce(
                (event) => {

                    renderizarListaLogs(
                        filtrarLogs(
                            event.target.value
                        )
                    );

                },
                220
            )
        );


    await carregarLogs();
}


async function carregarLogs() {

    if (!logsContainer) {
        return;
    }

    const corpo =
        logsContainer.querySelector(
            '#logs-corpo'
        );

    estadoCarregando(
        corpo,
        'Carregando logs...'
    );


    try {

        const data =
            await api.get(
                '/logs'
            );

        logsCache =
            Array.isArray(data)
                ? data
                : data?.logs || [];

        renderizarListaLogs(
            logsCache
        );

    } catch (error) {

        if (
            error instanceof ApiError &&
            error.status === 403
        ) {

            estadoVazio(
                corpo,
                'Acesso restrito',
                'Somente administradores podem ver os logs.'
            );

            return;
        }


        estadoErro(
            corpo,
            error instanceof ApiError
                ? error.message
                : 'Erro inesperado.',
            carregarLogs
        );
    }
}


function filtrarLogs(
    termo
) {

    const busca =
        termo
            .trim()
            .toLowerCase();

    if (!busca) {
        return logsCache;
    }

    return logsCache.filter(
        (log) =>
            JSON.stringify(log)
                .toLowerCase()
                .includes(busca)
    );
}


function renderizarListaLogs(
    lista
) {

    const corpo =
        logsContainer.querySelector(
            '#logs-corpo'
        );

    if (!lista.length) {

        estadoVazio(
            corpo,
            'Nenhum log encontrado',
            'As ações registradas no sistema aparecerão aqui.'
        );

        return;
    }


    corpo.innerHTML = `

        <div class="table-wrap">

            <table class="data-table">

                <thead>

                    <tr>

                        <th>
                            Quando
                        </th>

                        <th>
                            Usuário
                        </th>

                        <th>
                            Ação
                        </th>

                        <th>
                            Detalhes
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${lista.map(
                        (log) => {

                            const quando =
                                formatarData(
                                    log.data_hora ||
                                    log.created_at ||
                                    log.data
                                );

                            const usuario =
                                log.usuario_nome ||
                                log.usuario ||
                                log.usuario_id ||
                                '—';

                            const acao =
                                log.acao ||
                                log.tipo ||
                                '—';

                            const detalhes =
                                log.detalhes ||
                                log.mensagem ||
                                log.descricao ||
                                '';


                            return `

                                <tr>

                                    <td>
                                        ${quando}
                                    </td>

                                    <td>
                                        ${escaparHtml(
                                            String(
                                                usuario
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escaparHtml(
                                            String(
                                                acao
                                            )
                                        )}
                                    </td>

                                    <td>
                                        ${escaparHtml(
                                            typeof detalhes ===
                                            'string'
                                                ? detalhes
                                                : JSON.stringify(
                                                    detalhes
                                                )
                                        )}
                                    </td>

                                </tr>

                            `;
                        }
                    ).join('')}

                </tbody>

            </table>

        </div>
    `;
}


/* =========================================================
   DASHBOARD
   ========================================================= */

const SECOES = {

    produtos: {
        init: initProdutos,
        somenteAdmin: false
    },

    saidas: {
        init: initSaidas,
        somenteAdmin: false
    },

    usuarios: {
        init: initUsuarios,
        somenteAdmin: true
    },

    logs: {
        init: initLogs,
        somenteAdmin: true
    }

};


const carregadas =
    new Set();


function iniciais(
    nome = ''
) {

    return nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (parte) =>
                parte[0]?.toUpperCase()
        )
        .join('') || '?';
}


function montarCabecalho(
    usuario
) {

    const nome =
        document.getElementById(
            'user-nome'
        );

    const perfil =
        document.getElementById(
            'user-perfil'
        );

    const avatar =
        document.getElementById(
            'user-avatar'
        );


    if (nome) {
        nome.textContent =
            usuario.nome;
    }


    if (perfil) {
        perfil.textContent =
            usuario.perfil;
    }


    if (avatar) {
        avatar.textContent =
            iniciais(
                usuario.nome
            );
    }
}


function aplicarPermissoes(
    admin
) {

    document
        .querySelectorAll(
            '[data-admin-only]'
        )
        .forEach(
            (elemento) => {

                elemento.hidden =
                    !admin;
            }
        );
}


async function irParaSecao(
    nomeSecao
) {

    const config =
        SECOES[nomeSecao];

    if (!config) {
        return;
    }


    if (
        config.somenteAdmin &&
        !isAdministrador()
    ) {

        toast(
            'Acesso restrito a administradores.',
            'error'
        );

        return;
    }


    document
        .querySelectorAll(
            '.nav-link'
        )
        .forEach(
            (link) => {

                link.classList.toggle(
                    'is-active',
                    link.dataset.secao ===
                    nomeSecao
                );
            }
        );


    document
        .querySelectorAll(
            '.content-section'
        )
        .forEach(
            (elemento) => {

                elemento.hidden =
                    elemento.dataset.secao !==
                    nomeSecao;
            }
        );


    window.location.hash =
        nomeSecao;


    const container =
        document.querySelector(
            `.content-section[data-secao="${nomeSecao}"]`
        );


    if (
        container &&
        !carregadas.has(
            nomeSecao
        )
    ) {

        carregadas.add(
            nomeSecao
        );


        try {

            await config.init(
                container
            );

        } catch (error) {

            carregadas.delete(
                nomeSecao
            );

            toast(
                error instanceof ApiError
                    ? error.message
                    : 'Erro ao carregar a seção.',
                'error'
            );
        }
    }


    document
        .querySelector(
            '.sidebar'
        )
        ?.classList.remove(
            'is-open'
        );
}


function secaoInicial() {

    const hash =
        window.location.hash.replace(
            '#',
            ''
        );

    return SECOES[hash]
        ? hash
        : 'produtos';
}


function iniciarDashboard() {

    const usuario =
        exigirAutenticacao();

    if (!usuario) {
        return;
    }


    const admin =
        isAdministrador();


    montarCabecalho(
        usuario
    );


    aplicarPermissoes(
        admin
    );


    document
        .querySelectorAll(
            '.nav-link[data-secao]'
        )
        .forEach(
            (link) => {

                link.addEventListener(
                    'click',
                    (event) => {

                        event.preventDefault();

                        irParaSecao(
                            link.dataset.secao
                        );
                    }
                );
            }
        );


    const btnLogout =
        document.getElementById(
            'btn-logout'
        );


    if (btnLogout) {

        btnLogout.addEventListener(
            'click',
            logout
        );
    }


    const toggleSidebar =
        document.getElementById(
            'btn-toggle-sidebar'
        );


    if (toggleSidebar) {

        toggleSidebar.addEventListener(
            'click',
            () => {

                document
                    .querySelector(
                        '.sidebar'
                    )
                    ?.classList.toggle(
                        'is-open'
                    );
            }
        );
    }


    irParaSecao(
        secaoInicial()
    );
}


/* =========================================================
   LOGIN
   ========================================================= */

function iniciarLogin() {

    redirecionarSeJaLogado();


    const form =
        document.getElementById(
            'form-login'
        );


    if (!form) {
        return;
    }


    const alerta =
        document.getElementById(
            'login-alerta'
        );


    const botao =
        form.querySelector(
            'button[type="submit"]'
        );


    function mostrarErro(
        mensagem
    ) {

        if (!alerta) {
            return;
        }

        alerta.textContent =
            mensagem;

        alerta.classList.add(
            'is-visible'
        );
    }


    function esconderErro() {

        if (!alerta) {
            return;
        }

        alerta.classList.remove(
            'is-visible'
        );
    }


    form.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            esconderErro();


            const email =
                form.email.value.trim();

            const senha =
                form.senha.value;


            if (
                !email ||
                !senha
            ) {

                mostrarErro(
                    'Informe e-mail e senha para continuar.'
                );

                return;
            }


            botao.disabled =
                true;

            botao.textContent =
                'Entrando...';


            try {

                await login(
                    email,
                    senha
                );

                window.location.href =
                    'dashboard.html';

            } catch (error) {

                mostrarErro(
                    error instanceof ApiError
                        ? error.message
                        : 'Não foi possível entrar. Tente novamente.'
                );

                botao.disabled =
                    false;

                botao.textContent =
                    'Entrar';
            }

        }
    );
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    () => {

        if (
            document.getElementById(
                'form-login'
            )
        ) {

            iniciarLogin();
        }


        if (
            document.querySelector(
                '.content-section'
            )
        ) {

            iniciarDashboard();
        }

    }
);