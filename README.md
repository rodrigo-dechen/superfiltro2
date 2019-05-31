# SuperFiltro2

Esta biblioteca é dedicada a automatisação de fitros para de simples a avançados para formularios ou conteudo do site.

## Como funciona?

A biblioteca consegue atravez de um contexto e uma fonte de dados resolver querys e dederminar a aplicação de efeitos nos elementos neles configurados.

## Como ele faz isso?

Ela trablha com o seguinte esquema

> 1º **Definir o contexto**: onde será aplicado a busca dos dados e onde sera aplicado seus efeirtos

> 2º **Carregando dados**: se os dados não foram passodos a ela é posivel extrailos dos compos no formulario dentro do contexto

> 3º **Localisando os afetados**: busca dentro do contexto as tags com querys.

> 4º **Processamento**: processa e resolve as querys determinando a aplicação do efeito em cima do elemento configurado.

> 5º **Aplicação**: Aplica a ação configurada baseando-se no resultado da query

## Como começo?

Existem duas maneiras de usar o script, pasivamente ou ativamente.

### Ativamente

Você consegue apontar um contexto com jqury e passar dados para ser procesado (opcionalmente), EXP.:

````javascript
// Devine o contesto
const context = $('.context');

// carrega os dados (opciona)
const data = context.serializeArray();

//executa o filtro
context.superFiltro2(data);
````

### Pasivamente

Você consegue atravez de atributos nos elementos configurar suas atuação, EXP.:

````php
<div class="context">

    <select name="filtro" data-sf="change" data-sf-parent=".context" data-sf-input>
        <option value="a">A</option>
        <option value="b">B</option>
        <option value="C">C</option>
    </select>

    <input type="text" data-sf-disabled="<?php echo htmlentities(json_encode([["filtro", "==", "b"]])); ?>">

</div>
````

> OBS.: esse exemplo usa php para faciliar a converção dos entitles mas pode ser usado em html puro lembrando semre de converter as ``"`` (aspas).

Você tem de lembrar que vc tem 4 coisa a definir: **ativações**; **contexto**; **inputs de consulta**; **elementos alvo e efeitos**.

### Ativação

No modo **ativo** você fica livre para construir sua ativação, o clique em um botão, o retorno de de um ajax, etc. No modo **pasivo** voce usa um atributo ``data-sf`` e ele pode ter dois valores `change` ou `click`, e quando colocados em um elemento html ja são altomaticamente configurados para excutar o filtro.

### Contexto

**Ativamente** o contexto é definido pelo elemento jquey que chamou o superfiltro2, como no exemplo a cima. **Pasivamente** o contexto e definido atraves dos atributos `data-sf-parent` ou `data-sf-context`, passando um seletor como jquery. Se usar `data-sf-parent` seleciona o primeiro parent encontrado com o seletor definido, se usar `data-sf-context` seleciona todos os elementos com o seletor configurado.

> OBS.: o contexto será configurado a partir do elemento de ativou o filtro. istó é onde estiver `data-sf="click""` ou `data-sf="change"`, é onde tem de estar o `data-sf-parent` ou `data-sf-context`

Caso o contexto não for definido o script definira o body como contexto.

### Inputs de consulta

Ativamente ou pasivamente quando não definido os dados o script extraira dos elementos imputaveis com o atributo `data-sf-input`.

Nem todo input de consulto precisa ser um elemento de ativação e nem todo elemento de ativação precisa ser um input de consulto. Exp. você consegue configura um filtro onde sera pesquisado de 3 inputs mas é acionado ao clicar em um botão.

### Elementos alvo e efeitos

Ativamente ou pasivamente os elementos alvos e os efeitos são definidos com os atributos: `data-sf-disabled`; `data-sf-enabled`; `data-sf-hide`; `data-sf-show`. O elemento que tiver um ou mais destes atributos sera seu elemento alvo. o efeito sera defindo a partir do atributo escolhido:

