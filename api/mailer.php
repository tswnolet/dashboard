<?php
session_start();

function sendEmail($to, $subject, $message) {
    $headers = "From: noreply@dalyblackdata.com\r\n";
    $headers .= "Reply-To: noreply@dalyblackdata.com\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";

    if (mail($to, $subject, $message, $headers)) {
        return 'Message has been sent';
    } else {
        return 'Message could not be sent. Mailer Error: mail() function failed';
    }
}
?>