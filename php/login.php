<?php

include 'php/db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    if (empty($email) || empty($password)) {
        die("Please enter both email and password.");
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("Invalid email format.");
    }

    $sql = "SELECT id, email, password FROM Table_Name WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        if (password_verify($password, $user['password'])) {
            echo "Login successful! Welcome, " . htmlspecialchars($user['email']) . ".";
            header("Location: index.html");
            exit();


        } else {
            echo "Incorrect email or password.";
        }
    } else {
        echo "Incorrect email or password.";
    }

    $stmt->close();
    $conn->close();
}
?>