- `data-sf-disabled`: disabilita quando a query resolver verdadeiro;
- `data-sf-enabled`: abilita quando a query resolver verdadeiro;
- `data-sf-hide`: esconde quando a query resolver verdadeiro;
- `data-sf-show`: mostra quando a query resolver verdadeiro;

## O que é a query?

A query é um **json** com um **array** definido dentro do atributo de efeito.

A query é executada seguindo as seguintes etapas:

> 1° **Conferencia**: confere a extrutura da query para tentar identificar posiveis erros.

> 2º **Processamento**: processa seu conteudo para construir um objeto que otimisara a resolução da query.

> 3º **Resolução**: resolver a query e devolve o seu resultado.

## Como constrir uma query?

Como ja foi citado a query é um json com um array e nesse array pode conter os seguintes elementos:

````javascript
const elementosPemitidos = [

    // Comparação: é uma array com 3 indices
    ["chaveNoArrayData", "operação", "valorDeComparação"],

    // Grupo: agrupa Compareçoes e operações logicas
    "(", ")",

    // Negação: inverte o resultado corrente durante a resolução
    "!",

    //Operadores Logicos
    "AND", "OR", "XOR", "&&", "||"

];
````

### Comparação

Uma comparação é formada de um array com 3 elementos, o primeiro é a chave no array de dados, o segundo é o comparador e o terceiro é o valor a ser comparado.

Voce pode usar como comparador:

````javascript
const operadoresPermitidos = [

    // Operadores de array
    'IN', 'NOT_IN',

    // Operadores comuns
    '=', '==', '===', 'IS',
    '!=', '!==', 'NOT_IS',
    '>=', '<=', '>', '<',

    // Operadores de atributos
    ':', '!:'
];
````

#### Operadores de array

Nestes operadores o elemento `valorDeComparação` tem de ser um **array** onde a `chaveNoArrayData` que resolvera **positivo** se **estiver inserido** e usar `IN`, e resolvera **positivo** se **não estiver no array** e usar `NOT_IN`

#### Operadores comuns

Estes operadores aceitam valores não arrays com numero, texto e buleanos.

#### Operadores de atributos

Estes operadores conseguem resolver em cima de dois atributos do **input de consulta**, os atributos `disabled` e `visible`, e seus inversos `enabled` e `hidden` respectivamente. São intesenates para disabiliar ou esconder elelmentos quando o input de consulta tambem esta desabilitado ou escondio. EXP.:

````
data-sf-disabled="[["tipo", ":", "disabled"]]"
````

````
data-sf-enabled="[["tipo", "!:", "disabled"]]"
````

### Exemplo de querys

Exemplos em php:

````php
<fieldset data-sf-disabled="<?php echo htmlentities(json_encode([["sexo", "==", "M"], "&&", ["idade", "<", 18]])); ?>">
````

````php
<div data-sf-hide="<?php echo htmlentities(json_encode([["tipo", "IN", ["a", "b"]]])); ?>">
````

````php
<input data-sf-disabled="<?php echo htmlentities(json_encode([["nome", ":", "disable"], "OR", ["nome", "==", ""]])); ?>">
````

````php
<input data-sf-hide="<?php echo htmlentities(json_encode(["(", ["tipo", ":", "enabled"], "AND", ["tipo", "!=", "d"], ")", "OR", ["tipo", "==", "a"]])); ?>">
````

## Dicas

- Usar o **SuperFiltro2** em um `fieldset` ou `form` abilita ou desabilita varios `input` ao mesmo topo.
- Esconder inputs não os desabilitão então quando subimeter o formulario ele ainda serão subimetidos.

## Proximos passos

Iremos incluir o comparador LIKE.

## Agradecimentos 

Ao [lliure](lliure.com.br) pos contem esta biblioteca em seu scripts, e a [Agencia Maketi](agenciamaketi.com.br) que cedeu tempo para desenvolvimento (mesmo sem querer).