<?php

include 'php/db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $firstName = trim($_POST['first_name']);
    $lastName - trim($_POST['last_name']);
    $email = trim($_POST['email']);
    $username = trim($_POST['username']);
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirm_password'];


    if (empty($firstName) || empty($lastName) || empty($email) || empty($username) || empty($password) || empty($confirmPassword)) {
        die("Please complete all fields");
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("Email not valid");
    }

    if($password !== $confirmPassword) {
        die("Passwords do not match");
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $checkIfExists = "SELECT id FROM Table_Name WHERE username = ? OR email = ?";
    $stmt = $conn->prepare($checkIfExists);
    $stmt->bind_param("ss", $username, $email);
    $stmt->excute();
    $stmt->store_result();

    if($stmt->num_rows > 0) { 
        die("The username or email already exists");
    }
    $stmt->close();

    $sql = "INSERT INTO Table_Name (first_name, last_name, email, username, password) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->blind_param("sssss", $firstName, $lastName, $email, $username, $hashedPassword);

    if ($stmt->execute()) {
        echo "Account Created!";
        header("Location: index.html");
        exit();
    } else {
        echo "Error creating account" . $stmt->error;
    }

    $stmt->close();
    $conn->close();

}
?>
