<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $prenom = htmlspecialchars($_POST["prenom"]);
    $nom = htmlspecialchars($_POST["nom"]);
    $email = filter_var($_POST["email"], FILTER_SANITIZE_EMAIL);
    $message = htmlspecialchars($_POST["message"]);

    $to = "info@epicerie.roussillon38.fr"; // Remplace par ton adresse
    // $to = "lhutinet@free.fr"; // Remplace par ton adresse
    $subject = "Nouveau message de $prenom $nom";
    $headers = "From: $email\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8";
    $body = "Nom: $prenom $nom\nEmail: $email\nMessage:\n$message";

    if (mail($to, $subject, $body, $headers)) {
        header("Location: Contact.html?success=1");
        exit();
    } else {
        header("Location: Contact.html?error=1");
        exit();
    }
} else {
    echo "Accès interdit.";
}
?>
