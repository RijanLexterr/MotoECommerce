<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once 'phpmailer/Exception.php';
require_once 'phpmailer/PHPMailer.php';
require_once 'phpmailer/SMTP.php';

/**
 * Send an email using PHPMailer via Gmail SMTP.
 *
 * @param string $to Recipient email address
 * @param string $subject Email subject
 * @param string $body HTML body content
 * @param string $toName (optional) Recipient name
 * @param string $from (optional) Sender email
 * @param string $fromName (optional) Sender name
 * @return bool True if sent successfully, false otherwise
 */
function sendEmail($to, $subject, $body, $toName = '', $from = 'MotorAdmin@gmail.com', $fromName = 'Motor Parts Admin')
{
    $mail = new PHPMailer(true);

    try {
        // SMTP configuration
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'esterecommerce00@gmail.com'; // your Gmail address
        $mail->Password   = 'jcmbobhfxhsznbme ';   // your Gmail App Password
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        // Sender and recipient
        $mail->setFrom($from, $fromName);
        $mail->addAddress($to, $toName);

        // Email content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Email failed: {$mail->ErrorInfo}");
        return false;
    }
}

?>
