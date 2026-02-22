# AtendeMEI - Landing Page Oficial

Este projeto é a *landing page* oficial da **AtendeMEI**, desenvolvida com foco em alta conversão, confiança e suporte especializado para Microempreendedores Individuais (MEI).

## 🚀 Tecnologias Utilizadas

- **HTML5**: Estruturação semântica, acessibilidade e SEO técnico.
- **CSS3 (Vanilla)**: Design moderno utilizando *Glassmorphism*, padrões de responsividade total e animações fluidas.
- **JavaScript (Vanilla)**: Interatividade para o menu mobile, FAQ (Accordion) e animações reativas no carregamento da página (*Intersection Observer*).
- **PHP**: Script nativo para processamento do formulário de contato com envio seguro via função `mail()`.
- **Font Awesome 6**: Ícones vetoriais em alta resolução.

## 📂 Estrutura do Projeto

- `index.html`: Página principal que agrega a apresentação dos serviços, diferenciais e tabela de preços estruturada.
- `contato.html`: Landing page dedicada para suporte, captação direta e formulário robusto.
- `styles.css`: Coração visual do site, com variáveis globais e controle de layout flexbox/grid.
- `script.js`: Core de interações da interface do lado do cliente.
- `enviar_email.php`: *Backend* em PHP responsável por enviar as mensagens do formulário de contato por e-mail, de forma autônoma sem APIs externas.

## 🔧 Configuração e Implantação

1. **Hospedagem Básica**: Basta fazer o upload da pasta completa para a raiz (`public_html` ou `www`) de qualquer servidor web (Hostinger, cPanel, locaweb, etc.).
2. **Formulário de Contato**: O arquivo `enviar_email.php` foi construído no padrão nativo e exige que a hospedagem suporte PHP (v7 ou superior). Lembre-se de abrir o `enviar_email.php` e substituir o e-mail destino (`$para = "contato@atendemei.com";`) para a sua caixa de entrada real.
3. **Links e Contatos**: Não se esqueça de substituir o placeholder da URl `https://wa.me/SEUNUMERO` presente nos botões e no Footer pelo número autêntico do negócio.

## 👨‍💻 Sobre o Repositório

Código fonte mantido para fácil extensão e aplicação de novos modelos da AtendeMEI.
