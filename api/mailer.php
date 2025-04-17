<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function sendEmail($to, $subject, $htmlBody) {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host = 'email-smtp.us-east-1.amazonaws.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'AKIAST6S7JQ4UVK7FDIH'; // SES SMTP username
        $mail->Password = 'BLo4sEPfEHcRAJU4s8TTYCUAm1UqfV7LW/Y3/gFyNAot'; // SES SMTP password
        $mail->SMTPSecure = 'tls'; // STARTTLS encryption
        $mail->Port = 587;         // STARTTLS port

        $mail->setFrom('tnolet@dalyblack.com', 'CaseDB');
        $mail->addAddress($to);
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlBody;

        $mail->send();
        return "Message sent successfully";
    } catch (Exception $e) {
        return "Mailer Error: {$mail->ErrorInfo}";
    }
}
?>