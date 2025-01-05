<?php
require_once '../config/database.php';
require_once '../vendor/autoload.php';

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class ChatServer implements MessageComponentInterface {
    protected $clients;
    protected $db;

    public function __construct($db) {
        $this->clients = new \SplObjectStorage;
        $this->db = $db;
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection: ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);

        // Handle messages
        if ($data['action'] === 'send_message') {
            $roomId = $data['room_id'];
            $userId = $data['user_id'];
            $content = $data['content'];

            // Profanity filter
            $filteredContent = $this->filterProfanity($content);

            // Save to database
            $stmt = $this->db->prepare('INSERT INTO messages (content, user_id, room_id) VALUES (?, ?, ?)');
            $stmt->execute([$filteredContent, $userId, $roomId]);

            // Broadcast to other clients
            foreach ($this->clients as $client) {
                if ($from !== $client) {
                    $client->send(json_encode([
                        'sender' => $data['username'],
                        'content' => $filteredContent
                    ]));
                }
            }
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $this->clients->detach($conn);
        echo "Connection {$conn->resourceId} has disconnected\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error occurred: {$e->getMessage()}\n";
        $conn->close();
    }

    private function filterProfanity($message) {
        $apiUrl = "https://www.purgomalum.com/service/json";
        $response = file_get_contents("$apiUrl?text=" . urlencode($message));
        $data = json_decode($response, true);

        return $data['result'] ?? $message;
    }
}

// Start server
$db = require '../config/database.php';
$server = \Ratchet\App::createServer('localhost', 8080);
$server->route('/chat', new ChatServer($db), ['*']);
$server->run();
