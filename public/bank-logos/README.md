# Logos dos bancos

Coloque aqui os logos que serão usados nos cartões. Use nomes em minúsculas,
sem espaços ou acentos, correspondentes aos IDs em `src/lib/bank-themes.ts`.

Exemplos: `nubank.svg`, `inter.svg`, `itau.svg`, `bradesco.svg`,
`banco_do_brasil.svg`, `mercado_pago.svg`.

Prefira SVG com fundo transparente e `viewBox` ajustado ao desenho. Isso mantém
o logo nítido em qualquer tamanho. Se só houver imagem raster, use PNG ou WebP
com transparência, de preferência com 512 px de largura para logos horizontais
ou 512 × 512 px para símbolos quadrados. Mantenha a proporção original e uma
pequena margem transparente ao redor. JPG não é indicado para logos porque não
preserva transparência.

O caminho público de `nubank.svg`, por exemplo, será `/bank-logos/nubank.svg`.
Adicionar o arquivo aqui não altera o cartão automaticamente: o componente
atual ainda exibe o texto `mark` configurado em `bank-themes.ts`.
