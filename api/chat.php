<?php
require_once '../config/database.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'];
    $isPublic = $data['is_public'] ? 1 : 0;
    $ownerId = $data['owner_id'];

    $stmt = $db->prepare('INSERT INTO chat_rooms (name, is_public, owner_id) VALUES (?, ?, ?)');
    if ($stmt->execute([$name, $isPublic, $ownerId])) {
        echo json_encode(['success' => true, 'message' => 'Chat room created.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create chat room.']);
    }
} elseif ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM chat_rooms');
    $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rooms);
} else {
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
}
