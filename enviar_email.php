<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Coleta e sanitização de dados
    $nome = htmlspecialchars(strip_tags(trim($_POST['nome'])));
    $celular = htmlspecialchars(strip_tags(trim($_POST['celular'])));
    $email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
    $assunto_form = htmlspecialchars(strip_tags(trim($_POST['assunto'])));
    $mensagem = htmlspecialchars(strip_tags(trim($_POST['mensagem'])));

    // Validação básica
    if (empty($nome) || empty($celular) || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($assunto_form) || empty($mensagem)) {
        // Redireciona com erro ou carrega uma página de erro
        echo "<script>alert('Por favor, preencha todos os campos corretamente.'); window.history.back();</script>";
        exit;
    }

    // Configurações do E-mail
    $para = "contato@atendemei.com"; // Substitua pelo seu e-mail real
    $assunto = "Novo Contato pelo Site: $nome - $assunto_form";
    
    // Corpo do E-mail
    $corpo = "Você recebeu uma nova mensagem através do site AtendeMEI.\n\n";
    $corpo .= "Detalhes do Contato:\n";
    $corpo .= "Nome: $nome\n";
    $corpo .= "WhatsApp: $celular\n";
    $corpo .= "E-mail: $email\n";
    $corpo .= "Assunto Selecionado: $assunto_form\n\n";
    $corpo .= "Mensagem:\n$mensagem\n";

    // Cabeçalhos (Headers)
    $headers = "From: nao-responda@atendemei.com.br\r\n"; // Substitua pelo domínio real, evita cair no SPAM
    $headers .= "Reply-To: $email\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();

    // Envio do E-mail (Função nativa do PHP)
    if (mail($para, $assunto, $corpo, $headers)) {
        // Sucesso
        $nomeSafe = json_encode("Obrigado, $nome! Sua mensagem foi enviada com sucesso e em breve entraremos em contato.");
        echo "<script>alert($nomeSafe); window.location.href='/contato';</script>";
    } else {
        // Erro de Servidor
        echo "<script>alert('Houve um erro no servidor ao tentar enviar a mensagem. Por favor, tente novamente mais tarde ou nos chame no WhatsApp.'); window.history.back();</script>";
    }
} else {
    // Redirecionar caso alguém acesse o arquivo diretamente pela URL
    header("Location: /contato");
    exit;
}
?>
