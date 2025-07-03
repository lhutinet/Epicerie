<?php
$to = "lhutinet@free.fr"; // Remplace par ton adresse
$subject = "Test email";
$message = "Ceci est un test depuis Hostiger";
$headers = "From: infoy@epicerie.roussillon38.fr\r\n"; // Remplace par un email valide de ton domaine

if (mail($to, $subject, $message, $headers)) {
    echo "Email envoyé avec succès.";
} else {
    echo "Échec de l'envoi.";
}
?>
