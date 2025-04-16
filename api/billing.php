<?php
require 'headers.php';
require 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['settings'])) {
        $case_id = $_GET['settings'];

        $sql = 'SELECT * FROM billing_settings WHERE case_id = ?';
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $case_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $settings = $result->fetch_assoc();

        $billing_rates = [];

        if ($settings && isset($settings['billing_rates_id'])) {
            $billing_rates_id = $settings['billing_rates_id'];

            $sql2 = 'SELECT * FROM billing_rate WHERE billing_rates_id = ?';
            $stmt2 = $conn->prepare($sql2);
            $stmt2->bind_param('i', $billing_rates_id);
            $stmt2->execute();
            $result2 = $stmt2->get_result();

            while ($row = $result2->fetch_assoc()) {
                $billing_rates[] = $row;
            }
        }

        echo json_encode([
            'success' => true,
            'settings' => $settings,
            'billing_rate_entries' => $billing_rates
        ]);
        exit;
    }

    $sql = 'SELECT * FROM billing_rates';
    $result = $conn->query($sql);
    
    $rates = [];
    while ($row = $result->fetch_assoc()) {
        $rates[] = $row;
    }

    $rate_id = $_GET['rate_id'] ?? '';
    $where = $rate_id != '' ? 'WHERE rate_id = ?' : '';

    $sql2 = 'SELECT * FROM timekeeper_classifications ' . $where;
    $result2 = $conn->query($sql2);

    $classifications = [];
    while ($row = $result2->fetch_assoc()) {
        $classifications[] = $row;
    }

    echo json_encode([
        'success' => true,
        'billing_rates' => $rates,
        'classifications' => $classifications
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($_GET['settings'])) {
        $case_id = intval($_GET['settings']);

        $billing_rates_id = $input['billing_rates_id'] ?? null;
        $invoice_terms = $input['invoice_terms'] ?? null;
        $client_matter_id = $input['client_matter_id'] ?? null;
        $invoice_template = $input['invoice_template'] ?? null;
        $deposit_destination = $input['deposit_destination'] ?? null;
        $funds_account = $input['funds_account'] ?? null;

        $checkStmt = $conn->prepare("SELECT id FROM billing_settings WHERE case_id = ?");
        $checkStmt->bind_param("i", $case_id);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        if ($result->num_rows > 0) {
            $stmt = $conn->prepare("
                UPDATE billing_settings 
                SET billing_rates_id = ?, invoice_terms = ?, client_matter_id = ?, invoice_template = ?, deposit_destination = ?, funds_account = ?
                WHERE case_id = ?
            ");
            $stmt->bind_param(
                "iisiiii",
                $billing_rates_id,
                $invoice_terms,
                $client_matter_id,
                $invoice_template,
                $deposit_destination,
                $funds_account,
                $case_id
            );
        } else {
            $stmt = $conn->prepare("
                INSERT INTO billing_settings (
                    case_id, billing_rates_id, invoice_terms, client_matter_id, invoice_template, deposit_destination, funds_account
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "iiisiii",
                $case_id,
                $billing_rates_id,
                $invoice_terms,
                $client_matter_id,
                $invoice_template,
                $deposit_destination,
                $funds_account
            );
        }

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'billing_rates_id' => $billing_rates_id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save billing settings']);
        }

        exit;
    }

    if (isset($input['time_increment'], $input['billing_rates_id'])) {
        $time_increment = $input['time_increment'];
        $billing_rates_id = $input['billing_rates_id'];

        if (!is_numeric($time_increment) || !is_numeric($billing_rates_id)) {
            echo json_encode(['success' => false, 'message' => 'Invalid data types']);
            exit;
        }

        $stmt = $conn->prepare('UPDATE billing_rates SET time_increment = ? WHERE id = ?');
        $stmt->bind_param('ii', $time_increment, $billing_rates_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to insert data']);
            exit;
        }
    }

    if (isset($input['user_id'], $input['billing_rates_id'], $input['classification_id'], $input['rate'], $input['timekeeper_id'])) {
        $user_id = $input['user_id'];
        $billing_rates_id = $input['billing_rates_id'];
        $classification_id = $input['classification_id'];
        $rate = $input['rate'];
        $timekeeper_id = $input['timekeeper_id'];

        if (empty($user_id) || empty($billing_rates_id) || empty($classification_id) || empty($rate) || empty($timekeeper_id)) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            exit;
        }

        $stmt = $conn->prepare('
            INSERT INTO billing_rate (user_id, billing_rates_id, classification_id, rate, timekeeper_id)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                classification_id = VALUES(classification_id),
                rate = VALUES(rate),
                billing_rates_id = VALUES(billing_rates_id)
        ');
        $stmt->bind_param('iiiis', $user_id, $billing_rates_id, $classification_id, $rate, $timekeeper_id);    

        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to insert data']);
            exit;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid input']);
        exit;
    }

    $name = $input['name'] ?? '';
    $default = $input['def'] ?? 0;

    if (!$name) {
        echo json_encode([
            'success' => false,
            'message' => 'Missing name'
        ]);
        exit;
    }

    if (intval($default) == 1) {
        $conn->query("UPDATE billing_rates SET def = 0");
    }

    $stmt = $conn->prepare('INSERT INTO billing_rates (name, def) VALUES (?, ?)');
    $stmt->bind_param('si', $name, $default);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'id' => $stmt->insert_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => $stmt->error
        ]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {

}