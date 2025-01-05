<?php
require_once '../config/database.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $roomId = $_GET['room_id'] ?? null;
    $userId = $_GET['user_id'] ?? null;
    $keyword = $_GET['keyword'] ?? null;

    $query = 'SELECT * FROM messages WHERE 1=1';
    $params = [];

    if ($roomId) {
        $query .= ' AND room_id = ?';
        $params[] = $roomId;
    }

    if ($userId) {
        $query .= ' AND user_id = ?';
        $params[] = $userId;
    }

    if ($keyword) {
        $query .= ' AND content LIKE ?';
        $params[] = '%' . $keyword . '%';
    }

    $stmt = $db->prepare($query);
    $stmt->execute($params);

    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($messages);
} else {
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
